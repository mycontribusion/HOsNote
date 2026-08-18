import { useState, useMemo, useEffect, memo, useRef, useCallback } from 'react'
import { Edit2, Trash2, BookOpen, X, User, StickyNote, CheckCircle2, QrCode, Send, ChevronUp, ChevronDown } from 'lucide-react'
import { formatSmartDate, formatSmartDateParts, formatFullDate } from '../utils/formatSmartDate'
import AddPatientForm from './AddPatientForm'
import HighlightText from './HighlightText'

const COLOR_BORDER = {
    blue:   'border-blue-500',
    teal:   'border-teal-500',
    purple: 'border-purple-500',
    orange: 'border-orange-500',
    pink:   'border-pink-500',
    indigo: 'border-indigo-500',
}
const COLOR_BG = {
    blue:   'bg-blue-50 dark:bg-blue-900/10',
    teal:   'bg-teal-50 dark:bg-teal-900/10',
    purple: 'bg-purple-50 dark:bg-purple-900/10',
    orange: 'bg-orange-50 dark:bg-orange-900/10',
    pink:   'bg-pink-50 dark:bg-pink-900/10',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/10',
}
const COLOR_BADGE = {
    blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    teal:   'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    pink:   'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
}
const COLOR_INDICATOR = {
    blue:   'bg-blue-600 dark:bg-blue-400',
    teal:   'bg-teal-600 dark:bg-teal-400',
    purple: 'bg-purple-600 dark:bg-purple-400',
    orange: 'bg-orange-600 dark:bg-orange-400',
    pink:   'bg-pink-600 dark:bg-pink-400',
    indigo: 'bg-indigo-600 dark:bg-indigo-400',
}

function formatDate(iso) {
    if (!iso) return ''
    return formatFullDate(iso)
}

function formatMonthYear(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString([], { month: 'short', year: 'numeric' })
}

const NOTE_SORT_OPTIONS = [
    { value: 'default', label: 'Newest First' },
    { value: 'date_asc', label: 'Oldest First' },
    { value: 'name', label: 'Patient Name' },
    { value: 'ward', label: 'Ward' },
    { value: 'diagnosis', label: 'Diagnosis' },
]

const NOTE_FILTER_OPTIONS = [
    { value: 'all', label: 'All', icon: null },
    { value: 'patient', label: 'Patient', icon: User },
    { value: 'standalone', label: 'Notes', icon: StickyNote },
]

