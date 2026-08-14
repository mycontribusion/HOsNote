import { Trash2, Pencil, CheckCircle2, FileText, ChevronsLeft } from 'lucide-react'
import { useState, useRef, useEffect, useMemo, memo } from 'react'
import { formatSmartDate } from '../utils/formatSmartDate'
import SuffixedValue from './SuffixedValue'

function HighlightText({ text, query }) {
    if (!query || !text) return <>{text}</>
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-200 dark:bg-yellow-600/40 text-gray-900 dark:text-gray-100 rounded-sm px-0.5">{part}</mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    )
}

const PatientCardInner = ({ patient, onEdit, onDelete, onReview, onDocument, docCount = 0, isSelected = false, onToggleSelect, selectionMode = false, isMortality = false, onMoveTeam, moveTeamLabel, highlightField, highlightQuery, onOpenDetail }) => {
    const { id, name, hospitalNumber, ward, bed, diagnosis, note, reviewed, critical, removedAt, lastUpdated, admissionDate } = patient

    const durationText = useMemo(() => {
        if (!admissionDate || isMortality) return ''
        const diffMs = Math.max(0, Date.now() - new Date(admissionDate).getTime())
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        return `• ${days} day${days !== 1 ? 's' : ''}`
    }, [admissionDate, isMortality])

    const [offsetX, setOffsetX] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [pressRing, setPressRing] = useState(false)
    const startX = useRef(null)
    const startY = useRef(null)
    const longPressTimer = useRef(null)
    const longPressTriggered = useRef(false)
    // suppressClick survives pointerUp so the click event after a long-press is blocked
    const suppressClick = useRef(false)

    // Clear long-press timer on unmount
    useEffect(() => () => clearTimeout(longPressTimer.current), [])

    const handlePointerDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.target.closest('button')) return;

        startX.current = e.clientX;
        startY.current = e.clientY;
        longPressTriggered.current = false;
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);

        // Long-press: 500ms hold triggers selection
        if (onToggleSelect) {
            longPressTimer.current = setTimeout(() => {
                longPressTriggered.current = true;
                suppressClick.current = true; // block the click that fires after pointerUp
                setPressRing(true);
                setTimeout(() => setPressRing(false), 400);
                onToggleSelect(id);
            }, 500);
        }
    }
    const handlePointerMove = (e) => {
        if (!isDragging || startX.current === null) return;
        const dx = e.clientX - startX.current;
        const dy = e.clientY - (startY.current ?? e.clientY);
        // Cancel long-press if the finger moved more than 8px
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            clearTimeout(longPressTimer.current);
        }
        let diff = dx;
        if (diff > 120) diff = 120 + (diff - 120) * 0.2;
        if (diff < -120) diff = -120 + (diff + 120) * 0.2;
        setOffsetX(diff);
    }
    const handlePointerUp = (e) => {
        if (!isDragging) return;
        clearTimeout(longPressTimer.current);
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);

        if (!longPressTriggered.current) {
            if (offsetX > 80 && onReview && !isMortality) {
                onReview(id, !reviewed);
            } else if (offsetX < -80) {
                onDelete(id);
            }
        }
        setOffsetX(0);
        startX.current = null;
        startY.current = null;
        longPressTriggered.current = false;
        // suppressClick.current is NOT reset here — the click event reads & resets it
    }

    const handleCardClick = (e) => {
        if (e.target.closest('button') || Math.abs(offsetX) > 5) return;

        // If this click follows a long-press, block it and consume the flag
        if (suppressClick.current) {
            suppressClick.current = false;
            e.stopPropagation();
            return;
        }

        // In selection mode: tapping any card toggles its selection
        if (selectionMode && onToggleSelect) {
            e.stopPropagation();
            onToggleSelect(id);
            return;
        }

        // Normal: open detail modal (stop propagation so it doesn't hit the main clear handler)
        e.stopPropagation();
        if (onOpenDetail) onOpenDetail(patient);
    }

    const badgeColor = useMemo(() => {
        const colorStr = ward || name || id || ''
        if (isMortality) {
            return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/40'
        }
        const wardColors = [
            'bg-blue-100 text-blue-800 border-blue-200',
            'bg-purple-100 text-purple-800 border-purple-200',
            'bg-teal-100 text-teal-800 border-teal-200',
            'bg-orange-100 text-orange-800 border-orange-200',
            'bg-pink-100 text-pink-800 border-pink-200',
            'bg-indigo-100 text-indigo-800 border-indigo-200',
        ]
        let hash = 0
        for (let i = 0; i < colorStr.length; i++) {
            hash = colorStr.charCodeAt(i) + ((hash << 5) - hash)
        }
        const colorIdx = Math.abs(hash) % wardColors.length
        return wardColors[colorIdx]
    }, [ward, name, id, isMortality])

    return (
        <div className="relative overflow-hidden rounded-2xl" id={`patient-${id}`} role="listitem">
            {/* Background Actions */}
            <div className={`absolute inset-0 flex justify-between items-center px-6 transition-colors duration-200 ${offsetX > 0 ? (reviewed ? 'bg-gray-200' : 'bg-green-100') : (offsetX < 0 ? 'bg-red-100' : 'bg-transparent')}`}>
                <div className={`font-bold tracking-widest text-lg flex items-center gap-2 transition-opacity ${offsetX > 20 ? 'opacity-100' : 'opacity-0'} ${reviewed ? 'text-gray-600' : 'text-green-700'}`}>
                    {!isMortality && (
                        <>
                            <CheckCircle2 size={24} />
                            {reviewed ? 'UN-REVIEW' : 'REVIEWED'}
                        </>
                    )}
                </div>
                <div className={`font-bold tracking-widest text-lg flex items-center gap-2 transition-opacity ${offsetX < -20 ? 'opacity-100 text-red-600' : 'opacity-0'}`}>
                    REMOVE
                    <Trash2 size={24} />
                </div>
            </div>

            {/* Fore Card */}
            <div
                className={`card p-4 flex flex-col sm:flex-row gap-4 group relative z-10 touch-pan-y cursor-pointer
                    ${isDragging ? 'transition-none' : 'transition-all duration-300'} 
                    ${isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 shadow-lg shadow-blue-100/60 dark:shadow-blue-950/60 ring-0'
                        : reviewed ? 'opacity-70 bg-gray-50 dark:bg-gray-800/50 grayscale-[15%]'
                        : isMortality ? 'bg-white dark:bg-gray-800 border-red-100 dark:border-red-950 shadow-sm'
                        : critical ? 'bg-red-50/40 dark:bg-red-900/10 border-red-200 dark:border-red-800 shadow-sm shadow-red-100/50'
                        : 'bg-white dark:bg-gray-800'
                    }`}
                style={{ transform: `translateX(${offsetX}px)` }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClick={handleCardClick}
            >
                {/* Long-press selection ring flash */}
                {pressRing && (
                    <span className="absolute inset-0 rounded-2xl ring-4 ring-blue-400 dark:ring-blue-500 animate-ping pointer-events-none z-30" />
                )}

                {/* Selected: blue left accent bar */}
                {isSelected && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 dark:bg-blue-400 rounded-l-2xl" />
                )}

                {/* Selected: checkmark stamp in top-right */}
                {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-blue-500 dark:bg-blue-400 flex items-center justify-center shadow-md z-20 animate-in zoom-in-50 duration-200">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    </div>
                )}
                {onMoveTeam && (
                    <button
                        className="sm:hidden absolute top-1 left-1 w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-xs active:scale-90 transition-all z-20"
                        onClick={(e) => { e.stopPropagation(); onMoveTeam(id) }}
                        aria-label={moveTeamLabel || 'Move team'}
                        title={moveTeamLabel || 'Move team'}
                    >
                        <ChevronsLeft size={12} strokeWidth={3} />
                    </button>
                )}
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">

                    {/* Left Column (Badge + Mobile Actions) */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[64px]">
                        {/* Ward/Bed or Initial Badge */}
                        <div className={`flex flex-col items-center justify-center rounded-xl border-2 px-3 py-2 text-center w-[64px] min-h-[64px] ${badgeColor}`}>
                            {ward || bed ? (
                                <>
                                    {ward && <div className="text-xs font-semibold uppercase tracking-wider opacity-70 leading-none mb-1">{ward}</div>}
                                    {bed && <div className="text-xl font-extrabold leading-tight"><SuffixedValue value={bed} /></div>}
                                    {!bed && ward && <div className="text-xl font-extrabold leading-tight">-</div>}
                                </>
                            ) : (
                                <div className="text-2xl font-extrabold uppercase leading-none">
                                    {name ? name.charAt(0) : '?'}
                                </div>
                            )}
                        </div>

                        {/* Mobile Actions (Under Badge - fixed 64px width) */}
                        <div className="flex sm:hidden flex-row gap-0.5 justify-center w-full">
                            {onToggleSelect && (
                                <button
                                    className={`btn-icon !min-h-[30px] !min-w-[30px] rounded-lg transition-all ${isSelected ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                                    onClick={(e) => { e.stopPropagation(); onToggleSelect(id) }}
                                    aria-label="Toggle selection"
                                >
                                    {isSelected ? <CheckCircle2 size={16} /> : <div className="w-3.5 h-3.5 rounded border-2 border-gray-300 dark:border-gray-500" />}
                                </button>
                            )}
                            <button
                                className="btn-icon !min-h-[30px] !min-w-[30px] rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                onClick={(e) => { e.stopPropagation(); onEdit(patient) }}
                                aria-label="Edit patient"
                            >
                                <Pencil size={15} strokeWidth={2} />
                            </button>
                        </div>
                    </div>

                    {/* Patient Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            {isMortality ? (
                                <span className="text-[10px] font-black bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-0.5 rounded uppercase tracking-tighter">DECEASED</span>
                            ) : critical && !reviewed && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse tracking-tighter">
                                    CRITICAL
                                </span>
                            )}
                            {name && (
                                <div className={`text-lg font-bold leading-tight overflow-x-auto whitespace-nowrap ${reviewed ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {highlightField === 'name' && highlightQuery ? (
                                        <HighlightText text={name} query={highlightQuery} />
                                    ) : (
                                        name
                                    )}
                                </div>
                            )}
                            {hospitalNumber && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis ${reviewed ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500 line-through' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                    {highlightField === 'hospitalNumber' && highlightQuery ? (
                                        <HighlightText text={hospitalNumber} query={highlightQuery} />
                                    ) : (
                                        <SuffixedValue value={hospitalNumber} />
                                    )}
                                </span>
                            )}
                            {docCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 whitespace-nowrap">
                                    <FileText size={10} />{docCount}
                                </span>
                            )}
                            {durationText && (
                                <span className="text-[10px] text-gray-400 font-medium italic whitespace-nowrap ml-1 flex-shrink-0">
                                    {durationText}
                                </span>
                            )}
                        </div>
                        {(!name && !hospitalNumber) && (
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 italic">No name provided</div>
                        )}
                        {isMortality && removedAt && (
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 italic leading-none">
                                Recorded: {formatSmartDate(removedAt)}
                            </div>
                        )}
                        {!isMortality && lastUpdated && (
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 italic leading-none">
                                Last Update: {formatSmartDate(lastUpdated)}
                            </div>
                        )}
                        {diagnosis && (
                            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 truncate">
                                {highlightField === 'diagnosis' && highlightQuery ? (
                                    <HighlightText text={diagnosis} query={highlightQuery} />
                                ) : (
                                    diagnosis
                                )}
                            </div>
                        )}
                        {note && (
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 max-h-[5.5rem] overflow-y-auto custom-scrollbar pointer-events-none select-none pr-1 break-all [overflow-wrap:anywhere] [word-break:break-word] min-w-0 max-w-full" style={{ whiteSpace: 'pre-wrap' }}>
                                {highlightField === 'note' && highlightQuery ? (
                                    <HighlightText text={note} query={highlightQuery} />
                                ) : (
                                    note
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden sm:flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-20">
                    {/* Selection checkbox */}
                    {onToggleSelect && (
                        <button
                            className={`btn-icon flex-shrink-0 transition-all ${isSelected
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-300 dark:text-gray-600 hover:text-blue-400'
                                }`}
                            onClick={(e) => { e.stopPropagation(); onToggleSelect(id) }}
                            aria-label={isSelected ? 'Deselect patient' : 'Select patient for handover'}
                            title={isSelected ? 'Deselect' : 'Select for handover'}
                        >
                            {isSelected ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="18" x="3" y="3" rx="2" /><path d="m9 12 2 2 4-4" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="18" x="3" y="3" rx="2" />
                                </svg>
                            )}
                        </button>
                    )}
                    {onMoveTeam && (
                        <button
                            className="btn-icon text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-200 flex-shrink-0"
                            onClick={(e) => { e.stopPropagation(); onMoveTeam(id) }}
                            aria-label={moveTeamLabel || 'Move team'}
                            title={moveTeamLabel || 'Move team'}
                        >
                            <ChevronsLeft size={18} strokeWidth={2} />
                        </button>
                    )}
                    <button
                        className="btn-icon text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-200 flex-shrink-0"
                        onClick={() => onEdit(patient)}
                        aria-label="Edit patient"
                        title="Edit patient"
                    >
                        <Pencil size={18} strokeWidth={2} />
                    </button>

                </div>
            </div>
        </div>
    )
}

export default memo(PatientCardInner, (prev, next) => {
    if (prev.patient !== next.patient) {
        const p = prev.patient, n = next.patient
        if (p.id !== n.id) return false
        if (p.name !== n.name) return false
        if (p.hospitalNumber !== n.hospitalNumber) return false
        if (p.ward !== n.ward) return false
        if (p.bed !== n.bed) return false
        if (p.diagnosis !== n.diagnosis) return false
        if (p.note !== n.note) return false
        if (p.reviewed !== n.reviewed) return false
        if (p.critical !== n.critical) return false
        if (p.removedAt !== n.removedAt) return false
        if (p.lastUpdated !== n.lastUpdated) return false
        if (p.admissionDate !== n.admissionDate) return false
    }
    if (prev.docCount !== next.docCount) return false
    if (prev.isSelected !== next.isSelected) return false
    if (prev.selectionMode !== next.selectionMode) return false
    if (prev.isMortality !== next.isMortality) return false
    if (prev.highlightField !== next.highlightField) return false
    if (prev.highlightQuery !== next.highlightQuery) return false
    if (prev.onEdit !== next.onEdit) return false
    if (prev.onDelete !== next.onDelete) return false
    if (prev.onReview !== next.onReview) return false
    if (prev.onDocument !== next.onDocument) return false
    if (prev.onToggleSelect !== next.onToggleSelect) return false
    if (prev.onMoveTeam !== next.onMoveTeam) return false
    if (prev.moveTeamLabel !== next.moveTeamLabel) return false
    if (prev.onOpenDetail !== next.onOpenDetail) return false
    return true
})
