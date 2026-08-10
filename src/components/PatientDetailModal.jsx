import { useState } from 'react'
import { X, Pencil } from 'lucide-react'
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
        const d = new Date(iso)
        return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) +
            ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const hasDiag = Boolean(diagnosis?.trim())
    const hasName = Boolean(name?.trim())
    const wardStr = (ward || '').trim()
    const hospStr = (hospitalNumber || '').trim()

    return (
        <div
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="modal-box max-w-md w-[95%] p-0 overflow-hidden border-l-4 border-blue-500"
                role="dialog"
                aria-modal="true"
                aria-labelledby="patient-detail-title"
            >
                {/* Header */}
                <div className="px-5 pt-4 pb-3 bg-blue-50 dark:bg-blue-900/10">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex flex-col gap-1 overflow-hidden">
                                {hasDiag && (
                                    <div className="overflow-x-auto whitespace-nowrap custom-scrollbar pb-0.5">
                                        <h2 id="patient-detail-title" className="font-bold text-gray-900 dark:text-white text-base leading-tight inline-block whitespace-nowrap">
                                            {diagnosis}
                                        </h2>
                                    </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2 py-0.5">
                                    {hasName && (
                                        <span className={`whitespace-nowrap ${hasDiag ? 'text-xs font-semibold text-gray-700 dark:text-gray-300' : 'font-bold text-base text-gray-900 dark:text-white'}`}>
                                            {hasDiag ? `Patient: ${name}` : name}
                                        </span>
                                    )}
                                    {wardStr && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            {wardStr}
                                        </span>
                                    )}
                                    {bed && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            Bed {bed}
                                        </span>
                                    )}
                                    {hospStr && (
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded whitespace-nowrap">
                                            <SuffixedValue value={hospitalNumber} />
                                        </span>
                                    )}
                                    {critical && !isMortality && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse tracking-tighter whitespace-nowrap">
                                            CRITICAL
                                        </span>
                                    )}
                                    {isMortality && (
                                        <span className="text-[10px] font-black bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-0.5 rounded uppercase tracking-tighter whitespace-nowrap">
                                            DECEASED
                                        </span>
                                    )}
                                    {admissionDate && (
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                            Admitted: {new Date(admissionDate).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {durationText && !isMortality && <span className="text-blue-600 dark:text-blue-400 font-bold">({durationText})</span>}
                                        </span>
                                    )}
                                    {lastUpdated && !isMortality && (
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                            Updated: {new Date(lastUpdated).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                    {isMortality && removedAt && (
                                        <span className="text-[10px] text-red-500 whitespace-nowrap">
                                            Recorded: {new Date(removedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="btn-icon !min-h-[36px] !min-w-[36px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4 max-h-[50vh] overflow-y-auto custom-scrollbar min-w-0 max-w-full">
                    {note ? (
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere] [word-break:break-word]">
                            {note}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed italic text-gray-400">
                            No clinical notes recorded.
                        </p>
                    )}
                    {!isMortality && lastUpdated && admissionDate && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 italic">
                            Edited: {formatDate(lastUpdated)}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-2 px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-ghost flex items-center gap-2 flex-1"
                        style={{ minHeight: '40px', fontSize: '0.875rem' }}
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onClose()
                            onEdit(patient)
                        }}
                        className="btn-primary flex items-center gap-2 flex-1"
                        style={{ minHeight: '40px', fontSize: '0.875rem' }}
                    >
                        <Pencil size={15} />
                        Edit
                    </button>
                </div>
            </div>
        </div>
    )
}
