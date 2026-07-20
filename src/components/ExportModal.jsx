import { useState, useRef, useEffect, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, CheckCircle, Download, QrCode, Pause, Play, Smartphone, Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import { buildFrames } from '../utils/chunkedQr'
import useWakeLock from '../utils/useWakeLock'

function compressMortality(p) {
    const row = []
    row.push(p.ward || '')
    row.push(p.bed || '')
    row.push(p.name || '')
    row.push(p.hospitalNumber || '')
    if (p.critical) row.push(1)
    row.push(1) // mortality flag
    if (p.admissionDate) row.push(p.admissionDate)
    if (p.note) row.push(p.note)
    if (p.removedAt) row.push(p.removedAt)
    if (p.lastUpdated) row.push(p.lastUpdated)
    return row
}

export default function ExportModal({ patients, allPatients, listName, selectionCount, onClose, mortalities = [], discharges = [], dischargesResetDate = '', docs = [] }) {
    const [copiedCsv, setCopiedCsv] = useState(false)
    const [backupDone, setBackupDone] = useState(false)
    const [sharedCode, setSharedCode] = useState(false)
    const [shareError, setShareError] = useState('')
    const [qrMode, setQrMode] = useState('compact') // 'compact' | 'full'

    // Stable session id for the Full Transfer animation. It MUST stay constant
    // for the entire lifetime of this modal so every animated frame carries the
    // same sessionId — the receiver keys chunks by sessionId and can only
    // reassemble a transfer when all frames share one id. Generating it inside a
    // useMemo (which re-runs on every render) produced a NEW id per frame, so
    // the receiver could never collect all chunks and the scanner hung on
    // "Scanning…".
    const transferSidRef = useRef(
        Math.random().toString(36).slice(2, 8).toUpperCase()
    )

    // Keep the screen awake while the export QR codes are on screen so the
    // receiver can scan them without the display dimming/sleeping.
    const { supported: wakeSupported, locked: wakeLocked } = useWakeLock(true)

    // 1. QR Data: Ultra-compact positional array to keep QR density low.
    // Format per patient: [ward, bed, name, hospNo, criticalFlag, mortalityFlag, admissionDate]
    //  - criticalFlag: 1 if critical, else omitted
    //  - mortalityFlag: 1 if mortality, else omitted
    //  - lastUpdated is intentionally dropped (not needed for a handover scan)
    const qrCompressed = patients.map((p) => {
        const row = []
        row.push(p.ward || '')
        row.push(p.bed || '')
        row.push(p.name || '')
        row.push(p.hospitalNumber || '')
        if (p.critical) row.push(1)
        if (p.reason === 'mortality') row.push(1)
        if (p.admissionDate) row.push(p.admissionDate)
        return row
    })
    const qrData = JSON.stringify(qrCompressed)

    // 2. Full Data: Includes everything for Copy/Paste sharing
    const fullCompressed = patients.map((p) => {
        const obj = {}
        if (p.id) obj.id = p.id
        if (p.ward) obj.w = p.ward
        if (p.bed) obj.b = p.bed
        if (p.name) obj.n = p.name
        if (p.hospitalNumber) obj.h = p.hospitalNumber
        if (p.note) obj.t = p.note
        if (p.critical) obj.c = true
        if (p.reason === 'mortality') {
            obj.reason = 'mortality'
            obj.removedAt = p.removedAt
        }
        if (p.lastUpdated) obj.lastUpdated = p.lastUpdated
        if (p.admissionDate) obj.admissionDate = p.admissionDate
        return obj
    })
    const fullData = JSON.stringify(fullCompressed)

    // 3. Full Transfer payload (QR animation) — respects selection.
    //    Uses ultra-compact positional arrays to minimize QR density.
    //    Only docs belonging to the exported patients are included.
    const transferPayload = useMemo(() => {
        const sid = transferSidRef.current
        const patientIds = new Set(patients.map(p => p.id))
        const selectedDocs = docs.filter(d => patientIds.has(d.patientId))
        const includedMortalities = selectionCount > 0 ? [] : mortalities

        // Ultra-compact patient array: [ward, bed, name, hospNo, criticalFlag, mortalityFlag, admissionDate, note]
        const transferPatients = patients.map((p) => {
            const row = []
            row.push(p.ward || '')
            row.push(p.bed || '')
            row.push(p.name || '')
            row.push(p.hospitalNumber || '')
            if (p.critical) row.push(1)
            if (p.reason === 'mortality') row.push(1)
            if (p.admissionDate) row.push(p.admissionDate)
            if (p.note) row.push(p.note)
            return row
        })

        // Ultra-compact mortality array: [ward, bed, name, hospNo, criticalFlag, mortalityFlag, admissionDate, note, removedAt, lastUpdated]
        const transferMortalities = includedMortalities.map((p) => {
            const row = []
            row.push(p.ward || '')
            row.push(p.bed || '')
            row.push(p.name || '')
            row.push(p.hospitalNumber || '')
            if (p.critical) row.push(1)
            row.push(1) // mortality flag
            if (p.admissionDate) row.push(p.admissionDate)
            if (p.note) row.push(p.note)
            if (p.removedAt) row.push(p.removedAt)
            if (p.lastUpdated) row.push(p.lastUpdated)
            return row
        })

        // Ultra-compact docs: {pid, n, w, h, t, c, ca, ua}
        // Include patient identity fields so the import side can link docs
        // even when the exported patient carried no `id`.
        const transferDocs = selectedDocs.map((d) => ({
            pid: d.patientId,
            n: d.patientName,
            w: d.patientWard,
            h: d.patientHosp,
            t: d.text,
            c: d.color,
            ca: d.createdAt,
            ua: d.updatedAt,
        }))

        return {
            __sid: sid,
            __v: 1,
            type: 'patients',
            listName,
            patients: transferPatients,
            mortalities: transferMortalities,
            docs: transferDocs,
        }
    }, [patients, mortalities, docs, listName, selectionCount])

    // 4. Share payload — respects selection.
    //    When no patients are selected, share all patients from the current view
    //    (on call / my team). When some patients are selected, share only those.
    const sharePayload = useMemo(() => {
        const ptsToShare = selectionCount > 0 ? patients : (allPatients || patients)
        const allIds = new Set(ptsToShare.map(p => p.id))
        const allFullCompressed = ptsToShare.map((p) => {
            const row = []
            row.push(p.ward || '')
            row.push(p.bed || '')
            row.push(p.name || '')
            row.push(p.hospitalNumber || '')
            if (p.critical) row.push(1)
            if (p.reason === 'mortality') row.push(1)
            if (p.note) row.push(p.note)
            if (p.removedAt) row.push(p.removedAt)
            if (p.lastUpdated) row.push(p.lastUpdated)
            if (p.admissionDate) row.push(p.admissionDate)
            return row
        })
        return {
            type: 'patients',
            listName,
            patients: allFullCompressed,
            mortalities: mortalities.map(compressMortality),
            docs: docs.filter(d => allIds.has(d.patientId)),
        }
    }, [allPatients, patients, mortalities, docs, listName, selectionCount])

    const { frames, total: frameTotal, bytes } = useMemo(
        () => buildFrames(transferPayload),
        [transferPayload]
    )

    // Animated frame playback state
    // Default to autoPlay so the scanner can instantly ingest all frames.
    const [frameIdx, setFrameIdx] = useState(0)
    const [autoPlay, setAutoPlay] = useState(true)
    // 900ms per frame: gives the 20fps scanner ~18 attempts per frame.
    // Fast enough for quick transfers while still reliable.
    const FRAME_MS = 900

    useEffect(() => {
        if (!autoPlay || frames.length <= 1) return
        const t = setInterval(() => {
            setFrameIdx((i) => (i + 1) % frames.length)
        }, FRAME_MS)
        return () => clearInterval(t)
    }, [autoPlay, frames.length])

    // Human-readable text
    const textData = patients
        .map((p) => {
            const parts = []
            if (p.reason === 'mortality') parts.push(`[DECEASED]`)
            if (p.name) parts.push(`Name: ${p.name}`)
            if (p.hospitalNumber) parts.push(`Hosp: ${p.hospitalNumber}`)
            if (p.ward) parts.push(`Ward: ${p.ward}`)
            if (p.bed) parts.push(`Bed: ${p.bed}`)
            let line = parts.join(' | ')
            if (p.note) line += `\nNote: ${p.note}`
            if (p.removedAt) line += `\nRecorded: ${new Date(p.removedAt).toLocaleString()}`
            return line
        })
        .join('\n\n')

    const handleCopyCsv = async () => {
        const headers = ['Status', 'Ward', 'Bed', 'Name', 'HospitalNumber', 'Notes', 'Critical', 'RecordedAt']
        const rows = patients.map(p => [
            p.reason === 'mortality' ? 'DECEASED' : 'ACTIVE',
            p.ward || '',
            p.bed || '',
            p.name || '',
            p.hospitalNumber || '',
            `"${(p.note || '').replace(/"/g, '""')}"`,
            p.critical ? 'YES' : 'NO',
            p.removedAt ? `"${new Date(p.removedAt).toISOString()}"` : ''
        ])
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        try {
            await navigator.clipboard.writeText(csvContent)
            setCopiedCsv(true)
            setTimeout(() => setCopiedCsv(false), 2500)
        } catch {
            alert(csvContent)
        }
    }

    const handleShareCode = async () => {
        setShareError('')
        try {
            const shareText = JSON.stringify(sharePayload)
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `HOsNote handover — ${listName}`,
                        text: shareText,
                    })
                    setSharedCode(true)
                    setTimeout(() => setSharedCode(false), 2000)
                    return
                } catch (err) {
                    // User cancelled the share sheet, or it failed — fall back
                    // to copying the code to the clipboard.
                    if (err && err.name === 'AbortError') {
                        // fall through to clipboard copy
                    }
                }
            }
            // Clipboard fallback (works in all browsers / PWA contexts).
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareText)
            } else {
                const textArea = document.createElement('textarea')
                textArea.value = shareText
                textArea.style.position = 'fixed'
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()
                try {
                    document.execCommand('copy')
                } catch {
                    throw new Error('copy failed')
                } finally {
                    document.body.removeChild(textArea)
                }
            }
            setSharedCode(true)
            setTimeout(() => setSharedCode(false), 2000)
        } catch {
            setShareError('Could not share. Use "Copy Code" and paste it manually.')
        }
    }

    // Backup: download a full JSON snapshot of the current data. The file is
    // compatible with the Import → Restore flow (restoreFromBackup), so it can
    // be re-imported later to recover patients, mortalities, discharges & docs.
    const handleBackup = () => {
        const backup = {
            __type: 'hosnote-backup',
            __v: 1,
            exportedAt: new Date().toISOString(),
            listName,
            patients,
            mortalities,
            discharges,
            docs,
        }
        const json = JSON.stringify(backup, null, 2)
        const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `HOsNote_Backup_${listName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        setBackupDone(true)
        setTimeout(() => setBackupDone(false), 2000)
    }

    const downloadCSV = () => {
        const headers = ['Status', 'Ward', 'Bed', 'Name', 'HospitalNumber', 'Notes', 'Critical', 'RecordedAt']
        const rows = patients.map(p => [
            p.reason === 'mortality' ? 'DECEASED' : 'ACTIVE',
            p.ward || '',
            p.bed || '',
            p.name || '',
            p.hospitalNumber || '',
            `"${(p.note || '').replace(/"/g, '""')}"`,
            p.critical ? 'YES' : 'NO',
            p.removedAt ? `"${new Date(p.removedAt).toISOString()}"` : ''
        ])
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `Handover_${listName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="modal-backdrop p-3" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box max-w-sm w-full p-0 overflow-hidden flex flex-col max-h-[95vh]" role="dialog" aria-modal="true" aria-labelledby="export-title">

                {/* Header — matches app's blue-700 header */}
                <div className="bg-blue-700 dark:bg-gray-900 px-4 pt-4 pb-3 shrink-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 id="export-title" className="text-xl font-extrabold tracking-tight text-white leading-none mb-1">Export List</h2>
                            <div className="flex items-center gap-2">
                                <p className="text-[11px] font-semibold text-blue-200">{listName} • {patients.length} Patient{patients.length !== 1 ? 's' : ''}</p>
                                {wakeSupported && wakeLocked && (
                                    <Smartphone size={12} className="text-emerald-300 animate-pulse" />
                                )}
                            </div>
                        </div>
                        <button
                            className="p-1.5 bg-white/15 hover:bg-white/25 text-white rounded-full shrink-0 transition-colors"
                            onClick={onClose}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* QR Mode Tabs — inside header */}
                    <div className="flex bg-blue-800/50 dark:bg-gray-800/50 p-1 rounded-lg mt-3">
                        <button
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${qrMode === 'compact' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-200 hover:text-white'}`}
                            onClick={() => setQrMode('compact')}
                        >
                            <QrCode size={14} /> Compact Scan
                        </button>
                        <button
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${qrMode === 'full' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-200 hover:text-white'}`}
                            onClick={() => setQrMode('full')}
                        >
                            <QrCode size={14} /> Full Transfer
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-3 p-4 overflow-y-auto">

                    {/* QR Display Area */}
                    <div className={`flex flex-col items-center justify-center rounded-xl p-3 shrink-0 ${qrMode === 'full' ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-gray-50 dark:bg-gray-800/40'}`}>
                        {qrMode === 'compact' ? (
                            <div className="w-full max-w-[320px] aspect-square bg-white p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                {qrData.length > 2300 ? (
                                    <p className="text-red-600 text-sm text-center font-semibold">⚠️ List too large for QR.<br/>Use Share Code.</p>
                                ) : (
                                    <QRCodeSVG value={qrData} size="100%" level="M" style={{ width: '100%', height: '100%' }} includeMargin={false} fgColor="#111827" bgColor="#ffffff" />
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center w-full max-w-[320px]">
                                <div className="w-full flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">Part {frameIdx + 1} of {frames.length}</span>
                                    {frames.length > 1 && (
                                        <button className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${autoPlay ? 'bg-blue-700 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600'}`} onClick={() => setAutoPlay(!autoPlay)}>
                                            {autoPlay ? <Pause size={10} /> : <Play size={10} />}
                                            {autoPlay ? 'Auto' : 'Manual'}
                                        </button>
                                    )}
                                </div>

                                <div className="w-full aspect-square bg-white p-3 rounded-xl shadow-sm border border-blue-200 dark:border-blue-700 relative mb-1">
                                    <QRCodeSVG value={frames[frameIdx] || qrData} size="100%" level="M" style={{ width: '100%', height: '100%' }} includeMargin={false} fgColor="#1e3a8a" bgColor="#ffffff" />
                                </div>

                                {/* "Hold still" indicator lives BELOW the QR — never occludes or blurs it */}
                                {autoPlay && (
                                    <div className="flex items-center justify-center gap-1.5 py-1.5 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                        <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Hold still — scanning in progress</span>
                                    </div>
                                )}

                                {frames.length > 1 && !autoPlay && (
                                    <div className="flex w-full gap-2">
                                        <button className="flex-1 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95" onClick={() => setFrameIdx((i) => (i - 1 + frames.length) % frames.length)}><ChevronLeft size={14} /> Prev</button>
                                        <button className="flex-1 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95" onClick={() => setFrameIdx((i) => (i + 1) % frames.length)}>Next <ChevronRight size={14} /></button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                        <button
                            className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${sharedCode ? 'bg-emerald-500 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-200 dark:shadow-blue-900/30'}`}
                            onClick={handleShareCode}
                        >
                            {sharedCode ? <CheckCircle size={16} /> : <Share2 size={16} />}
                            {sharedCode ? 'Code Shared!' : 'Share Code'}
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                className="py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl font-semibold text-[11px] flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
                                onClick={handleBackup}
                            >
                                {backupDone ? <CheckCircle size={14} className="text-emerald-500" /> : <Download size={14} className="text-gray-500 dark:text-gray-400" />} {backupDone ? 'Saved' : 'Save Backup'}
                            </button>
                            <button
                                className="py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl font-semibold text-[11px] flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
                                onClick={handleCopyCsv}
                            >
                                {copiedCsv ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} className="text-gray-500 dark:text-gray-400" />} {copiedCsv ? 'Copied' : 'Copy CSV'}
                            </button>
                        </div>
                        {shareError && <p className="text-[10px] text-center text-red-500 font-semibold mt-1">{shareError}</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}

