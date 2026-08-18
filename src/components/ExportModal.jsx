import { useState, useRef, useEffect, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, CheckCircle, Download, QrCode, Pause, Play, Smartphone, Share2, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { buildFrames } from '../utils/chunkedQr'
import useWakeLock from '../utils/useWakeLock'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { copyToClipboard } from '../utils/clipboard'

function compressMortality(p) {
    return [
        p.ward || '',
        p.bed || '',
        p.name || '',
        p.hospitalNumber || '',
        p.critical ? 1 : 0,
        1, // mortality flag
        p.admissionDate || '',
        p.note || '',
        p.removedAt || '',
        p.lastUpdated || ''
    ]
}

export default function ExportModal({ patients, allPatients, listName, selectionCount, onClose, mortalities = [], discharges = [], dischargesResetDate = '', docs = [] }) {
    const [savedCsv, setSavedCsv] = useState(false)
    const [sharedCode, setSharedCode] = useState(false)
    const [copiedCode, setCopiedCode] = useState(false)
    const [shareError, setShareError] = useState('')
    const [qrMode, setQrMode] = useState('compact') // 'compact' | 'full'
    const effectiveQrMode = listName === 'Notebook' ? 'full' : qrMode

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
    // Format per patient: [ward, bed, name, hospNo, criticalFlag, mortalityFlag, note, removedAt]
    //  - criticalFlag: 1 if critical, else 0
    //  - mortalityFlag: 1 if mortality, else 0
    //  - compact scan only sends biodata, so note/removedAt are empty strings.
    // 1. QR Data: Ultra-compact positional array to keep QR density low.
    // Format per patient: [ward, bed, name, hospNo, criticalFlag, mortalityFlag, note, removedAt]
    const isNotebookExport = listName === 'Notebook' || (docs && docs.length > 0 && patients.length === 0)
    const qrCompressed = isNotebookExport
        ? (docs || []).map(d => [
            d.patientWard || '',
            '',
            d.patientName || '',
            d.patientHosp || '',
            0,
            0,
            d.text || '',
            ''
        ])
        : patients.map((p) => [
            p.ward || '',
            p.bed || '',
            p.name || '',
            p.hospitalNumber || '',
            p.critical ? 1 : 0,
            p.reason === 'mortality' ? 1 : 0,
            '', // no note for compact scan
            ''  // no removedAt for compact scan
        ])
    const qrData = JSON.stringify(qrCompressed)

    // 2. Full Data: Includes everything for Copy/Paste sharing
    const fullCompressed = isNotebookExport
        ? {
            type: 'notebook',
            listName: listName || 'Notebook',
            docs: (docs || []).map(d => ({
                id: d.id || '',
                c: d.color || 'blue',
                diagnosis: d.diagnosis || d.patientDiagnosis || '',
                n: d.patientName || '',
                w: d.patientWard || '',
                h: d.patientHosp || '',
                t: d.text || '',
                ca: d.createdAt || '',
                ua: d.updatedAt || '',
                patientId: d.patientId || ''
            }))
        }
        : patients.map((p) => {
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
    const transferPayload = useMemo(() => {
        const sid = transferSidRef.current
        const isNotebook = listName === 'Notebook' || (docs && docs.length > 0 && patients.length === 0)
        const includedMortalities = (isNotebook || selectionCount > 0) ? [] : (listName === 'Mortalities' ? mortalities : [])

        const transferPatients = isNotebook ? [] : patients.map((p) => {
            return [
                p.ward || '',
                p.bed || '',
                p.name || '',
                p.hospitalNumber || '',
                p.critical ? 1 : 0,
                p.reason === 'mortality' ? 1 : 0,
                p.admissionDate || '',
                p.note || '',
                p.removedAt || '',
                p.lastUpdated || ''
            ]
        })

        const transferMortalities = includedMortalities.map((p) => {
            return [
                p.ward || '',
                p.bed || '',
                p.name || '',
                p.hospitalNumber || '',
                p.critical ? 1 : 0,
                1, // mortality flag
                p.admissionDate || '',
                p.note || '',
                p.removedAt || '',
                p.lastUpdated || ''
            ]
        })

        const transferDocs = isNotebook ? (docs || []).map(d => [
            d.id || '',
            d.color || 'blue',
            d.diagnosis || d.patientDiagnosis || '',
            d.patientName || '',
            d.patientWard || '',
            d.patientHosp || '',
            d.text || '',
            d.createdAt || '',
            d.updatedAt || '',
            d.patientId || ''
        ]) : []

        return {
            __sid: sid,
            __v: 1,
            type: isNotebook ? 'notebook' : 'patients',
            listName: listName || 'Notebook',
            patients: transferPatients,
            mortalities: transferMortalities,
            docs: transferDocs,
        }
    }, [patients, mortalities, docs, listName, selectionCount])

    // 4. Share payload — respects selection.
    const sharePayload = useMemo(() => {
        const isNotebook = listName === 'Notebook' || (docs && docs.length > 0 && patients.length === 0)
        const ptsToShare = selectionCount > 0 ? patients : (allPatients || patients)

        const allFullCompressed = isNotebook ? [] : ptsToShare.map((p) => {
            return [
                p.ward || '',
                p.bed || '',
                p.name || '',
                p.hospitalNumber || '',
                p.critical ? 1 : 0,
                p.reason === 'mortality' ? 1 : 0,
                p.admissionDate || '',
                p.note || '',
                p.removedAt || '',
                p.lastUpdated || ''
            ]
        })

        const shareDocs = isNotebook ? (docs || []).map(d => ({
            id: d.id || '',
            color: d.color || 'blue',
            diagnosis: d.diagnosis || d.patientDiagnosis || '',
            patientName: d.patientName || '',
            patientWard: d.patientWard || '',
            patientHosp: d.patientHosp || '',
            text: d.text || '',
            createdAt: d.createdAt || '',
            updatedAt: d.updatedAt || '',
            patientId: d.patientId || ''
        })) : []

        return {
            type: isNotebook ? 'notebook' : 'patients',
            listName: listName || 'Notebook',
            patients: allFullCompressed,
            mortalities: isNotebook ? [] : (listName === 'Mortalities' ? mortalities.map(compressMortality) : []),
            docs: shareDocs,
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
    const textData = isNotebookExport
        ? (docs || []).map((d) => {
            const parts = []
            if (d.diagnosis || d.patientDiagnosis) parts.push(`Diagnosis: ${d.diagnosis || d.patientDiagnosis}`)
            if (d.patientName) parts.push(`Patient: ${d.patientName}`)
            if (d.patientWard) parts.push(`Ward: ${d.patientWard}`)
            if (d.patientHosp) parts.push(`Hosp: ${d.patientHosp}`)
            let line = parts.join(' | ')
            if (d.text) line += `\nNote: ${d.text}`
            if (d.createdAt) line += `\nDate: ${new Date(d.createdAt).toLocaleString()}`
            return line
        }).join('\n\n')
        : patients
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

    const handleShareCode = async () => {
        setShareError('')
        try {
            const json = JSON.stringify(sharePayload, null, 2)
            const now = new Date()
            const date = now.toISOString().split('T')[0]
            const time = now.toTimeString().split(' ')[0].replace(/:/g, '')
            const cleanListName = (listName || 'handover').replace(/\s+/g, '_')
            const baseName = `HOsNote_Share_${cleanListName}_${date}_${time}`

            if (Capacitor.isNativePlatform()) {
                try {
                    const result = await Filesystem.writeFile({
                        path: `${baseName}.txt`,
                        data: json,
                        directory: Directory.Cache,
                        encoding: Encoding.UTF8,
                    });

                    await Share.share({
                        title: `HOsNote handover — ${listName}`,
                        url: result.uri,
                    });

                    setSharedCode(true);
                    setTimeout(() => setSharedCode(false), 2000);
                    return;
                } catch (e) {
                    console.error('Native file share failed:', e);
                    const textSnippet = `HOsNote Handover (${listName}) - ${patients.length} Patient(s)\n\n` + json;
                    const safeText = textSnippet.length > 2000 ? textSnippet.slice(0, 2000) + '...' : textSnippet;
                    await Share.share({
                        title: `HOsNote handover — ${listName}`,
                        text: safeText,
                    });
                    setSharedCode(true);
                    setTimeout(() => setSharedCode(false), 2000);
                    return;
                }
            }

            let shared = false

            if (navigator.share) {
                // 1. Primary Method: Share as a .txt file with text/plain MIME type.
                // Android allows text/plain files to be shared across virtually all apps (WhatsApp, Drive, Email).
                try {
                    const txtBlob = new Blob([json], { type: 'text/plain;charset=utf-8;' })
                    const txtFile = new File([txtBlob], `${baseName}.txt`, { type: 'text/plain' })

                    let canShareFile = true
                    if (typeof navigator.canShare === 'function') {
                        canShareFile = navigator.canShare({ files: [txtFile] })
                    }

                    if (canShareFile) {
                        await navigator.share({
                            title: `HOsNote handover — ${listName}`,
                            files: [txtFile],
                        })
                        shared = true
                    }
                } catch (err) {
                    // If user cancels the sheet (AbortError), mark as handled so it doesn't trigger download
                    if (err.name === 'AbortError') {
                        return
                    }
                    console.warn('File share failed, trying fallback...', err)
                }

                // 2. Fallback Method: Share summary text + trimmed snippet if file sharing fails
                if (!shared) {
                    try {
                        const textSnippet = `HOsNote Handover (${listName}) - ${patients.length} Patient(s)\n\n` + json
                        // Truncate to safe size (~2KB) if payload is too large for Android text Intent
                        const safeText = textSnippet.length > 2000 ? textSnippet.slice(0, 2000) + '...' : textSnippet

                        await navigator.share({
                            title: `HOsNote handover — ${listName}`,
                            text: safeText,
                        })
                        shared = true
                    } catch (err) {
                        if (err.name === 'AbortError') {
                            return
                        }
                        console.warn('Text share failed...', err)
                    }
                }
            }

            if (shared) {
                setSharedCode(true)
                setTimeout(() => setSharedCode(false), 2000)
                return
            }

            // 3. Last Resort Fallback (Desktop / Unsupported Browsers): Direct JSON File Download
            const jsonBlob = new Blob([json], { type: 'application/json;charset=utf-8;' })
            const url = URL.createObjectURL(jsonBlob)
            const link = document.createElement('a')
            link.setAttribute('href', url)
            link.setAttribute('download', `${baseName}.json`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            setSharedCode(true)
            setTimeout(() => setSharedCode(false), 2000)
        } catch {
            setShareError('Could not share. Please try again.')
        }
    }

    const handleCopyCode = async () => {
        setShareError('')
        try {
            const json = JSON.stringify(sharePayload)
            const ok = await copyToClipboard(json)
            if (ok) {
                setCopiedCode(true)
                setTimeout(() => setCopiedCode(false), 2000)
            } else {
                setShareError('Failed to copy code to clipboard.')
            }
        } catch (err) {
            setShareError('Failed to copy code to clipboard.')
        }
    }

    // Backup: download a full JSON snapshot of the current data. The file is
    // compatible with the Import → Restore flow (restoreFromBackup), so it can
    // be re-imported later to recover patients, mortalities, discharges & docs.
    const handleBackup = async () => {
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
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -1)
        const fileName = `HOsNote_Backup_${listName.replace(/\s+/g, '_')}_${timestamp}.json`;

        if (Capacitor.isNativePlatform()) {
            try {
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: json,
                    directory: Directory.Cache,
                    encoding: Encoding.UTF8,
                });
                await Share.share({
                    title: `HOsNote Backup`,
                    url: result.uri,
                });
                setBackupDone(true)
                setTimeout(() => setBackupDone(false), 2000)
                return;
            } catch (e) {
                console.error("Native backup share failed:", e);
                setShareError("Backup failed. Please try again.");
                return;
            }
        }

        const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', fileName)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        setBackupDone(true)
        setTimeout(() => setBackupDone(false), 2000)
    }

    const downloadCSV = async () => {
        let headers, rows
        if (isNotebookExport) {
            headers = ['Diagnosis', 'PatientName', 'Ward', 'HospitalNumber', 'Notes', 'CreatedAt']
            rows = (docs || []).map(d => [
                `"${(d.diagnosis || d.patientDiagnosis || '').replace(/"/g, '""')}"`,
                `"${(d.patientName || '').replace(/"/g, '""')}"`,
                `"${(d.patientWard || '').replace(/"/g, '""')}"`,
                `"${(d.patientHosp || '').replace(/"/g, '""')}"`,
                `"${(d.text || '').replace(/"/g, '""')}"`,
                `"${d.createdAt ? new Date(d.createdAt).toISOString() : ''}"`
            ])
        } else {
            headers = ['Status', 'Ward', 'Bed', 'Name', 'HospitalNumber', 'Notes', 'Critical', 'RecordedAt']
            rows = patients.map(p => [
                p.reason === 'mortality' ? 'DECEASED' : 'ACTIVE',
                p.ward || '',
                p.bed || '',
                p.name || '',
                p.hospitalNumber || '',
                `"${(p.note || '').replace(/"/g, '""')}"`,
                p.critical ? 'YES' : 'NO',
                p.removedAt ? `"${new Date(p.removedAt).toISOString()}"` : ''
            ])
        }
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const fileName = `Handover_${listName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

        if (Capacitor.isNativePlatform()) {
            try {
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: csvContent,
                    directory: Directory.Cache,
                    encoding: Encoding.UTF8,
                });
                await Share.share({
                    title: `HOsNote CSV`,
                    url: result.uri,
                });
                setSavedCsv(true)
                setTimeout(() => setSavedCsv(false), 2000)
                return;
            } catch (e) {
                console.error("Native CSV share failed:", e);
                return;
            }
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', fileName)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        setSavedCsv(true)
        setTimeout(() => setSavedCsv(false), 2000)
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="modal-backdrop p-2 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box max-w-sm w-full p-0 overflow-hidden flex flex-col h-[88dvh] sm:h-[90vh] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="export-title">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-blue-800 dark:from-gray-900 dark:to-gray-900 px-4 pt-4 pb-3 shrink-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 id="export-title" className="text-xl font-extrabold tracking-tight text-white leading-none mb-1">
                                {listName === 'Notebook' ? 'Notebook Handover' : 'Handover'}
                            </h2>
                            <div className="flex items-center gap-2">
                                <p className="text-[11px] font-semibold text-blue-200/90">
                                    {listName === 'Notebook' ? (
                                        <><span className="font-extrabold text-white">{docs ? docs.length : 0}</span> note{docs && docs.length !== 1 ? 's' : ''}</>
                                    ) : (
                                        <>{listName} · <span className="font-extrabold text-white">{patients.length}</span> patient{patients.length !== 1 ? 's' : ''}</>
                                    )}
                                    {selectionCount > 0 && <span className="ml-1 text-blue-300">(selected)</span>}
                                </p>
                                {wakeSupported && wakeLocked && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                                        <Smartphone size={10} className="animate-pulse" /> Screen on
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            className="w-8 h-8 flex items-center justify-center bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-full shrink-0 transition-colors"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* QR Mode Tabs — hidden in notebook view (always Full Transfer) */}
                    <div className={`flex bg-blue-900/50 dark:bg-gray-800/60 p-1 rounded-xl mt-3 gap-0.5 ${listName === 'Notebook' ? 'invisible' : ''}`}>
                        <button
                            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                                qrMode === 'compact'
                                    ? 'bg-white text-blue-700 shadow-sm'
                                    : 'text-blue-200/80 hover:text-white hover:bg-white/10'
                            }`}
                            onClick={() => setQrMode('compact')}
                        >
                            <QrCode size={13} /> List QR
                        </button>
                        <button
                            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                                qrMode === 'full'
                                    ? 'bg-white text-blue-700 shadow-sm'
                                    : 'text-blue-200/80 hover:text-white hover:bg-white/10'
                            }`}
                            onClick={() => setQrMode('full')}
                        >
                            <QrCode size={13} /> Full Transfer
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 min-h-0 flex flex-col gap-4 p-4 overflow-hidden">

                    {/* QR Display Area */}
                    <div className={`flex-1 min-h-0 flex flex-col items-center justify-center rounded-2xl p-3.5 ${
                        effectiveQrMode === 'full'
                            ? 'bg-blue-50/80 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30'
                            : 'bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/40'
                    }`}>
                        {effectiveQrMode === 'compact' ? (
                            <div className="w-full max-w-[300px] aspect-square bg-white p-3 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-700 flex items-center justify-center">
                                {qrData.length > 2300 ? (
                                    <div className="text-center px-4">
                                        <p className="text-2xl mb-2">⚠️</p>
                                        <p className="text-red-600 dark:text-red-400 text-sm font-bold">List too large for QR.</p>
                                        <p className="text-gray-500 text-xs mt-1">Use Share File instead.</p>
                                    </div>
                                ) : (
                                    <QRCodeSVG value={qrData} size="100%" level="M" style={{ width: '100%', height: '100%' }} includeMargin={false} fgColor="#111827" bgColor="#ffffff" />
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center w-full max-w-[300px]">
                                <div className="w-full flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                                        {frameIdx + 1} / {frames.length}
                                    </span>
                                    {frames.length > 1 && (
                                        <button
                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${
                                                autoPlay
                                                    ? 'bg-blue-700 text-white shadow-sm'
                                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                                            }`}
                                            onClick={() => setAutoPlay(!autoPlay)}
                                        >
                                            {autoPlay ? <Pause size={10} /> : <Play size={10} />}
                                            {autoPlay ? 'Auto' : 'Manual'}
                                        </button>
                                    )}
                                </div>

                                <div className="w-full aspect-square bg-white p-3 rounded-xl shadow-sm border border-blue-200 dark:border-blue-700 relative mb-1.5">
                                    <QRCodeSVG value={frames[frameIdx] || qrData} size="100%" level="M" style={{ width: '100%', height: '100%' }} includeMargin={false} fgColor="#1e3a8a" bgColor="#ffffff" />
                                </div>

                                {autoPlay && (
                                    <div className="flex items-center justify-center gap-1.5 py-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400">Hold still — scanning in progress</span>
                                    </div>
                                )}

                                {frames.length > 1 && !autoPlay && (
                                    <div className="flex w-full gap-2">
                                        <button
                                            className="flex-1 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
                                            onClick={() => setFrameIdx((i) => (i - 1 + frames.length) % frames.length)}
                                        >
                                            <ChevronLeft size={14} /> Prev
                                        </button>
                                        <button
                                            className="flex-1 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
                                            onClick={() => setFrameIdx((i) => (i + 1) % frames.length)}
                                        >
                                            Next <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Primary Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
                                    sharedCode
                                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-md shadow-blue-700/25'
                                }`}
                                onClick={handleShareCode}
                            >
                                {sharedCode ? <CheckCircle size={14} /> : <Share2 size={14} />}
                                {sharedCode ? 'Shared!' : 'Share File'}
                            </button>
                            <button
                                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.97] border-2 ${
                                    copiedCode
                                        ? 'bg-emerald-500 text-white border-emerald-500'
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300'
                                }`}
                                onClick={handleCopyCode}
                            >
                                {copiedCode ? <CheckCircle size={14} /> : <Copy size={14} />}
                                {copiedCode ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>

                        {/* Secondary actions */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                className="py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 rounded-xl font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
                                onClick={handlePrint}
                            >
                                <FileText size={13} className="text-blue-600 dark:text-blue-400" />
                                Save PDF
                            </button>
                            <button
                                className={`py-2 border rounded-xl font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] ${
                                    savedCsv
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300'
                                }`}
                                onClick={downloadCSV}
                            >
                                {savedCsv
                                    ? <><CheckCircle size={13} className="text-emerald-500" /> Saved!</>
                                    : <><Download size={13} className="text-gray-400" /> Save CSV</>
                                }
                            </button>
                        </div>

                        {shareError && (
                            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl px-3 py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                                <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold">{shareError}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
