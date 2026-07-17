import { useEffect, useRef, useState } from 'react'
import { X, Camera, Scan, Search, Upload, Smartphone } from 'lucide-react'
import { parseFrame, createReceiver } from '../utils/chunkedQr'
import useWakeLock from '../utils/useWakeLock'

// Supported barcode formats for healthcare scanning
const BARCODE_FORMATS = [
    'QR_CODE',        // 4MyTeam exports, patient info QR codes
    'CODE_128',       // Most common on hospital wristbands
    'CODE_39',        // Common on medical equipment, patient IDs
    'EAN_13',         // Sometimes used on patient wristbands
    'DATA_MATRIX',    // Growing in healthcare, compact data
    'CODE_93',        // Variant of Code 39
    'CODABAR',        // Blood banks, some patient IDs
]

export default function ScannerComponent({ onImport, onLookup, listName, onClose, onRestore }) {
    const scannerRef = useRef(null)
    const mountedRef = useRef(true)
    const [scanMode, setScanMode] = useState('import') // 'import' | 'quick'
    const [cameraMode, setCameraMode] = useState('camera') // 'camera' | 'paste'
    const [pasteData, setPasteData] = useState('')
    const [status, setStatus] = useState('initializing') // 'initializing' | 'scanning' | 'success' | 'error' | 'found'
    const [statusMsg, setStatusMsg] = useState('Starting camera…')
    const [importedCount, setImportedCount] = useState(0)
    const [lastScanned, setLastScanned] = useState(null) // { value, format, timestamp }
    const [scanHistory, setScanHistory] = useState([]) // Array of scanned values in quick mode
    const [detectedFormat, setDetectedFormat] = useState(null)
    const receiverRef = useRef(createReceiver())
    const [transferProgress, setTransferProgress] = useState(null) // { received, total } | null
    const transferTimerRef = useRef(null)
    const [restoreMsg, setRestoreMsg] = useState('')
    const restoreInputRef = useRef(null)

    // Keep the screen awake while scanning/importing so the display doesn't
    // dim or sleep mid-transfer.
    const { supported: wakeSupported, locked: wakeLocked } = useWakeLock(true)

    useEffect(() => {
        if (cameraMode !== 'camera') return
        mountedRef.current = true
        let html5QrCode = null

        const startScanner = async () => {
            try {
                const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
                if (!mountedRef.current) return

                html5QrCode = new Html5Qrcode('qr-reader')
                scannerRef.current = html5QrCode

                // Build formats to support based on scan mode
                let formatsToSupport = null
                if (scanMode === 'quick') {
                    // In quick mode, support all common barcode formats
                    formatsToSupport = BARCODE_FORMATS
                        .filter(f => Html5QrcodeSupportedFormats[f] !== undefined)
                        .map(f => Html5QrcodeSupportedFormats[f])
                }
                // In import mode, default to all formats but prioritize QR

                await html5QrCode.start(
                    { facingMode: 'environment' },
                    {
                        fps: 20,
                        qrbox: { width: 280, height: 280 },
                        aspectRatio: 1.0,
                        formatsToSupport: formatsToSupport,
                    },
                    (decodedText, decodedResult) => {
                        if (!mountedRef.current) return
                        const format = decodedResult?.result?.format?.formatName || 'UNKNOWN'
                        setDetectedFormat(format)

                        // Handle based on scan mode
                        if (scanMode === 'import') {
                            handleImportScan(decodedText)
                        } else {
                            handleQuickScan(decodedText, format)
                        }
                    },
                    () => {
                        // Scan failure – normal, ignore
                    }
                )

                if (mountedRef.current) {
                    setStatus('scanning')
                    setStatusMsg(scanMode === 'import' ? 'Point camera at QR code' : 'Point camera at barcode or QR code')
                }
            } catch (err) {
                if (mountedRef.current) {
                    setStatus('error')
                    setStatusMsg(
                        err.name === 'NotAllowedError'
                            ? 'Camera permission denied. Please allow camera access.'
                            : 'Could not start camera. Please check permissions.'
                    )
                }
            }
        }

        startScanner()

        return () => {
            mountedRef.current = false
            if (scannerRef.current) {
                try {
                    scannerRef.current
                        .stop()
                        .then(() => scannerRef.current?.clear())
                        .catch(() => { })
                } catch (error) {
                    try {
                        scannerRef.current.clear()
                    } catch (e) { }
                }
                scannerRef.current = null
            }
        }
    }, [cameraMode, scanMode])

    const handleImportScan = (decodedText) => {
        // 1. Try chunked-transfer frame first (animated full transfer).
        const frame = parseFrame(decodedText)
        if (frame) {
            const result = receiverRef.current.addFrame(frame)
            if (result.status === 'complete') {
                // Reassembled payload: { type, patients, mortalities, docs, ... }
                const payload = result.payload
                const incoming = [
                    ...(payload.patients || []),
                    ...(payload.mortalities || []),
                ]
                setTransferProgress(null)
                setImportedCount(incoming.length)
                setStatus('success')
                setStatusMsg(`Reassembled ${incoming.length} patient${incoming.length !== 1 ? 's' : ''}! Importing…`)
                setTimeout(() => {
                    if (mountedRef.current) onImport(incoming)
                }, 800)
                return
            }
            if (result.status === 'progress') {
                setTransferProgress({ received: result.received, total: result.total })
                setStatus('scanning')
                setStatusMsg(`Receiving transfer… ${result.received}/${result.total} frames`)
                // Auto-clear progress if no new frames arrive (transfer aborted or
                // a frame was missed). Reset the receiver so the sender can simply
                // restart the Full Transfer from the beginning without being stuck.
                if (transferTimerRef.current) clearTimeout(transferTimerRef.current)
                transferTimerRef.current = setTimeout(() => {
                    if (mountedRef.current) {
                        receiverRef.current.reset()
                        setTransferProgress(null)
                        setStatus('error')
                        setStatusMsg('Transfer stalled — a frame was missed. Restart the Full Transfer from frame 1.')
                        setTimeout(() => {
                            if (mountedRef.current) { setStatus('scanning'); setStatusMsg('Point camera at QR code') }
                        }, 3000)
                    }
                }, 10000)
                return
            }
            if (result.status === 'corrupt') {
                receiverRef.current.reset()
                setTransferProgress(null)
                setStatus('error')
                setStatusMsg('Transfer corrupted. Restart the Full Transfer from the beginning.')
                setTimeout(() => {
                    if (mountedRef.current) { setStatus('scanning'); setStatusMsg('Point camera at QR code') }
                }, 2500)
                return
            }
            return // 'ignored' (shouldn't happen since frame parsed)
        }

        // 2. Fallback: legacy single-QR JSON array.
        try {
            const parsed = JSON.parse(decodedText)
            if (!Array.isArray(parsed)) throw new Error('Not an array')
            setImportedCount(parsed.length)
            setStatus('success')
            setStatusMsg(`Found ${parsed.length} patient${parsed.length !== 1 ? 's' : ''}! Importing…`)

            setTimeout(() => {
                if (mountedRef.current) {
                    onImport(parsed)
                }
            }, 800)
        } catch {
            setStatus('error')
            setStatusMsg('Invalid QR code. Please scan a 4MyTeam export code or switch to Quick Scan mode.')
            setTimeout(() => {
                if (mountedRef.current && status !== 'success') {
                    setStatus('scanning')
                    setStatusMsg('Point camera at QR code')
                }
            }, 2500)
        }
    }

    const handleQuickScan = (decodedText, format) => {
        const cleaned = decodedText.trim()
        if (!cleaned) return

        setLastScanned({ value: cleaned, format, timestamp: new Date() })
        setScanHistory(prev => [{ value: cleaned, format, timestamp: new Date() }, ...prev].slice(0, 10))

        // Try JSON first (4MyTeam format)
        try {
            const parsed = JSON.parse(cleaned)
            if (Array.isArray(parsed)) {
                setStatus('success')
                setStatusMsg(`Found ${parsed.length} patients in QR code!`)
                setTimeout(() => {
                    if (mountedRef.current) onImport(parsed)
                }, 1000)
                return
            }
        } catch {
            // Not JSON, continue with barcode handling
        }

        // Try to extract hospital number from common barcode formats
        // Many hospital wristbands encode: HOSPITAL_NUMBER or NAME|HOSPITAL_NUMBER
        let hospitalNumber = null
        let patientName = null

        // Check for pipe-separated format (Name|HospNo)
        if (cleaned.includes('|')) {
            const parts = cleaned.split('|')
            if (parts.length >= 2) {
                patientName = parts[0].trim()
                hospitalNumber = parts[1].trim()
            }
        } else {
            // Assume it's just a hospital number or patient ID
            hospitalNumber = cleaned
        }

        if (hospitalNumber) {
            // Look up the patient
            const found = onLookup?.(hospitalNumber)
            if (found) {
                setStatus('found')
                setStatusMsg(`Found patient: ${found.name} (${found.hospitalNumber})`)
            } else {
                setStatus('success')
                setStatusMsg(`Scanned: ${hospitalNumber}${patientName ? ` - ${patientName}` : ''}`)
            }
        } else {
            setStatus('success')
            setStatusMsg(`Scanned: ${cleaned}`)
        }

        // Reset status after a delay
        setTimeout(() => {
            if (mountedRef.current) {
                setStatus('scanning')
                setStatusMsg('Point camera at barcode or QR code')
            }
        }, 3000)
    }

    // ── Restore: parse JSON and call parent callback ──────────────────────────
    const handleRestoreFile = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result)
                if (!data.patients && !data.docs) {
                    setRestoreMsg('❌ Invalid backup file.')
                    return
                }
                onRestore?.(data)
                setRestoreMsg('✅ Restore successful!')
                setTimeout(() => setRestoreMsg(''), 4000)
            } catch {
                setRestoreMsg('❌ Could not parse file.')
            }
        }
        reader.readAsText(file)
        // reset so the same file can be re-selected
        e.target.value = ''
    }

    const handlePasteImport = () => {
        const cleaned = pasteData.trim().replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
        if (!cleaned) return

        if (cleaned.includes('4MyTeam Patient List:') || cleaned.includes('Name: ')) {
            setStatus('error')
            setStatusMsg('That looks like the readable "Share Text". Go back to Export and tap "Share Code" / "Copy Code" instead.')
            return
        }

        // Support pasted chunked frames (one per line) for the Full Transfer.
        const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
        const firstFrame = parseFrame(lines[0])
        if (firstFrame && lines.length >= 1) {
            receiverRef.current.reset()
            let completed = null
            for (const line of lines) {
                const f = parseFrame(line)
                if (!f) {
                    setStatus('error')
                    setStatusMsg('One of the pasted lines is not a valid transfer frame.')
                    return
                }
                const r = receiverRef.current.addFrame(f)
                if (r.status === 'complete') completed = r.payload
                if (r.status === 'corrupt') {
                    setStatus('error')
                    setStatusMsg('Transfer corrupted. Paste all frames from the start.')
                    return
                }
            }
            if (completed) {
                const incoming = [...(completed.patients || []), ...(completed.mortalities || [])]
                setStatus('success')
                setStatusMsg(`Loaded ${incoming.length} patient${incoming.length !== 1 ? 's' : ''}! Importing…`)
                setTimeout(() => { if (mountedRef.current) onImport(incoming) }, 600)
                return
            }
            setStatus('error')
            setStatusMsg(`Pasted ${lines.length} frame(s) but the transfer is incomplete. Paste all frames.`)
            return
        }

        try {
            const parsed = JSON.parse(cleaned)
            if (!Array.isArray(parsed)) throw new Error('Not an array')
            setStatus('success')
            setStatusMsg(`Loaded ${parsed.length} patient${parsed.length !== 1 ? 's' : ''}! Importing…`)
            setTimeout(() => { if (mountedRef.current) onImport(parsed) }, 600)
        } catch {
            setStatus('error')
            setStatusMsg('Invalid code. Paste the exact code from "Share Code" / "Copy Code".')
        }
    }

    const handlePasteQuick = () => {
        const cleaned = pasteData.trim().replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
        if (!cleaned) return

        setLastScanned({ value: cleaned, format: 'PASTE', timestamp: new Date() })
        setScanHistory(prev => [{ value: cleaned, format: 'PASTE', timestamp: new Date() }, ...prev].slice(0, 10))

        // Try JSON first
        try {
            const parsed = JSON.parse(cleaned)
            if (Array.isArray(parsed)) {
                onImport(parsed)
                return
            }
        } catch {
            // Not JSON
        }

        // Treat as hospital number
        const hospitalNumber = cleaned.includes('|') ? cleaned.split('|')[1].trim() : cleaned
        onLookup?.(hospitalNumber)
        setPasteData('')
    }

    const statusColors = {
        initializing: 'bg-gray-100 text-gray-600',
        scanning: 'bg-blue-50 text-blue-700',
        success: 'bg-green-50 text-green-700',
        error: 'bg-red-50 text-red-600',
        found: 'bg-purple-50 text-purple-700',
    }

    const formatLabels = {
        'QR_CODE': 'QR Code',
        'CODE_128': 'Barcode (Code 128)',
        'CODE_39': 'Barcode (Code 39)',
        'EAN_13': 'Barcode (EAN-13)',
        'DATA_MATRIX': 'Data Matrix',
        'CODE_93': 'Barcode (Code 93)',
        'CODABAR': 'Barcode (Codabar)',
        'PASTE': 'Pasted Data',
        'UNKNOWN': 'Scanned Code',
    }

    return (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="scanner-title" style={{ maxWidth: '480px' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 id="scanner-title" className="font-bold text-gray-900 text-xl flex items-center gap-2">
                            <Camera size={20} className="text-blue-700" />
                            Import to {listName}
                        </h2>
                        <p className="text-gray-500 text-sm mt-0.5">
                            {scanMode === 'import' ? 'Scan a 4MyTeam QR export code' : 'Scan patient wristband or barcode'}
                        </p>
                        {wakeSupported && (
                            <p className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${wakeLocked ? 'text-green-600' : 'text-gray-400'}`}>
                                <Smartphone size={11} className={wakeLocked ? 'animate-pulse' : ''} />
                                {wakeLocked ? 'Screen kept awake' : 'Screen awake (unsupported)'}
                            </p>
                        )}
                    </div>
                    <button
                        id="btn-close-scanner"
                        className="btn-icon text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:ring-gray-200"
                        onClick={onClose}
                        aria-label="Close scanner"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Mode Selector */}
                <div className="flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1 mb-4">
                    <button
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${scanMode === 'import' ? 'bg-white dark:bg-gray-600 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                        onClick={() => { setScanMode('import'); setStatus('scanning'); setStatusMsg('Point camera at QR code') }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                        Bulk Import
                    </button>
                    <button
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${scanMode === 'quick' ? 'bg-white dark:bg-gray-600 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                        onClick={() => { setScanMode('quick'); setStatus('scanning'); setStatusMsg('Point camera at barcode or QR code') }}
                    >
                        <Scan size={16} />
                        Quick Scan
                    </button>
                </div>

                {/* Single shared file input for restore */}
                <input
                    ref={restoreInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleRestoreFile}
                />

                {cameraMode === 'camera' ? (
                    <>
                        {/* QR/Barcode Viewer */}
                        <div className="rounded-2xl overflow-hidden bg-gray-900 mb-4 relative" style={{ minHeight: 280 }}>
                            <div id="qr-reader" className="w-full" />
                            {status === 'scanning' && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-48 h-48 border-2 border-blue-400/50 rounded-3xl scan-zone-pulse" />
                                </div>
                            )}
                            {status === 'found' && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-48 h-48 border-2 border-purple-400/50 rounded-3xl bg-purple-900/20" />
                                </div>
                            )}
                        </div>

                        {/* Status */}
                        <div className={`rounded-xl px-4 py-3 text-sm font-medium text-center transition-colors mb-4 ${statusColors[status]}`}>
                            {status === 'success' && <span className="mr-1.5">✅</span>}
                            {status === 'error' && <span className="mr-1.5">⚠️</span>}
                            {status === 'found' && <Search size={16} className="inline mr-1.5" />}
                            {statusMsg}
                            {transferProgress && (
                                <div className="mt-2">
                                    <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 transition-all"
                                            style={{ width: `${(transferProgress.received / transferProgress.total) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-blue-700 mt-1">
                                        Full Transfer: {transferProgress.received}/{transferProgress.total} frames
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Last Scanned Info */}
                        {lastScanned && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Scanned</p>
                                        <p className="text-sm font-mono text-gray-900 dark:text-white mt-0.5 break-all">{lastScanned.value}</p>
                                    </div>
                                    <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg font-medium">
                                        {formatLabels[lastScanned.format] || lastScanned.format}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Scan History (Quick Mode) */}
                        {scanMode === 'quick' && scanHistory.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Recent Scans</p>
                                <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                                    {scanHistory.map((scan, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2">
                                            <span className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate flex-1">{scan.value}</span>
                                            <span className="text-xs text-gray-400 ml-2">{formatLabels[scan.format] || scan.format}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                                <button
                                    className="btn-primary w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-none"
                                    onClick={() => setCameraMode('paste')}
                                >
                                    Paste Share Code Instead
                                </button>
                            {onRestore && (
                                <button
                                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 transition-colors text-xs font-semibold"
                                    onClick={() => restoreInputRef.current?.click()}
                                >
                                    <Upload size={14} />
                                    Restore Backup
                                </button>
                            )}
                            <button className="btn-secondary w-full" onClick={onClose}>
                                Cancel
                            </button>
                        </div>
                        {restoreMsg && (
                            <p className="text-xs text-center mt-2 font-medium text-gray-600">{restoreMsg}</p>
                        )}
                    </>
                ) : (
                    <>
                        <div className="mb-4">
                            <textarea
                                className="input-field text-sm font-mono h-32 resize-none"
                                placeholder={scanMode === 'import'
                                    ? 'Paste the Share Code / Copy Code from Export here...'
                                    : 'Paste barcode value or hospital number here...'}
                                value={pasteData}
                                onChange={(e) => setPasteData(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                className="btn-primary w-full"
                                disabled={!pasteData.trim()}
                                onClick={scanMode === 'import' ? handlePasteImport : handlePasteQuick}
                            >
                                {scanMode === 'import' ? 'Import Code' : 'Lookup / Add Patient'}
                            </button>
                            {onRestore && (
                                <button
                                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 transition-colors text-xs font-semibold"
                                    onClick={() => restoreInputRef.current?.click()}
                                >
                                    <Upload size={14} />
                                    Restore Backup
                                </button>
                            )}
                            <button
                                className="btn-secondary w-full border-none text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                onClick={() => { setPasteData(''); setCameraMode('camera') }}
                            >
                                Use Camera Instead
                            </button>
                        </div>
                        {restoreMsg && (
                            <p className="text-xs text-center mt-2 font-medium text-gray-600">{restoreMsg}</p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
