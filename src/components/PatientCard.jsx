import { Trash2, Pencil, CheckCircle2, FileText, ArrowRightLeft } from 'lucide-react'
import { useState, useRef } from 'react'

export default function PatientCard({ patient, onEdit, onDelete, onReview, onDocument, docCount = 0, isSelected = false, onToggleSelect, isMortality = false, onMoveTeam, moveTeamLabel }) {
    const { id, name, hospitalNumber, ward, bed, note, reviewed, critical, removedAt, lastUpdated, admissionDate } = patient

    let durationText = '';
    if (admissionDate && !isMortality) {
        let diffMs = Date.now() - new Date(admissionDate).getTime();
        if (diffMs < 0) diffMs = 0;
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        durationText = `• ${days} day${days !== 1 ? 's' : ''}`;
    }

    const [offsetX, setOffsetX] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const startX = useRef(null)

    const handlePointerDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        // Don't intercept pointer if clicking on a button
        if (e.target.closest('button')) return;

        startX.current = e.clientX;
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    }
    const handlePointerMove = (e) => {
        if (!isDragging || startX.current === null) return;
        const currentX = e.clientX;
        let diff = currentX - startX.current;
        if (diff > 120) diff = 120 + (diff - 120) * 0.2;
        if (diff < -120) diff = -120 + (diff + 120) * 0.2;
        setOffsetX(diff);
    }
    const handlePointerUp = (e) => {
        if (!isDragging) return;
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);

        if (offsetX > 80 && onReview && !isMortality) {
            onReview(id, !reviewed);
        } else if (offsetX < -80) {
            onDelete(id);
        }
        setOffsetX(0);
        startX.current = null;
    }

    // Generate a color based on ward or name or id string for visual variety
    const colorStr = ward || name || id || ''
    const wardColors = isMortality ? [
        'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/40',
    ] : [
        'bg-blue-100 text-blue-800 border-blue-200',
        'bg-purple-100 text-purple-800 border-purple-200',
        'bg-teal-100 text-teal-800 border-teal-200',
        'bg-orange-100 text-orange-800 border-orange-200',
        'bg-pink-100 text-pink-800 border-pink-200',
        'bg-indigo-100 text-indigo-800 border-indigo-200',
    ]
    const hash = String(colorStr).split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
    const colorIdx = Math.abs(hash) % wardColors.length
    const badgeColor = wardColors[colorIdx]

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
                className={`card p-4 flex flex-col sm:flex-row gap-4 group relative z-10 touch-pan-y
                    ${isDragging ? 'transition-none' : 'transition-transform duration-300'} 
                    ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-1' : ''}
                    ${reviewed ? 'opacity-70 bg-gray-50 dark:bg-gray-800/50 grayscale-[15%]' : isMortality ? 'bg-white dark:bg-gray-800 border-red-100 dark:border-red-950 shadow-sm' : critical ? 'bg-red-50/40 dark:bg-red-900/10 border-red-200 dark:border-red-800 shadow-sm shadow-red-100/50' : 'bg-white dark:bg-gray-800'}`}
                style={{ transform: `translateX(${offsetX}px)` }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                {isMortality && <div className="absolute top-0 left-0 w-1 h-full bg-red-500 opacity-20"></div>}
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">

                    {/* Left Column (Badge + Mobile Actions) */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        {/* Ward/Bed or Initial Badge */}
                        <div className={`flex flex-col items-center justify-center rounded-xl border-2 px-3 py-2 text-center w-[64px] min-h-[64px] ${badgeColor}`}>
                            {ward || bed ? (
                                <>
                                    {ward && <div className="text-xs font-semibold uppercase tracking-wider opacity-70 leading-none mb-1">{ward}</div>}
                                    {bed && <div className="text-xl font-extrabold leading-tight">{bed}</div>}
                                    {!bed && ward && <div className="text-xl font-extrabold leading-tight">-</div>}
                                </>
                            ) : (
                                <div className="text-2xl font-extrabold uppercase leading-none">
                                    {name ? name.charAt(0) : '?'}
                                </div>
                            )}
                        </div>

                        {/* Mobile Actions (Under Badge) */}
                        <div className="flex sm:hidden flex-row gap-0.5 opacity-100">
                            {onToggleSelect && (
                                <button
                                    className={`btn-icon !min-h-[36px] !min-w-[36px] rounded-lg transition-all ${isSelected ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                                    onClick={(e) => { e.stopPropagation(); onToggleSelect(id) }}
                                    aria-label="Toggle selection"
                                >
                                    {isSelected ? <CheckCircle2 size={18} /> : <div className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-500" />}
                                </button>
                            )}
                            {onMoveTeam && (
                                <button
                                    className="btn-icon !min-h-[36px] !min-w-[36px] rounded-lg text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                    onClick={(e) => { e.stopPropagation(); onMoveTeam(id) }}
                                    aria-label={moveTeamLabel || 'Move team'}
                                    title={moveTeamLabel || 'Move team'}
                                >
                                    <ArrowRightLeft size={15} strokeWidth={2} />
                                </button>
                            )}
                            <button
                                className="btn-icon !min-h-[36px] !min-w-[36px] rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                onClick={() => onEdit(patient)}
                                aria-label="Edit patient"
                            >
                                <Pencil size={16} strokeWidth={2} />
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
                            {name && <div className={`text-lg font-bold leading-tight overflow-x-auto whitespace-nowrap ${reviewed ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>{name}</div>}
                            {hospitalNumber && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis ${reviewed ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500 line-through' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                    {hospitalNumber}
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
                                Recorded: {new Date(removedAt).toLocaleString()}
                            </div>
                        )}
                        {!isMortality && lastUpdated && (
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 italic leading-none">
                                Last Update: {new Date(lastUpdated).toLocaleString([], {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </div>
                        )}
                        {note && <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 overflow-y-auto" style={{ whiteSpace: 'pre-wrap', maxHeight: '6.5rem' }}>{note}</div>}
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
                            aria-label={isSelected ? 'Deselect patient' : 'Select patient for export'}
                            title={isSelected ? 'Deselect' : 'Select for export'}
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
                            className="btn-icon text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 focus:ring-purple-200 flex-shrink-0"
                            onClick={(e) => { e.stopPropagation(); onMoveTeam(id) }}
                            aria-label={moveTeamLabel || 'Move team'}
                            title={moveTeamLabel || 'Move team'}
                        >
                            <ArrowRightLeft size={18} strokeWidth={2} />
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
