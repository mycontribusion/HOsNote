import { AlertTriangle, Copy } from 'lucide-react'
import SuffixedValue from './SuffixedValue'

export default function DuplicatePromptModal({ duplicate, onAddAsNew, onCancel }) {
    // duplicate: { type: 'duplicate_hosp' | 'duplicate_bed' | 'duplicate_both', field: 'hospitalNumber' | 'bed' | 'both', value: string, existing: object, fieldLabel: string }
    const isHosp = duplicate.field === 'hospitalNumber'
    const isBoth = duplicate.field === 'both'
    const existing = duplicate.existing
    const fieldLabel = duplicate.fieldLabel || (isHosp ? 'Hospital Number' : 'Ward/Bed')

    return (
        <div
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && onCancel()}
        >
            <div
                className="modal-box max-w-sm"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="dup-title"
            >
                <div className="flex flex-col gap-5">
                    <div className="flex justify-between items-start">
                        <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-2xl">
                            <AlertTriangle size={24} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <Copy size={20} className="text-gray-400" />
                        </button>
                    </div>

                    <div>
                        <h2 id="dup-title" className="text-xl font-bold text-gray-900 dark:text-white">
                            Duplicate {fieldLabel}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                            {isBoth
                                ? 'Patients with this Hospital Number and Ward/Bed already exist:'
                                : `A patient with this ${fieldLabel.toLowerCase()} already exists:`}
                        </p>

                        {isBoth ? (
                            <div className="mt-3 space-y-2">
                                {duplicate.existingHosp && (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            {duplicate.existingHosp.name || 'Unnamed'}
                                        </p>
                                        {duplicate.existingHosp.hospitalNumber && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Hosp No: <span className="font-mono font-medium"><SuffixedValue value={duplicate.existingHosp.hospitalNumber} /></span>
                                            </p>
                                        )}
                                    </div>
                                )}
                                {duplicate.existingBed && (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            {duplicate.existingBed.name || 'Unnamed'}
                                        </p>
                                        {duplicate.existingBed.ward && duplicate.existingBed.bed && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Ward/Bed: <span className="font-medium">{duplicate.existingBed.ward} <SuffixedValue value={duplicate.existingBed.bed} /></span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    {existing.name || 'Unnamed'}
                                </p>
                                {isHosp && existing.hospitalNumber && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Hosp No: <span className="font-mono font-medium"><SuffixedValue value={existing.hospitalNumber} /></span>
                                    </p>
                                )}
                                {!isHosp && existing.ward && existing.bed && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Ward/Bed: <span className="font-medium">{existing.ward} <SuffixedValue value={existing.bed} /></span>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onAddAsNew}
                            className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                        >
                            <Copy size={20} />
                            Add as New
                        </button>
                        <button
                            onClick={onCancel}
                            className="w-full py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
