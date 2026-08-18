import { useState, useMemo, useEffect, useRef, memo } from 'react'
import PatientCard from './PatientCard'
import PatientDetailModal from './PatientDetailModal'
import { ChevronDown, ChevronRight, RotateCcw, CheckSquare, Square } from 'lucide-react'

const SORT_OPTIONS = [
    { value: 'none',    label: 'Default' },
    { value: 'status',  label: 'Priority' },
    { value: 'ward',    label: 'Ward' },
    { value: 'bed',     label: 'Bed' },
    { value: 'name',    label: 'Name' },
    { value: 'hospnum', label: 'Hosp No.' },
]

const PatientListInner = ({ patients, onDelete, onEdit, onReview, onResetReviews, onDocument, getDocCount, selectedIds = new Set(), onToggleSelect, onToggleSelectAll, isMortality = false, onMoveTeam, moveTeamLabel, highlightField, highlightQuery, reviewedExpandTrigger, onReviewedExpanded }) => {
    const [sortBy, setSortBy] = useState('none')
    const [isReviewedOpen, setIsReviewedOpen] = useState(false)
    const [selectedDetailPatient, setSelectedDetailPatient] = useState(null)
    const [visibleCount, setVisibleCount] = useState(30)
    const [visibleReviewedCount, setVisibleReviewedCount] = useState(30)
    const sentinelRef = useRef(null)
    const reviewedSentinelRef = useRef(null)

    const { activePatients, reviewedPatients } = useMemo(() => {
        const active = []
        const reviewed = []
        for (let i = 0; i < patients.length; i++) {
            if (patients[i].reviewed) reviewed.push(patients[i])
            else active.push(patients[i])
        }
        return { activePatients: active, reviewedPatients: reviewed }
    }, [patients])

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
            if (sortBy === 'name')    { av = a.name || '';           bv = b.name || '' }
            if (sortBy === 'hospnum') { av = a.hospitalNumber || ''; bv = b.hospitalNumber || '' }
            return av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' })
        })
    }

    const sortedActive   = useMemo(() => sortPatients(activePatients),   [activePatients,   sortBy])
    const sortedReviewed = useMemo(() => sortPatients(reviewedPatients), [reviewedPatients, sortBy])

    // Reset windowing limits when filter, sort, or expanded state changes
    useEffect(() => {
        setVisibleCount(30)
        setVisibleReviewedCount(30)
    }, [sortBy, patients, isReviewedOpen])

    // Expand reviewed section & windowing limits when triggered from search navigation
    useEffect(() => {
        if (reviewedExpandTrigger > 0 && reviewedPatients.length > 0) {
            if (!isReviewedOpen) {
                setIsReviewedOpen(true)
                onReviewedExpanded?.()
            }
            setVisibleReviewedCount(sortedReviewed.length)
        }
    }, [reviewedExpandTrigger, reviewedPatients.length, sortedReviewed.length, onReviewedExpanded])

    // Automatically expand windowing limits if search query matches an item beyond visible count
    useEffect(() => {
        if (highlightQuery) {
            const q = highlightQuery.toLowerCase()
            const activeIdx = sortedActive.findIndex(p =>
                (p.name || '').toLowerCase().includes(q) ||
                (p.hospitalNumber || '').toLowerCase().includes(q) ||
                (p.ward || '').toLowerCase().includes(q) ||
                (p.bed || '').toLowerCase().includes(q) ||
                (p.diagnosis || '').toLowerCase().includes(q) ||
                (p.note || '').toLowerCase().includes(q)
            )
            if (activeIdx >= 0) {
                setVisibleCount(prev => Math.max(prev, activeIdx + 1))
            }

            const reviewedIdx = sortedReviewed.findIndex(p =>
                (p.name || '').toLowerCase().includes(q) ||
                (p.hospitalNumber || '').toLowerCase().includes(q) ||
                (p.ward || '').toLowerCase().includes(q) ||
                (p.bed || '').toLowerCase().includes(q) ||
                (p.diagnosis || '').toLowerCase().includes(q) ||
                (p.note || '').toLowerCase().includes(q)
            )
            if (reviewedIdx >= 0) {
                setIsReviewedOpen(true)
                setVisibleReviewedCount(prev => Math.max(prev, reviewedIdx + 1))
            }
        }
    }, [highlightQuery, sortedActive, sortedReviewed])

    const visibleActive   = useMemo(() => sortedActive.slice(0, visibleCount), [sortedActive, visibleCount])
    const visibleReviewed = useMemo(() => sortedReviewed.slice(0, visibleReviewedCount), [sortedReviewed, visibleReviewedCount])

    // Infinite scroll observer for loading active patients next chunk
    useEffect(() => {
        if (visibleCount >= sortedActive.length) return
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setVisibleCount(prev => Math.min(prev + 30, sortedActive.length))
            }
        }, { rootMargin: '200px' })

        const currentSentinel = sentinelRef.current
        if (currentSentinel) observer.observe(currentSentinel)
        return () => {
            if (currentSentinel) observer.unobserve(currentSentinel)
        }
    }, [visibleCount, sortedActive.length])

    // Infinite scroll observer for loading reviewed patients next chunk
    useEffect(() => {
        if (!isReviewedOpen || visibleReviewedCount >= sortedReviewed.length) return
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setVisibleReviewedCount(prev => Math.min(prev + 30, sortedReviewed.length))
            }
        }, { rootMargin: '200px' })

        const currentSentinel = reviewedSentinelRef.current
        if (currentSentinel) observer.observe(currentSentinel)
        return () => {
            if (currentSentinel) observer.unobserve(currentSentinel)
        }
    }, [isReviewedOpen, visibleReviewedCount, sortedReviewed.length])

    const allIds      = patients.map(p => p.id)
    const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id))
    const someSelected = selectedIds.size > 0

    return (
        <div>
            {/* ── List controls bar ─────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 mb-4">
                {/* Title + count badge */}
                <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest">
                        {isMortality ? 'Mortality' : 'Patients'}
                    </h2>
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full min-w-[22px] text-center ${isMortality
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                        : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    }`}>
                        {activePatients.length}
                    </span>
                </div>

                {/* Controls: Select All + Sort */}
                <div className="flex items-center gap-2">
                    {/* Select All toggle */}
                    <button
                        onClick={() => onToggleSelectAll(allIds)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60"
                        title={allSelected ? 'Deselect all' : 'Select all for handover'}
                    >
                        {allSelected
                            ? <CheckSquare size={14} className="text-blue-600 dark:text-blue-400" />
                            : someSelected
                                ? <CheckSquare size={14} className="text-blue-400 opacity-70" />
                                : <Square size={14} />
                        }
                        {someSelected ? `${selectedIds.size} selected` : 'Select'}
                    </button>

                    {/* Sort dropdown */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700/60 rounded-md px-1.5 py-0.5 border border-gray-200/60 dark:border-gray-600/40">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="text-[10px] text-gray-600 dark:text-gray-300 font-bold bg-transparent border-0 cursor-pointer focus:outline-none"
                            aria-label="Sort patients by"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Active patients ───────────────────────────────────────── */}
            <div
                role="list"
                className="flex flex-col gap-2.5 mb-6"
                aria-label={isMortality ? 'Mortality list' : 'Patient list'}
            >
                {visibleActive.map((patient) => (
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
                        selectionMode={selectedIds.size > 0}
                        isMortality={isMortality}
                        onMoveTeam={onMoveTeam}
                        moveTeamLabel={moveTeamLabel}
                        highlightField={highlightField}
                        highlightQuery={highlightQuery}
                        onOpenDetail={setSelectedDetailPatient}
                    />
                ))}
                {visibleCount < sortedActive.length && (
                    <div ref={sentinelRef} className="py-4 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
                        Showing {visibleCount} of {sortedActive.length} {isMortality ? 'records' : 'patients'}...
                    </div>
                )}
                {sortedActive.length === 0 && reviewedPatients.length > 0 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                        <span className="text-3xl">🎉</span>
                        <p className="text-sm font-semibold">All patients reviewed!</p>
                    </div>
                )}
            </div>

            {/* ── Reviewed section ──────────────────────────────────────── */}
            {reviewedPatients.length > 0 && (
                <div className="mt-2 border-t border-gray-200 dark:border-gray-700/60 pt-5">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold text-sm transition-colors"
                            onClick={() => setIsReviewedOpen(!isReviewedOpen)}
                        >
                            {isReviewedOpen
                                ? <ChevronDown size={16} className="text-gray-400" />
                                : <ChevronRight size={16} className="text-gray-400" />
                            }
                            Reviewed
                            <span className="text-xs font-extrabold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {reviewedPatients.length}
                            </span>
                        </button>
                        <button
                            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-2.5 py-1.5 rounded-lg transition-colors"
                            onClick={onResetReviews}
                        >
                            <RotateCcw size={12} />
                            Reset
                        </button>
                    </div>

                    {isReviewedOpen && (
                        <div role="list" className="flex flex-col gap-2.5" aria-label="Reviewed patient list">
                            {visibleReviewed.map((patient) => (
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
                                    selectionMode={selectedIds.size > 0}
                                    isMortality={isMortality}
                                    onMoveTeam={onMoveTeam}
                                    moveTeamLabel={moveTeamLabel}
                                    highlightField={highlightField}
                                    highlightQuery={highlightQuery}
                                    onOpenDetail={setSelectedDetailPatient}
                                />
                            ))}
                            {visibleReviewedCount < sortedReviewed.length && (
                                <div ref={reviewedSentinelRef} className="py-4 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
                                    Showing {visibleReviewedCount} of {sortedReviewed.length} reviewed patients...
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Patient Detail Modal */}
            {selectedDetailPatient && (
                <PatientDetailModal
                    patient={selectedDetailPatient}
                    onClose={() => setSelectedDetailPatient(null)}
                    onEdit={onEdit}
                    onDocument={onDocument}
                    onToggleSelect={onToggleSelect}
                    isSelected={selectedIds.has(selectedDetailPatient.id)}
                    docCount={getDocCount ? getDocCount(selectedDetailPatient.id) : 0}
                    isMortality={isMortality}
                />
            )}
        </div>
    )
}

export default memo(PatientListInner, (prev, next) => {
    if (prev.patients !== next.patients) return false
    if (prev.selectedIds !== next.selectedIds) return false
    if (prev.highlightField !== next.highlightField) return false
    if (prev.highlightQuery !== next.highlightQuery) return false
    if (prev.isMortality !== next.isMortality) return false
    if (prev.getDocCount !== next.getDocCount) return false
    if (prev.onDelete !== next.onDelete) return false
    if (prev.onEdit !== next.onEdit) return false
    if (prev.onReview !== next.onReview) return false
    if (prev.onDocument !== next.onDocument) return false
    if (prev.onToggleSelect !== next.onToggleSelect) return false
    if (prev.onToggleSelectAll !== next.onToggleSelectAll) return false
    if (prev.onMoveTeam !== next.onMoveTeam) return false
    if (prev.moveTeamLabel !== next.moveTeamLabel) return false
    if (prev.reviewedExpandTrigger !== next.reviewedExpandTrigger) return false
    if (prev.onReviewedExpanded !== next.onReviewedExpanded) return false
    return true
})