// Detail view modal for a single note
function NoteDetailModal({ doc, onClose, onEdit, onDelete, highlightText }) {
    const border = COLOR_BORDER[doc.color] || COLOR_BORDER.blue
    const bg = COLOR_BG[doc.color] || COLOR_BG.blue
    const badge = COLOR_BADGE[doc.color] || COLOR_BADGE.blue

    const diagStr = (doc.diagnosis || doc.patientDiagnosis || '').trim()
    const hasDiag = Boolean(diagStr)
    const nameStr = (doc.patientName || '').trim()
    const hasName = Boolean(nameStr)
    const wardStr = (doc.patientWard || '').trim()
    const hospStr = (doc.patientHosp || '').trim()
    const hasBio = hasName || Boolean(wardStr) || Boolean(hospStr)

    const modalRef = useRef(null)
    const bodyRef = useRef(null)

    useEffect(() => {
        if (highlightText && modalRef.current && bodyRef.current) {
            const timer = setTimeout(() => {
                const markEl = modalRef.current?.querySelector('mark')
                if (markEl && bodyRef.current) {
                    const markRect = markEl.getBoundingClientRect()
                    const bodyRect = bodyRef.current.getBoundingClientRect()
                    const relativeTop = markRect.top - bodyRect.top + bodyRef.current.scrollTop
                    bodyRef.current.scrollTo({
                        top: Math.max(0, relativeTop - 40),
                        behavior: 'smooth'
                    })
                }
            }, 150)
            return () => clearTimeout(timer)
        }
    }, [highlightText, doc])

    return (
        <div
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                ref={modalRef}
                className={`modal-box max-w-md w-[95%] h-[70vh] max-h-[600px] flex flex-col p-0 overflow-hidden border-l-4 ${border}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="note-detail-title"
            >
                {/* Header */}
                <div className={`px-5 pt-4 pb-3 flex-shrink-0 ${bg}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex flex-col gap-1 overflow-hidden">
                                {hasDiag && (
                                    <div className="overflow-x-auto whitespace-nowrap custom-scrollbar pb-0.5">
                                        <h2 id="note-detail-title" className="font-bold text-gray-900 dark:text-white text-base leading-tight inline-block whitespace-nowrap">
                                            {highlightText ? <HighlightText text={diagStr} query={highlightText} /> : diagStr}
                                        </h2>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-2 py-0.5">
                                    {hasName && (
                                        <span className={`whitespace-nowrap ${hasDiag ? 'text-xs font-semibold text-gray-700 dark:text-gray-300' : 'font-bold text-base text-gray-900 dark:text-white'}`}>
                                            {hasDiag ? (
                                                <>Patient: {highlightText ? <HighlightText text={nameStr} query={highlightText} /> : nameStr}</>
                                            ) : (
                                                highlightText ? <HighlightText text={nameStr} query={highlightText} /> : nameStr
                                            )}
                                        </span>
                                    )}
                                    {wardStr && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap ${badge}`} title={wardStr}>
                                            {highlightText ? <HighlightText text={wardStr} query={highlightText} /> : wardStr}
                                        </span>
                                    )}
                                    {hospStr && (
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded whitespace-nowrap">
                                            {highlightText ? <HighlightText text={hospStr} query={highlightText} /> : hospStr}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                        {formatDate(doc.createdAt)}
                                    </span>
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

                {/* Body — full note text */}
                <div ref={bodyRef} className="px-5 py-4 flex-1 overflow-y-auto custom-scrollbar min-w-0 max-w-full">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere] [word-break:break-word]">
                        {highlightText ? <HighlightText text={doc.text} query={highlightText} /> : doc.text}
                    </p>
                    {doc.updatedAt && doc.updatedAt !== doc.createdAt && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 italic">
                            Edited: {formatSmartDate(doc.updatedAt)}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-3 flex-shrink-0">
                    <button
                        id="btn-delete-note"
                        className="btn-ghost flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-200 flex-1"
                        style={{ minHeight: '40px', fontSize: '0.875rem' }}
                        onClick={onDelete}
                    >
                        <Trash2 size={15} />
                        Delete
                    </button>
                    <button
                        id="btn-edit-note"
                        className="btn-primary flex items-center gap-2 flex-1"
                        style={{ minHeight: '40px', fontSize: '0.875rem' }}
                        onClick={onEdit}
                    >
                        <Edit2 size={15} />
                        Edit
                    </button>
                </div>
            </div>
        </div>
    )
}

const NoteCardItem = memo(({ doc, isSelected = false, onToggleSelect, selectionMode = false, onSelect, searchHighlight }) => {
    const border = COLOR_BORDER[doc.color] || COLOR_BORDER.blue
    const bg = COLOR_BG[doc.color] || COLOR_BG.blue
    const badge = COLOR_BADGE[doc.color] || COLOR_BADGE.blue

    const ref = useRef(null)
    const [overflows, setOverflows] = useState(false)
    const [thumbHeight, setThumbHeight] = useState(1)
    const [thumbTopFrac, setThumbTopFrac] = useState(0)
    const isDraggingScrollbar = useRef(false)
    const sbDragStartY = useRef(0)
    const sbDragStartScrollTop = useRef(0)
    const syncThumb = useRef(null)

    // Long-press selection state
    const [pressRing, setPressRing] = useState(false)
    const startX = useRef(null)
    const startY = useRef(null)
    const longPressTriggered = useRef(false)
    const suppressClick = useRef(false)
    const longPressTimer = useRef(null)

    const diagStr = (doc.diagnosis || doc.patientDiagnosis || '').trim()
    const hasDiag = Boolean(diagStr)
    const nameStr = (doc.patientName || '').trim()
    const hasName = Boolean(nameStr)
    const wardStr = (doc.patientWard || '').trim()
    const hospStr = (doc.patientHosp || '').trim()
    const dateIso = doc.updatedAt && doc.updatedAt !== doc.createdAt ? doc.updatedAt : doc.createdAt
    const dateParts = formatSmartDateParts(dateIso)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const check = () => {
            const hasOverflow = el.scrollHeight > el.clientHeight + 2
            setOverflows(hasOverflow)
            if (hasOverflow) {
                const h = Math.max(0.08, el.clientHeight / el.scrollHeight)
                setThumbHeight(h)
                const maxScroll = el.scrollHeight - el.clientHeight
                setThumbTopFrac(maxScroll > 0 ? (el.scrollTop / maxScroll) * (1 - h) : 0)
            } else {
                setThumbHeight(1)
                setThumbTopFrac(0)
            }
        }
        syncThumb.current = check
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [doc.text])

    // Auto-scroll note preview container to highlight mark if matching text is inside
    useEffect(() => {
        if (searchHighlight && ref.current) {
            const timer = setTimeout(() => {
                const markEl = ref.current?.querySelector('mark')
                if (markEl) {
                    const markTop = markEl.offsetTop
                    const containerTop = ref.current.offsetTop
                    ref.current.scrollTop = Math.max(0, markTop - containerTop - 10)
                }
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [searchHighlight, doc.text])

    const handleNoteScroll = () => syncThumb.current?.()

    const handleThumbPointerDown = (e) => {
        e.stopPropagation()
        e.preventDefault()
        isDraggingScrollbar.current = true
        sbDragStartY.current = e.clientY
        sbDragStartScrollTop.current = ref.current?.scrollTop ?? 0
        e.currentTarget.setPointerCapture(e.pointerId)
    }
    const handleThumbPointerMove = (e) => {
        if (!isDraggingScrollbar.current) return
        e.stopPropagation()
        const el = ref.current
        if (!el) return
        const movableRange = el.clientHeight * (1 - thumbHeight)
        if (movableRange <= 0) return
        const dy = e.clientY - sbDragStartY.current
        const maxScroll = el.scrollHeight - el.clientHeight
        el.scrollTop = Math.max(0, Math.min(maxScroll, sbDragStartScrollTop.current + (dy / movableRange) * maxScroll))
    }
    const handleThumbPointerUp = (e) => {
        isDraggingScrollbar.current = false
        e.currentTarget.releasePointerCapture(e.pointerId)
    }

    const handlePointerDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        startX.current = e.clientX
        startY.current = e.clientY
        longPressTriggered.current = false

        if (onToggleSelect) {
            longPressTimer.current = setTimeout(() => {
                longPressTriggered.current = true
                suppressClick.current = true
                setPressRing(true)
                setTimeout(() => setPressRing(false), 400)
                onToggleSelect(doc.id)
            }, 500)
        }
    }

    const handlePointerMove = (e) => {
        if (startX.current === null) return
        const dx = e.clientX - startX.current
        const dy = e.clientY - (startY.current ?? e.clientY)
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            clearTimeout(longPressTimer.current)
        }
    }

    const handlePointerUp = () => {
        clearTimeout(longPressTimer.current)
        startX.current = null
        startY.current = null
        longPressTriggered.current = false
    }

    const handleCardClick = (e) => {
        if (suppressClick.current) {
            suppressClick.current = false
            e.stopPropagation()
            return
        }

        if (selectionMode && onToggleSelect) {
            e.stopPropagation()
            onToggleSelect(doc.id)
            return
        }

        onSelect?.()
    }

    return (
        <div
            id={`note-card-${doc.id}`}
            className={`w-full text-left card p-0 overflow-hidden border-l-4 ${border} hover:-translate-y-0.5 active:scale-[0.99] transition-all relative group cursor-pointer ${
                isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600 shadow-md ring-2 ring-blue-300 dark:ring-blue-800'
                    : ''
            }`}
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

            {/* Selected: checkmark stamp in top-right */}
            {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-blue-500 dark:bg-blue-400 flex items-center justify-center shadow-md z-20 animate-in zoom-in-50 duration-200">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                    </svg>
                </div>
            )}

            {/* Card header — single line: Diagnosis if present, else Biodata + Date */}
            <div className={`px-4 py-2.5 flex items-center gap-1.5 overflow-hidden ${bg}`}>
                {hasDiag ? (
                    <div className="overflow-x-auto whitespace-nowrap custom-scrollbar flex-1 min-w-0">
                        <span className="font-bold text-sm text-gray-900 dark:text-white whitespace-nowrap">
                            {searchHighlight ? <HighlightText text={diagStr} query={searchHighlight} /> : diagStr}
                        </span>
                    </div>
                ) : (
                    <div className="overflow-x-auto whitespace-nowrap custom-scrollbar flex items-center gap-1.5 flex-1 min-w-0">
                        {hasName ? (
                            <span className="font-bold text-sm text-gray-900 dark:text-white whitespace-nowrap shrink-0">
                                {searchHighlight ? <HighlightText text={nameStr} query={searchHighlight} /> : nameStr}
                            </span>
                        ) : hospStr ? (
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                                {searchHighlight ? <HighlightText text={hospStr} query={searchHighlight} /> : hospStr}
                            </span>
                        ) : wardStr ? (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap shrink-0 ${badge}`} title={wardStr}>
                                {searchHighlight ? <HighlightText text={wardStr} query={searchHighlight} /> : wardStr}
                            </span>
                        ) : null}
                    </div>
                )}
                <div className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0 ml-auto text-right leading-tight">
                    {dateParts.date && <div>{dateParts.date}</div>}
                    {dateParts.time && <div>{dateParts.time}</div>}
                </div>
            </div>

            {/* Text preview — scrollable with custom right scrollbar */}
            <div className="px-4 py-2 min-w-0 max-w-full flex items-start gap-1.5">
                <p
                    ref={ref}
                    className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere] [word-break:break-word] max-h-[5.75rem] overflow-y-auto pointer-events-none select-none"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    onScroll={handleNoteScroll}
                >
                    {searchHighlight ? <HighlightText text={doc.text} query={searchHighlight} /> : doc.text}
                </p>
                {/* Custom right scrollbar (Micro-thin ghost bar) */}
                {overflows && (
                    <div className="flex-shrink-0 w-[2.5px] rounded-full bg-transparent relative self-stretch opacity-20 group-hover:opacity-75 hover:!opacity-100 transition-opacity duration-300">
                        <div
                            className="absolute -left-1.5 -right-1.5 top-0 bottom-0 cursor-grab active:cursor-grabbing touch-none flex justify-center"
                            style={{
                                height: `${thumbHeight * 100}%`,
                                top: `${thumbTopFrac * 100}%`,
                            }}
                            onPointerDown={handleThumbPointerDown}
                            onPointerMove={handleThumbPointerMove}
                            onPointerUp={handleThumbPointerUp}
                            onPointerCancel={handleThumbPointerUp}
                        >
                            <div className="w-[2.5px] h-full rounded-full bg-gray-400/70 dark:bg-gray-500/70 hover:bg-blue-600 dark:hover:bg-blue-400 transition-colors" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
})

