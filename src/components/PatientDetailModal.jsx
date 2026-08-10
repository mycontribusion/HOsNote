import { useState } from 'react'
import { X, Pencil, FileText, CheckCircle2, Copy, Check, Calendar, Clock, AlertTriangle } from 'lucide-react'
import SuffixedValue from './SuffixedValue'

export default function PatientDetailModal({
    patient,
    onClose,
    onEdit,
    onDocument,
    onToggleSelect,
    isSelected = false,
    docCount = 0,
    isMortality = false
}) {
    if (!patient) return null

    const { id, name, hospitalNumber, ward, bed, diagnosis, note, critical, removedAt, lastUpdated, admissionDate } = patient
    const [copied, setCopied] = useState(false)

    let durationText = ''
    if (admissionDate && !isMortality) {
        let diffMs = Date.now() - new Date(admissionDate).getTime()
        if (diffMs < 0) diffMs = 0
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        durationText = `${days} day${days !== 1 ? 's' : ''}`
    }

    const handleCopy = () => {
        const fullText = [
            name ? `Patient: ${name}` : '',
            hospitalNumber ? `Hosp #: ${hospitalNumber}` : '',
            ward || bed ? `Location: ${ward} ${bed}` : '',
            diagnosis ? `Diagnosis: ${diagnosis}` : '',
            note ? `Note:\n${note}` : ''
        ].filter(Boolean).join('\n')

        navigator.clipboard.writeText(fullText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div
            className="modal-backdrop z-50"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="modal-box max-w-lg w-[95%] p-0 overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="patient-detail-title"
            >
                {/* Modal Header */}
                <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-start justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Ward / Bed badge */}
                        <div className="flex flex-col items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 px-2.5 py-1.5 min-w-[54px] text-center shrink-0">
                            {ward || bed ? (
                                <>
                                    {ward && <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 leading-none mb-0.5">{ward}</div>}
                                    {bed ? <div className="text-lg font-extrabold leading-tight"><SuffixedValue value={bed} /></div> : <div className="text-base font-bold">-</div>}
                                </>
                            ) : (
                                <div className="text-xl font-extrabold uppercase">
                                    {name ? name.charAt(0) : '?'}
                                </div>
                            )}
                        </div>

                        {/* Title & Identifiers */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                {isMortality ? (
                                    <span className="text-[10px] font-black bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-0.5 rounded uppercase tracking-tighter">DECEASED</span>
                                ) : critical && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse tracking-tighter">
                                        <AlertTriangle size={10} /> CRITICAL
                                    </span>
                                )}
                                <h2 id="patient-detail-title" className="text-lg font-bold text-gray-900 dark:text-white leading-tight truncate">
                                    {name || 'Unnamed Patient'}
                                </h2>
                            </div>

                            {hospitalNumber && (
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                    <span>Hosp #:</span>
                                    <span className="font-mono bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1.5 py-0.2 rounded">
                                        <SuffixedValue value={hospitalNumber} />
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-200/70 dark:bg-gray-700/70 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors shrink-0"
                        aria-label="Close details"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 text-left">
                    {/* Metadata Pill Bar */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                        {admissionDate && (
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-blue-500" />
                                <span>Admitted: <strong>{new Date(admissionDate).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                                {durationText && <span className="text-blue-600 dark:text-blue-400 font-bold">({durationText})</span>}
                            </div>
                        )}
                        {lastUpdated && !isMortality && (
                            <div className="flex items-center gap-1.5">
                                <Clock size={14} className="text-purple-500" />
                                <span>Updated: <strong>{new Date(lastUpdated).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
                            </div>
                        )}
                        {isMortality && removedAt && (
                            <div className="flex items-center gap-1.5 text-red-500">
                                <Clock size={14} />
                                <span>Recorded: <strong>{new Date(removedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
                            </div>
                        )}
                    </div>

                    {/* Diagnosis Section */}
                    {diagnosis && (
                        <div className="space-y-1">
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">Diagnosis</h3>
                            <div className="p-3 bg-blue-50/60 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-sm font-bold text-gray-900 dark:text-gray-100">
                                {diagnosis}
                            </div>
                        </div>
                    )}

                    {/* Clinical Notes Section */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">Clinical Notes</h3>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md transition-colors"
                            >
                                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/60 rounded-2xl text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere] [word-break:break-word] min-h-[100px]">
                            {note ? note : <span className="italic text-gray-400">No clinical notes recorded.</span>}
                        </div>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-end gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary !py-2 !px-4 text-xs font-bold"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onClose()
                            onEdit(patient)
                        }}
                        className="btn-primary !py-2 !px-4 text-xs font-bold flex items-center gap-1.5"
                    >
                        <Pencil size={14} />
                        <span>Edit</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
