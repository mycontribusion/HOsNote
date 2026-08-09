import { useState, useMemo, useEffect } from 'react'
import { Edit2, Trash2, BookOpen } from 'lucide-react'
import AddPatientForm from './AddPatientForm'

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

function formatMonthYear(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString([], { month: 'short', year: 'numeric' })
}

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
                <div className={`px-5 pt-4 pb-3 ${bg}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex flex-col gap-1 overflow-hidden">
                                {hasDiag && (
                                    <div className="overflow-x-auto whitespace-nowrap custom-scrollbar pb-0.5">
                                        <h2 id="note-detail-title" className="font-bold text-gray-900 dark:text-white text-base leading-tight inline-block whitespace-nowrap">
                                            {diagStr}
                                        </h2>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-2 py-0.5">
                                    {hasName && (
                                        <span className={`whitespace-nowrap ${hasDiag ? 'text-xs font-semibold text-gray-700 dark:text-gray-300' : 'font-bold text-base text-gray-900 dark:text-white'}`}>
                                            {hasDiag ? `Patient: ${nameStr}` : nameStr}
                                        </span>
                                    )}
                                    {wardStr && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap ${badge}`}>
                                            {wardStr}
                                        </span>
                                    )}
                                    {hospStr && (
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded whitespace-nowrap">
                                            {hospStr}
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
                <div className="px-5 py-4 max-h-[50vh] overflow-y-auto custom-scrollbar min-w-0 max-w-full">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere] [word-break:break-word]">
                        {highlightText ? <HighlightText text={doc.text} query={highlightText} /> : doc.text}
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

export default function NotebookPage({ docs, onUpdateDoc, onDeleteDoc, showUndoToast, onUndo, setShowUndoToast, addDoc, initialEditDoc, onCancelEdit, navigate, initialSelectedDocId, searchHighlight, onDocOpened }) {
    const [selectedDoc, setSelectedDoc] = useState(null)
    const [editingDoc, setEditingDoc] = useState(null)

    useEffect(() => {
        if (initialEditDoc && initialEditDoc.id !== editingDoc?.id) {
            setEditingDoc(initialEditDoc)
        }
    }, [initialEditDoc, editingDoc])

    // Auto-open a note detail when navigating from search
    useEffect(() => {
        if (initialSelectedDocId && docs.length > 0) {
            const doc = docs.find(d => d.id === initialSelectedDocId)
            if (doc) {
                setSelectedDoc(doc)
                onDocOpened?.()
            }
        }
    }, [initialSelectedDocId, docs, onDocOpened])


    const handleDeleteFromDetail = (doc) => {
        setSelectedDoc(null)
        onDeleteDoc(doc.id)
    }

    const handleEditSave = ({ name, hospitalNumber, ward, bed, diagnosis, note, critical, team }) => {
        const trimmedNote = (note || '').trim()
        const trimmedDiagnosis = (diagnosis || '').trim()

        // Update the existing doc's metadata and text
        onUpdateDoc(editingDoc.id, trimmedNote, editingDoc.color ?? 'blue', {
            name,
            hospitalNumber,
            ward,
            diagnosis,
        })

        setEditingDoc(null)
        setSelectedDoc(null)
        onCancelEdit?.()
    }

    return (
        <div className="flex flex-col flex-1">
            {/* Card list */}
            <div className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-36">
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
                ) : (
                    <div className="space-y-3">
                        {docs.map(doc => {
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

                            return (
                                <button
                                    key={doc.id}
                                    id={`note-card-${doc.id}`}
                                    className={`w-full text-left card p-0 overflow-hidden border-l-4 ${border} hover:-translate-y-0.5 active:scale-[0.99] transition-all`}
                                    onClick={() => setSelectedDoc(doc)}
                                >
                                    {/* Card header — single line: Diagnosis if present, else Biodata + Date */}
                                    <div className={`px-4 py-2.5 flex items-center gap-1.5 overflow-hidden ${bg}`}>
                                        {hasDiag ? (
                                            <div className="overflow-x-auto whitespace-nowrap custom-scrollbar flex-1 min-w-0">
                                                <span className="font-bold text-sm text-gray-900 dark:text-white whitespace-nowrap">
                                                    {diagStr}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto whitespace-nowrap custom-scrollbar flex items-center gap-1.5 flex-1 min-w-0">
                                                {hasName ? (
                                                    <span className="font-bold text-sm text-gray-900 dark:text-white whitespace-nowrap shrink-0">
                                                        {nameStr}
                                                    </span>
                                                ) : hospStr ? (
                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                                                        {hospStr}
                                                    </span>
                                                ) : wardStr ? (
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap shrink-0 ${badge}`}>
                                                        {wardStr}
                                                    </span>
                                                ) : null}
                                            </div>
                                        )}
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0 ml-auto">
                                            {formatMonthYear(doc.createdAt)}
                                        </span>
                                    </div>
                                    {/* Text preview — max 4 lines, rest scrollable */}
                                    <div className="px-4 py-2 min-w-0 max-w-full">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere] [word-break:break-word] max-h-[5.75rem] overflow-y-auto custom-scrollbar pr-1">
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
                    onEdit={() => {
                        setEditingDoc(selectedDoc)
                        navigate(`/notebook/edit`)
                    }}
                    onDelete={() => handleDeleteFromDetail(selectedDoc)}
                    highlightText={searchHighlight}
                />
            )}

            {/* Edit using AddPatientForm */}
            {editingDoc && (
                <AddPatientForm
                    initialData={{
                        name: editingDoc.patientName || '',
                        hospitalNumber: editingDoc.patientHosp || '',
                        ward: editingDoc.patientWard || '',
                        bed: editingDoc.patientBed || '',
                        admissionDate: editingDoc.admissionDate || '',
                        diagnosis: editingDoc.diagnosis || editingDoc.patientDiagnosis || '',
                        note: editingDoc.text || '',
                        critical: editingDoc.critical || false,
                        team: editingDoc.team || 'my_team',
                    }}
                    onAdd={handleEditSave}
                    onCancel={() => {
                        setEditingDoc(null)
                        onCancelEdit?.()
                    }}
                />
            )}
        </div>
    )
}
