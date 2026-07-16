import { useState, useMemo } from 'react'
import { Search, X, Edit2, Trash2, BookOpen } from 'lucide-react'
import DocComposer from './DocComposer'

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

function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Detail view modal for a single note
function NoteDetailModal({ doc, onClose, onEdit, onDelete }) {
    const border = COLOR_BORDER[doc.color] || COLOR_BORDER.blue
    const bg = COLOR_BG[doc.color] || COLOR_BG.blue
    const badge = COLOR_BADGE[doc.color] || COLOR_BADGE.blue

    return (
        <div
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className={`modal-box max-w-md w-[95%] p-0 overflow-hidden border-l-4 ${border}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="note-detail-title"
            >
                {/* Header */}
                <div className={`px-5 pt-5 pb-3 ${bg}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <h2 id="note-detail-title" className="font-bold text-gray-900 dark:text-white text-base leading-tight truncate">
                                {doc.patientName || 'Unknown Patient'}
                            </h2>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {doc.patientWard && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${badge}`}>
                                        {doc.patientWard}
                                    </span>
                                )}
                                {doc.patientHosp && (
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                        {doc.patientHosp}
                                    </span>
                                )}
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                    {formatDate(doc.createdAt)}
                                </span>
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
                <div className="px-5 py-4 max-h-[50vh] overflow-y-auto">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {doc.text}
                    </p>
                    {doc.updatedAt && doc.updatedAt !== doc.createdAt && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 italic">
                            Edited: {formatDate(doc.updatedAt)}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-3">
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

export default function NotebookPage({ docs, onUpdateDoc, onDeleteDoc, showUndoToast, onUndo, setShowUndoToast }) {
    const [query, setQuery] = useState('')
    const [selectedDoc, setSelectedDoc] = useState(null)
    const [editingDoc, setEditingDoc] = useState(null)

    const filtered = useMemo(() => {
        if (!query.trim()) return [...docs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        const q = query.trim().toLowerCase()
        return [...docs]
            .filter(d =>
                d.patientName?.toLowerCase().includes(q) ||
                d.patientWard?.toLowerCase().includes(q) ||
                d.text?.toLowerCase().includes(q)
            )
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }, [docs, query])

    const handleDeleteFromDetail = (doc) => {
        setSelectedDoc(null)
        onDeleteDoc(doc.id)
    }

    const handleEditSave = ({ text, color }) => {
        onUpdateDoc(editingDoc.id, text, color)
        setEditingDoc(null)
        setSelectedDoc(null)
    }

    return (
        <div className="flex flex-col flex-1">
            {/* Search bar */}
            <div className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-950 pt-4 pb-3 px-4">
                <div className="relative max-w-2xl mx-auto">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        id="notebook-search"
                        type="search"
                        className="input-field pl-9 pr-9 text-sm"
                        style={{ minHeight: '42px' }}
                        placeholder="Search by patient, ward or text…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            aria-label="Clear search"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>
                {query && (
                    <p className="text-center text-[10px] text-gray-400 mt-1.5">
                        {filtered.length === 0 ? 'No results' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
                    </p>
                )}
            </div>

            {/* Card list */}
            <div className="flex-1 w-full max-w-2xl mx-auto px-4 pb-36">
                {docs.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
                        <div className="w-20 h-20 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-5">
                            <BookOpen size={34} className="text-teal-400 dark:text-teal-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No notes yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[240px] leading-relaxed">
                            Tap the <strong>📝</strong> icon on any patient card to write your first documentation entry.
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 italic">
                            Notes are kept here even after a patient is discharged.
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 px-6 text-gray-500 dark:text-gray-400">
                        <p className="text-base font-semibold mb-1">No matches</p>
                        <p className="text-sm">Try a different name, ward, or keyword.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(doc => {
                            const border = COLOR_BORDER[doc.color] || COLOR_BORDER.blue
                            const bg = COLOR_BG[doc.color] || COLOR_BG.blue
                            const badge = COLOR_BADGE[doc.color] || COLOR_BADGE.blue
                            return (
                                <button
                                    key={doc.id}
                                    id={`note-card-${doc.id}`}
                                    className={`w-full text-left card p-0 overflow-hidden border-l-4 ${border} hover:-translate-y-0.5 active:scale-[0.99] transition-all`}
                                    onClick={() => setSelectedDoc(doc)}
                                >
                                    {/* Card header — compact single row */}
                                    <div className={`px-4 py-2 flex items-center justify-between gap-2 ${bg}`}>
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                                {doc.patientName || 'Unknown Patient'}
                                            </span>
                                            {doc.patientWard && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0 ${badge}`}>
                                                    {doc.patientWard}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                                            {formatDate(doc.createdAt)}
                                            {doc.updatedAt && doc.updatedAt !== doc.createdAt && ' · edited'}
                                        </span>
                                    </div>
                                    {/* Text preview — max 4 lines, rest scrollable */}
                                    <div className="px-4 py-2">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[5.75rem] overflow-y-auto">
                                            {doc.text}
                                        </p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Detail modal */}
            {selectedDoc && !editingDoc && (
                <NoteDetailModal
                    doc={selectedDoc}
                    onClose={() => setSelectedDoc(null)}
                    onEdit={() => setEditingDoc(selectedDoc)}
                    onDelete={() => handleDeleteFromDetail(selectedDoc)}
                />
            )}

            {/* Edit composer */}
            {editingDoc && (
                <DocComposer
                    patient={{
                        name: editingDoc.patientName,
                        ward: editingDoc.patientWard,
                        bed: editingDoc.patientBed,
                    }}
                    existingDoc={editingDoc}
                    onSave={handleEditSave}
                    onClose={() => setEditingDoc(null)}
                />
            )}
        </div>
    )
}
