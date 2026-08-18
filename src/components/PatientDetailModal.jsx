import { useState } from 'react'
import { X, Pencil } from 'lucide-react'
import { formatSmartDate, formatFullDate } from '../utils/formatSmartDate'
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

    const formatDate = (iso) => {
        if (!iso) return ''
        return formatFullDate(iso)
    }

    const hasDiag  = Boolean(diagnosis?.trim())
    const hasName  = Boolean(name?.trim())
    const wardStr  = (ward || '').trim()
    const hospStr  = (hospitalNumber || '').trim()

    const accentColor = isMortality
        ? 'border-red-500'
        : critical
            ? 'border-red-500'
            : 'border-blue-500'

    const headerBg = isMortality
        ? 'bg-gradient-to-br from-red-50 to-white dark:from-red-900/15 dark:to-gray-800'
        : critical
            ? 'bg-gradient-to-br from-red-50 to-white dark:from-red-900/15 dark:to-gray-800'
            : 'bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800'

    const pillColor = isMortality
        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'

    return (
        <div
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className={`modal-box max-w-md w-[95%] h-[72vh] max-h-[620px] flex flex-col p-0 overflow-hidden border-l-4 ${accentColor}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="patient-detail-title"
            >
                {/* Header */}
                <div className={`px-5 pt-4 pb-3.5 flex-shrink-0 ${headerBg} border-b border-gray-100 dark:border-gray-700/50`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex flex-col gap-1.5 overflow-hidden">
                                {/* Diagnosis (primary title when present) */}
                                {hasDiag && (
                                    <div className="overflow-x-auto whitespace-nowrap custom-scrollbar pb-0.5">
                                        <h2 id="patient-detail-title" className="font-extrabold text-gray-900 dark:text-white text-base leading-tight inline-block whitespace-nowrap">
                                            {diagnosis}
                                        </h2>
                                    </div>
                                )}
                                {/* Meta row: name, ward, bed, hosp#, status tags */}
                                <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                                    {hasName && (
                                        <span className={`whitespace-nowrap ${hasDiag ? 'text-xs font-semibold text-gray-700 dark:text-gray-300' : 'font-extrabold text-base text-gray-900 dark:text-white'}`}>
                                            {hasDiag ? name : name}
                                        </span>
                                    )}
                                    {wardStr && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-normal break-all ${pillColor}`}>
                                            {wardStr}
                                        </span>
                                    )}
                                    {bed && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${pillColor}`}>
                                            Bed {bed}
                                        </span>
                                    )}
                                    {hospStr && (
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700/80 px-2 py-0.5 rounded-full whitespace-nowrap border border-gray-200/80 dark:border-gray-600/50">
                                            <SuffixedValue value={hospitalNumber} />
                                        </span>
                                    )}
                                    {critical && !isMortality && (
                                        <span className="status-pill-critical">⚡ CRITICAL</span>
                                    )}
                                    {isMortality && (
                                        <span className="status-pill-deceased">DECEASED</span>
                                    )}
                                    {admissionDate && (
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                            Admitted: {formatSmartDate(admissionDate)}
                                            {durationText && !isMortality && (
                                                <span className="text-blue-600 dark:text-blue-400 font-bold ml-1">({durationText})</span>
                                            )}
                                        </span>
                                    )}
                                    {lastUpdated && !isMortality && (
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                            · {formatSmartDate(lastUpdated)}
                                        </span>
                                    )}
                                    {isMortality && removedAt && (
                                        <span className="text-[10px] text-red-500 dark:text-red-400 whitespace-nowrap">
                                            Recorded: {formatSmartDate(removedAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0 mt-0.5"
                            aria-label="Close"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4 flex-1 overflow-y-auto custom-scrollbar min-w-0 max-w-full bg-white dark:bg-gray-800">
                    {note ? (
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere] [word-break:break-word]">
                            {note}
                        </p>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-24 gap-2 text-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </div>
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No clinical notes recorded.</p>
                        </div>
                    )}
                    {!isMortality && lastUpdated && admissionDate && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-4 italic border-t border-gray-100 dark:border-gray-700/50 pt-3">
                            Last edited: {formatDate(lastUpdated)}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-2 px-4 pb-4 border-t border-gray-100 dark:border-gray-700/60 pt-3 flex-shrink-0 bg-gray-50/60 dark:bg-gray-800/80">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-ghost flex items-center gap-2 flex-1 text-sm"
                        style={{ minHeight: '42px' }}
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onClose()
                            onEdit(patient)
                        }}
                        className={`${isMortality || critical ? 'btn-danger' : 'btn-primary'} flex items-center gap-2 flex-1 text-sm`}
                        style={{ minHeight: '42px' }}
                    >
                        <Pencil size={14} />
                        Edit
                    </button>
                </div>
            </div>
        </div>
    )
}
