import { useState, useMemo } from 'react'
import PatientCard from './PatientCard'
import { ArrowUpDown, ChevronDown, ChevronRight, RotateCcw, CheckSquare, Square } from 'lucide-react'

const SORT_OPTIONS = [
    { value: 'none', label: 'Default' },
    { value: 'status', label: 'Priority Status' },
    { value: 'ward', label: 'Ward' },
    { value: 'bed', label: 'Bed' },
    { value: 'name', label: 'Name' },
    { value: 'hospnum', label: 'Hosp No.' },
]

export default function PatientList({ patients, onDelete, onEdit, onReview, onResetReviews, onDocument, getDocCount, selectedIds = new Set(), onToggleSelect, onToggleSelectAll, isMortality = false, onMoveTeam, moveTeamLabel }) {
    const [sortBy, setSortBy] = useState('none')
    const [isReviewedOpen, setIsReviewedOpen] = useState(false)

    const activePatients = patients.filter(p => !p.reviewed)
    const reviewedPatients = patients.filter(p => p.reviewed)

    const sortPatients = (list) => {
        if (sortBy === 'none') return list
        return [...list].sort((a, b) => {
            if (sortBy === 'status') {
                if (a.critical !== b.critical) return a.critical ? -1 : 1
                return 0
            }

            if (sortBy === 'ward') {
                const wardCmp = (a.ward || '').localeCompare(b.ward || '', undefined, { numeric: true, sensitivity: 'base' })
                if (wardCmp !== 0) return wardCmp
                return (a.bed || '').localeCompare(b.bed || '', undefined, { numeric: true, sensitivity: 'base' })
            }

            if (sortBy === 'bed') {
                const bedCmp = (a.bed || '').localeCompare(b.bed || '', undefined, { numeric: true, sensitivity: 'base' })
                if (bedCmp !== 0) return bedCmp
                return (a.ward || '').localeCompare(b.ward || '', undefined, { numeric: true, sensitivity: 'base' })
            }

            let av = '', bv = ''
            if (sortBy === 'name') { av = a.name || ''; bv = b.name || '' }
            if (sortBy === 'hospnum') { av = a.hospitalNumber || ''; bv = b.hospitalNumber || '' }
            return av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' })
        })
    }

    const sortedActive = useMemo(() => sortPatients(activePatients), [activePatients, sortBy])
    const sortedReviewed = useMemo(() => sortPatients(reviewedPatients), [reviewedPatients, sortBy])

    const allIds = patients.map(p => p.id)
    const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id))
    const someSelected = selectedIds.size > 0

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                {/* Title & Badge */}
                <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                        {isMortality ? 'Mortality Records' : 'Patient List'}
                    </h2>
                    <span className={`${isMortality ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'} text-xs font-bold px-2.5 py-1 rounded-full`}>
                        {activePatients.length}
                    </span>
                </div>

                {/* Controls (Select All & Sort) */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    {/* Select All toggle */}
                    <button
                        onClick={() => onToggleSelectAll(allIds)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title={allSelected ? 'Deselect all' : 'Select all for export'}
                    >
                        {allSelected
                            ? <CheckSquare size={16} className="text-blue-600 dark:text-blue-400" />
                            : someSelected
                                ? <CheckSquare size={16} className="text-blue-400 dark:text-blue-500 opacity-60" />
                                : <Square size={16} />
                        }
                        {someSelected ? `${selectedIds.size} selected` : 'Select'}
                    </button>

                    {/* Sort controls */}
                    <div className="flex items-center gap-1.5">
                        <ArrowUpDown size={13} className="text-gray-400 flex-shrink-0" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="text-xs text-gray-600 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-0 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 dark:ring-blue-700"
                            aria-label="Sort patients by"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div
                role="list"
                className="flex flex-col gap-3 mb-6"
                aria-label={isMortality ? "Mortality list" : "Patient list"}
            >
                {sortedActive.map((patient) => (
                    <PatientCard
                        key={patient.id}
                        patient={patient}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onReview={onReview}
                        onDocument={onDocument}
                        docCount={getDocCount ? getDocCount(patient.id) : 0}
                        isSelected={selectedIds.has(patient.id)}
                        onToggleSelect={onToggleSelect}
                        isMortality={isMortality}
                        onMoveTeam={onMoveTeam}
                        moveTeamLabel={moveTeamLabel}
                    />
                ))}
                {sortedActive.length === 0 && reviewedPatients.length > 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                        All patients reviewed! Great job! 🎉
                    </div>
                )}
            </div>

            {reviewedPatients.length > 0 && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-semibold"
                            onClick={() => setIsReviewedOpen(!isReviewedOpen)}
                        >
                            {isReviewedOpen ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                            Reviewed Patients ({reviewedPatients.length})
                        </button>
                        <button
                            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors border-none cursor-pointer"
                            onClick={onResetReviews}
                        >
                            <RotateCcw size={15} />
                            Reset All
                        </button>
                    </div>

                    {isReviewedOpen && (
                        <div role="list" className="flex flex-col gap-3 opacity-80" aria-label="Reviewed patient list">
                            {sortedReviewed.map((patient) => (
                                <PatientCard
                                    key={patient.id}
                                    patient={patient}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onReview={onReview}
                                    onDocument={onDocument}
                                    docCount={getDocCount ? getDocCount(patient.id) : 0}
                                    isSelected={selectedIds.has(patient.id)}
                                    onToggleSelect={onToggleSelect}
                                    isMortality={isMortality}
                                    onMoveTeam={onMoveTeam}
                                    moveTeamLabel={moveTeamLabel}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