const NotebookActionBar = memo(({
    onImport,
    onHandover,
    onAddNote,
    selectedCount = 0,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const hasSelection = selectedCount > 0

    useEffect(() => {
        if (hasSelection) setIsCollapsed(false)
    }, [hasSelection])

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl h-[54px] pointer-events-none mb-[env(safe-area-inset-bottom,0px)]">
            <div className="relative w-full h-full">
                {/* Collapse / expand button */}
                <button
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label={isCollapsed ? "Expand action bar" : "Collapse action bar"}
                    className="absolute -top-2.5 right-4 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 shadow-md text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-1 rounded-full transition-all active:scale-90 cursor-pointer z-20 pointer-events-auto flex items-center justify-center"
                    title={isCollapsed ? "Expand action bar" : "Collapse action bar"}
                >
                    {isCollapsed ? (
                        <ChevronUp size={18} strokeWidth={2.5} />
                    ) : (
                        <ChevronDown size={18} strokeWidth={2.5} />
                    )}
                    {isCollapsed && hasSelection && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-xs animate-pulse">
                            {selectedCount}
                        </span>
                    )}
                </button>

                {/* 3-Button Action Bar */}
                {!isCollapsed && (
                    <div className="w-full h-full p-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-xl shadow-gray-900/10 dark:shadow-black/40 flex items-center justify-between pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
                        {/* 1. Receive */}
                        <button
                            type="button"
                            onClick={onImport}
                            aria-label="Receive or import notes"
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-all active:scale-95 cursor-pointer"
                        >
                            <QrCode size={19} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.2} />
                            <span>Receive</span>
                        </button>

                        {/* Divider */}
                        <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700/80 shrink-0" />

                        {/* 2. Send */}
                        <button
                            type="button"
                            onClick={onHandover}
                            aria-label={hasSelection ? `Send ${selectedCount} selected notes` : 'Send notes'}
                            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                                hasSelection
                                    ? 'bg-purple-600 dark:bg-purple-600 text-white shadow-xs shadow-purple-500/30 font-extrabold active:scale-95 cursor-pointer'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 active:scale-95 cursor-pointer'
                            }`}
                        >
                            <div className="relative flex items-center justify-center">
                                <Send size={19} className={hasSelection ? 'text-white' : 'text-purple-600 dark:text-purple-400'} strokeWidth={2.2} />
                                {hasSelection && (
                                    <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-[9px] font-black px-1 rounded-full min-w-[16px] h-[16px] flex items-center justify-center shadow-xs border border-white dark:border-gray-800">
                                        {selectedCount}
                                    </span>
                                )}
                            </div>
                            <span>Send</span>
                        </button>

                        {/* Divider */}
                        <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700/80 shrink-0" />

                        {/* 3. Add Note */}
                        <button
                            type="button"
                            onClick={onAddNote}
                            aria-label="Add note to notebook"
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-all active:scale-95 cursor-pointer"
                        >
                            <BookOpen size={19} className="text-blue-600 dark:text-blue-400" strokeWidth={2.2} />
                            <span>Add Note</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
})

const NotebookPageInner = ({ docs, onUpdateDoc, onDeleteDoc, showUndoToast, onUndo, setShowUndoToast, addDoc, addStandaloneDoc, initialEditDoc, onStartEdit, onCancelEdit, navigate, initialSelectedDocId, searchHighlight, onDocOpened, onImport, onHandover }) => {
    const [selectedDoc, setSelectedDoc] = useState(null)
    const [editingDoc, setEditingDoc] = useState(null)
    const [showAddNoteForm, setShowAddNoteForm] = useState(false)
    const [sortBy, setSortBy] = useState('default')
    const [noteFilter, setNoteFilter] = useState('all')

    // Selection state for notebook entries
    const [selectedDocIds, setSelectedDocIds] = useState(new Set())

    const toggleSelectDoc = useCallback((id) => {
        setSelectedDocIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const editInitialData = useMemo(() => {
        if (!editingDoc) return null
        return {
            id: editingDoc.id,
            name: editingDoc.patientName || '',
            hospitalNumber: editingDoc.patientHosp || '',
            ward: editingDoc.patientWard || '',
            bed: editingDoc.patientBed || '',
            admissionDate: editingDoc.admissionDate || '',
            diagnosis: editingDoc.diagnosis || editingDoc.patientDiagnosis || '',
            note: editingDoc.text || '',
            critical: editingDoc.critical || false,
            team: editingDoc.team || 'my_team',
        }
    }, [editingDoc])

    useEffect(() => {
        if (initialEditDoc && initialEditDoc.id !== editingDoc?.id) {
            setEditingDoc(initialEditDoc)
        }
    }, [initialEditDoc, editingDoc])

    const sortDocs = (list) => {
        if (sortBy === 'default') {
            return [...list].sort((a, b) => {
                const aTime = Date.parse(a.updatedAt || a.createdAt || 0)
                const bTime = Date.parse(b.updatedAt || b.createdAt || 0)
                return bTime - aTime
            })
        }
        return [...list].sort((a, b) => {
            if (sortBy === 'date_asc') {
                return Date.parse(a.createdAt || 0) - Date.parse(b.createdAt || 0)
            }

            if (sortBy === 'name') {
                return (a.patientName || '').localeCompare(b.patientName || '', undefined, { numeric: true, sensitivity: 'base' })
            }

            if (sortBy === 'ward') {
                const wardCmp = (a.patientWard || '').localeCompare(b.patientWard || '', undefined, { numeric: true, sensitivity: 'base' })
                if (wardCmp !== 0) return wardCmp
                return (a.patientBed || '').localeCompare(b.patientBed || '', undefined, { numeric: true, sensitivity: 'base' })
            }

            if (sortBy === 'diagnosis') {
                return (a.diagnosis || a.patientDiagnosis || '').localeCompare(b.diagnosis || b.patientDiagnosis || '', undefined, { numeric: true, sensitivity: 'base' })
            }

            return 0
        })
    }

    const [visibleCount, setVisibleCount] = useState(30)
    const sentinelRef = useRef(null)

    // Reset windowing limit when filter or sort changes
    useEffect(() => {
        setVisibleCount(30)
    }, [sortBy, noteFilter])

    const filterCounts = useMemo(() => ({
        all: docs.length,
        patient: docs.filter(d => d.patientId != null || Boolean(d.patientName?.trim() || d.patientWard?.trim() || d.patientHosp?.trim())).length,
        standalone: docs.filter(d => d.patientId == null && !d.patientName?.trim() && !d.patientWard?.trim() && !d.patientHosp?.trim()).length,
    }), [docs])

    const filteredDocs = useMemo(() => {
        if (noteFilter === 'patient') {
            return docs.filter(d => d.patientId != null || Boolean(d.patientName?.trim() || d.patientWard?.trim() || d.patientHosp?.trim()))
        }
        if (noteFilter === 'standalone') {
            return docs.filter(d => d.patientId == null && !d.patientName?.trim() && !d.patientWard?.trim() && !d.patientHosp?.trim())
        }
        return docs
    }, [docs, noteFilter])

    const sortedDocs = useMemo(() => sortDocs(filteredDocs), [filteredDocs, sortBy])
    const visibleDocs = useMemo(() => sortedDocs.slice(0, visibleCount), [sortedDocs, visibleCount])

    // Auto-open note detail & expand limits/filters when navigating from search
    useEffect(() => {
        if ((initialSelectedDocId || searchHighlight) && docs.length > 0) {
            if (initialSelectedDocId) {
                const doc = docs.find(d => d.id === initialSelectedDocId)
                if (doc) {
                    const isPatientNote = doc.patientId != null || Boolean(doc.patientName?.trim() || doc.patientWard?.trim() || doc.patientHosp?.trim())
                    if ((noteFilter === 'patient' && !isPatientNote) || (noteFilter === 'standalone' && isPatientNote)) {
                        setNoteFilter('all')
                    }
                    setSelectedDoc(doc)
                    onDocOpened?.()
                }
            } else if (searchHighlight) {
                setNoteFilter('all')
            }

            if (initialSelectedDocId) {
                const idx = sortedDocs.findIndex(d => d.id === initialSelectedDocId)
                if (idx >= 0) {
                    setVisibleCount(prev => Math.max(prev, idx + 1))
                }
            } else if (searchHighlight) {
                const q = searchHighlight.toLowerCase()
                const idx = sortedDocs.findIndex(d =>
                    (d.text || '').toLowerCase().includes(q) ||
                    (d.diagnosis || d.patientDiagnosis || '').toLowerCase().includes(q) ||
                    (d.patientName || '').toLowerCase().includes(q) ||
                    (d.patientWard || '').toLowerCase().includes(q) ||
                    (d.patientHosp || '').toLowerCase().includes(q)
                )
                if (idx >= 0) {
                    setVisibleCount(prev => Math.max(prev, idx + 1))
                }
            }
        }
    }, [initialSelectedDocId, searchHighlight, docs, sortedDocs, noteFilter, onDocOpened])

    const toggleSelectAllDocs = useCallback(() => {
        setSelectedDocIds(prev => {
            if (filteredDocs.length > 0 && filteredDocs.every(d => prev.has(d.id))) {
                return new Set()
            }
            return new Set(filteredDocs.map(d => d.id))
        })
    }, [filteredDocs])

    // Infinite scroll observer for loading next chunk
    useEffect(() => {
        if (visibleCount >= sortedDocs.length) return
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setVisibleCount(prev => Math.min(prev + 30, sortedDocs.length))
            }
        }, { rootMargin: '200px' })

        const currentSentinel = sentinelRef.current
        if (currentSentinel) observer.observe(currentSentinel)
        return () => {
            if (currentSentinel) observer.unobserve(currentSentinel)
        }
    }, [visibleCount, sortedDocs.length])

    const handleDeleteFromDetail = (doc) => {
        setSelectedDoc(null)
        onDeleteDoc(doc.id)
    }

    const handleEditSave = (data) => {
        if (data.isStandaloneNote) {
            // Note mode — only update text and diagnosis
            onUpdateDoc(editingDoc.id, data.text, editingDoc.color ?? 'blue', {
                diagnosis: data.diagnosis,
            })
        } else {
            // Full form mode — update all biodata fields
            const trimmedNote = (data.note || '').trim()
            const trimmedDiagnosis = (data.diagnosis || '').trim()
            onUpdateDoc(editingDoc.id, trimmedNote, editingDoc.color ?? 'blue', {
                name: data.name,
                hospitalNumber: data.hospitalNumber,
                ward: data.ward,
                diagnosis: trimmedDiagnosis,
            })
        }

        setEditingDoc(null)
        setSelectedDoc(null)
        onCancelEdit?.()
    }

    const handleAddNote = ({ text, diagnosis }) => {
        const trimmedNote = (text || '').trim()
        const trimmedDiagnosis = (diagnosis || '').trim()
        if (!trimmedNote) return false

        addStandaloneDoc(trimmedNote, trimmedDiagnosis)
        setShowAddNoteForm(false)
        navigate('/notebook')
        return true
    }

    const handleCancelAddNote = () => {
        setShowAddNoteForm(false)
        navigate('/notebook')
    }

    return (
        <div className="flex flex-col flex-1">
            {/* Card list */}
            <div className="flex-1 w-full max-w-2xl mx-auto px-4 pt-2 pb-36">
                {/* Filter & Sort controls */}
                {docs.length > 0 && (
                    <div className="flex items-center justify-between gap-2 mb-3">
                        {/* Left: Note type filter */}
                        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-md p-0.5">
                            {NOTE_FILTER_OPTIONS.map((opt) => {
                                const Icon = opt.icon
                                const isActive = noteFilter === opt.value
                                const count = filterCounts[opt.value] ?? 0
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setNoteFilter(opt.value)}
                                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                                            isActive
                                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                        aria-pressed={isActive}
                                        aria-label={`Filter: ${opt.label}`}
                                    >
                                        {Icon && <Icon size={10} />}
                                        {opt.label}
                                        <span className={`text-[9px] font-bold px-1 rounded-full ${
                                            isActive
                                                ? 'bg-gray-200 dark:bg-gray-500 text-gray-700 dark:text-gray-200'
                                                : 'bg-gray-200/60 dark:bg-gray-600/60 text-gray-500 dark:text-gray-400'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Right: Sort controls */}
                        <div className="flex items-center">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="text-[10px] text-gray-600 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-0 rounded-md px-1.5 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-300 dark:ring-blue-700"
                                aria-label="Sort notes by"
                            >
                                {NOTE_SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Select All button — new line between controls and first card */}
                {docs.length > 0 && (
                    <div className="mb-3">
                        <button
                            type="button"
                            onClick={toggleSelectAllDocs}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                selectedDocIds.size > 0
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-xs'
                                    : 'bg-gray-100 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300 border-gray-200/60 dark:border-gray-600/60 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            aria-label="Select all notes"
                        >
                            <CheckCircle2 size={14} strokeWidth={2.5} />
                            <span>
                                {filteredDocs.length > 0 && filteredDocs.every(d => selectedDocIds.has(d.id))
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </span>
                            {selectedDocIds.size > 0 && (
                                <span className="bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                    {selectedDocIds.size}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {filteredDocs.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
                        <div className="w-20 h-20 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-5">
                            <BookOpen size={34} className="text-teal-400 dark:text-teal-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {docs.length === 0 ? 'No notes yet' : 'No matching notes'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[240px] leading-relaxed">
                            {docs.length === 0
                                ? <>Tap the <strong>📝</strong> icon on any patient card to write your first documentation entry.</>
                                : <>Try switching the filter above to see other notes.</>
                            }
                        </p>
                        {docs.length === 0 && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 italic">
                                Notes are kept here even after a patient is discharged.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visibleDocs.map(doc => (
                            <NoteCardItem
                                key={doc.id}
                                doc={doc}
                                isSelected={selectedDocIds.has(doc.id)}
                                onToggleSelect={toggleSelectDoc}
                                selectionMode={selectedDocIds.size > 0}
                                onSelect={() => setSelectedDoc(doc)}
                                searchHighlight={searchHighlight}
                            />
                        ))}
                        {visibleCount < sortedDocs.length && (
                            <div ref={sentinelRef} className="py-4 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
                                Showing {visibleCount} of {sortedDocs.length} notes...
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Action Bar — Notebook View (3 actions: Receive, Send, Add Note) */}
            {!showAddNoteForm && !editingDoc && (
                <NotebookActionBar
                    onImport={onImport}
                    onHandover={() => onHandover?.(Array.from(selectedDocIds))}
                    onAddNote={() => {
                        navigate('/notebook/add')
                        setShowAddNoteForm(true)
                    }}
                    selectedCount={selectedDocIds.size}
                />
            )}

            {/* Detail modal */}
            {selectedDoc && !editingDoc && (
                <NoteDetailModal
                    doc={selectedDoc}
                    onClose={() => setSelectedDoc(null)}
                    onEdit={() => {
                        setEditingDoc(selectedDoc)
                        onStartEdit?.(selectedDoc)
                        navigate(`/notebook/edit`)
                    }}
                    onDelete={() => handleDeleteFromDetail(selectedDoc)}
                    highlightText={searchHighlight}
                />
            )}

            {/* Edit using AddPatientForm — use same UI style as how it was added */}
            {editingDoc && (
                <AddPatientForm
                    isNoteMode={!(editingDoc.patientId || editingDoc.patientName || editingDoc.patientWard || editingDoc.patientHosp)}
                    initialData={editInitialData}
                    onAdd={handleEditSave}
                    onCancel={() => {
                        setEditingDoc(null)
                        onCancelEdit?.()
                    }}
                />
            )}

            {/* Add New Note using AddPatientForm in note mode */}
            {showAddNoteForm && (
                <AddPatientForm
                    isNoteMode
                    onAdd={handleAddNote}
                    onCancel={handleCancelAddNote}
                />
            )}
        </div>
    )
}

export default memo(NotebookPageInner, (prev, next) => {
    if (prev.docs !== next.docs) return false
    if (prev.initialEditDoc !== next.initialEditDoc) return false
    if (prev.initialSelectedDocId !== next.initialSelectedDocId) return false
    if (prev.searchHighlight !== next.searchHighlight) return false
    if (prev.showUndoToast !== next.showUndoToast) return false
    if (prev.onUpdateDoc !== next.onUpdateDoc) return false
    if (prev.onDeleteDoc !== next.onDeleteDoc) return false
    if (prev.onUndo !== next.onUndo) return false
    if (prev.setShowUndoToast !== next.setShowUndoToast) return false
    if (prev.addDoc !== next.addDoc) return false
    if (prev.addStandaloneDoc !== next.addStandaloneDoc) return false
    if (prev.onCancelEdit !== next.onCancelEdit) return false
    if (prev.onStartEdit !== next.onStartEdit) return false
    if (prev.navigate !== next.navigate) return false
    if (prev.onDocOpened !== next.onDocOpened) return false
    if (prev.onImport !== next.onImport) return false
    if (prev.onHandover !== next.onHandover) return false
    return true
})
