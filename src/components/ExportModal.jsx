import { useState, useRef, useEffect, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, CheckCircle, ClipboardPaste, QrCode, Pause, Play, Smartphone } from 'lucide-react'
import { buildFrames } from '../utils/chunkedQr'
import useWakeLock from '../utils/useWakeLock'

export default function ExportModal({ patients, listName, selectionCount, onClose, mortalities = [], discharges = [], dischargesResetDate = '', docs = [] }) {
    const [copiedText, setCopiedText] = useState(false)
    const [copiedData, setCopiedData] = useState(false)

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

    // 3. Full Transfer payload: EVERYTHING (incl. notes) for chunked animated QR.
    //    We reuse the same compact object shape as fullCompressed but wrap it in
    //    a transfer envelope so the receiver knows what it is receiving.
    const transferPayload = useMemo(() => {
        const sid = Math.random().toString(36).slice(2, 8).toUpperCase()
        return {
            __sid: sid,
            __v: 1,
            type: 'patients',
            listName,
            patients: fullCompressed,
            mortalities: mortalities.map((p) => {
                const obj = {}
                if (p.ward) obj.w = p.ward
                if (p.bed) obj.b = p.bed
                if (p.name) obj.n = p.name
                if (p.hospitalNumber) obj.h = p.hospitalNumber
                if (p.note) obj.t = p.note
                if (p.critical) obj.c = true
                obj.reason = 'mortality'
                if (p.removedAt) obj.removedAt = p.removedAt
                if (p.lastUpdated) obj.lastUpdated = p.lastUpdated
                if (p.admissionDate) obj.admissionDate = p.admissionDate
                return obj
            }),
            docs,
        }
    }, [fullCompressed, mortalities, docs, listName])

    const { frames, total: frameTotal, bytes } = useMemo(
        () => buildFrames(transferPayload),
        [transferPayload]
    )

    // Animated frame playback state
    const [frameIdx, setFrameIdx] = useState(0)
    const [playing, setPlaying] = useState(true)
    const FRAME_MS = 5000 // dwell time per frame (must be >= scanner fps capture)

    useEffect(() => {
        if (!playing || frames.length <= 1) return
        const t = setInterval(() => {
            setFrameIdx((i) => (i + 1) % frames.length)
        }, FRAME_MS)
        return () => clearInterval(t)
    }, [playing, frames.length])

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

    const handleCopyText = async () => {
        try {
            await navigator.clipboard.writeText(textData)
            setCopiedText(true)
            setTimeout(() => setCopiedText(false), 2500)
        } catch {
            alert(textData)
        }
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
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box max-w-md w-[95%]" role="dialog" aria-modal="true" aria-labelledby="export-title">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 id="export-title" className="font-bold text-gray-900 text-xl">Export Control</h2>
                        <p className="text-gray-500 text-sm mt-0.5">{listName} | {patients.length} Patients</p>
                        {wakeSupported && (
                            <p className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${wakeLocked ? 'text-green-600' : 'text-gray-400'}`}>
                                <Smartphone size={11} className={wakeLocked ? 'animate-pulse' : ''} />
                                {wakeLocked ? 'Screen kept awake' : 'Screen awake (unsupported)'}
                            </p>
                        )}
                    </div>
                    <button
                        id="btn-close-export"
                        className="btn-icon text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:ring-gray-200"
                        onClick={onClose}
                        aria-label="Close export modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* QR Section: Compact + Full Transfer side by side (scroll to view) */}
                <div className="flex gap-3 overflow-x-auto pb-2 mb-4 snap-x">
                    {/* Compact QR */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 shrink-0 w-[260px] snap-start">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <QrCode size={14} /> Compact QR
                        </p>
                        <div className="flex justify-center mb-3">
                            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm inline-block">
                                {qrData.length > 2300 ? (
                                    <div className="w-[240px] h-[240px] flex items-center justify-center text-center p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-100">
                                        <p>⚠️ List too large for QR. Use Copy Code instead.</p>
                                    </div>
                                ) : (
                                    <QRCodeSVG
                                        id="qr-code-svg"
                                        value={qrData}
                                        size={240}
                                        level="L"
                                        includeMargin={false}
                                        fgColor="#111827"
                                        bgColor="#ffffff"
                                    />
                                )}
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-gray-400 italic px-2">
                            Compact QR (excludes notes) for a quick handover scan.
                        </p>
                    </div>

                    {/* Full Transfer: animated chunked QR (includes notes) */}
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 shrink-0 w-[260px] snap-start">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                                <QrCode size={14} /> Full Transfer
                            </p>
                            {frames.length > 1 && (
                                <button
                                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                                    onClick={() => setPlaying((p) => !p)}
                                >
                                    {playing ? <Pause size={13} /> : <Play size={13} />}
                                    {playing ? 'Pause' : 'Play'}
                                </button>
                            )}
                        </div>
                        <div className="flex justify-center mb-2">
                            <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm inline-block relative">
                                <QRCodeSVG
                                    key={frameIdx}
                                    value={frames[frameIdx] || qrData}
                                    size={240}
                                    level="L"
                                    includeMargin={false}
                                    fgColor="#111827"
                                    bgColor="#ffffff"
                                />
                                {playing && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-xl">
                                        <span className="text-xs font-bold text-blue-800 bg-white/90 px-3 py-1.5 rounded-full shadow-sm">
                                            Hold still…
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-blue-700 font-medium">
                            <span>
                                Frame {frameIdx + 1} / {frames.length}
                            </span>
                            <span>~{bytes} B total</span>
                        </div>
                        <p className="text-center text-[10px] text-blue-600/80 italic mt-1.5 px-2">
                            Scan every frame with the Import scanner. It reassembles automatically.
                        </p>
                    </div>
                </div>

                {/* Primary Data Actions */}
                <div className="flex gap-2 mb-4">
                    <button
                        className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
                        onClick={async () => {
                            const fallbackCopy = (text) => {
                                const textArea = document.createElement("textarea");
                                textArea.value = text;
                                textArea.style.position = "fixed";
                                document.body.appendChild(textArea);
                                textArea.focus(); textArea.select();
                                try { return document.execCommand('copy'); } catch { return false; }
                                finally { document.body.removeChild(textArea); }
                            }
                            try {
                                if (navigator.clipboard && window.isSecureContext) {
                                    await navigator.clipboard.writeText(fullData)
                                } else {
                                    if (!fallbackCopy(fullData)) throw new Error()
                                }
                                setCopiedData(true)
                                setTimeout(() => setCopiedData(false), 2000)
                            } catch { alert('Clipboard error') }
                        }}
                    >
                        {copiedData ? <CheckCircle size={18} /> : <ClipboardPaste size={18} />}
                        {copiedData ? 'Copied!' : 'Copy Code'}
                    </button>

                    <button
                        className="btn-secondary flex-1 py-3 text-sm flex items-center justify-center gap-2"
                        onClick={handleCopyText}
                    >
                        {copiedText ? <CheckCircle size={18} /> : <Copy size={18} />}
                        {copiedText ? 'Copied!' : 'Copy Text'}
                    </button>
                </div>

                {/* Secondary Utility Actions - commented out per user request */}
                {/*
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 transition-colors text-xs font-semibold"
                        onClick={downloadCSV}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                        CSV Export
                    </button>

                    <button
                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 transition-colors text-xs font-semibold"
                        onClick={handlePrint}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></svg>
                        Print PDF
                    </button>
                </div>
                */}

                <p className="text-center text-[10px] text-gray-400 italic px-2">
                    Use "Full Transfer" above to send notes & everything via animated QR.
                </p>
            </div>
        </div>
    )
}
