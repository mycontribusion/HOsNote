import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Save, X, Undo2, Redo2 } from 'lucide-react'

const DRAFT_KEY = '4myteam_draft_patient'

function today() {
    return new Date().toISOString().split('T')[0]
}

// Keep parsePatientText to migrate old string-based drafts from localStorage
function parsePatientText(text) {
    const hasLabels = /^(Name|Hosp#|Ward|Bed|Date|Notes):/im.test(text)

    if (hasLabels) {
        const get = (label) => {
            const re = new RegExp(`^${label}:\\s*(.*)`, 'im')
            const m = text.match(re)
            return m ? m[1].trim() : ''
        }
        const notesMatch = text.match(/^Notes:\s*([\s\S]*)/im)
        const rawNote = notesMatch ? notesMatch[1].trim() : ''

        return {
            name: get('Name'),
            hospitalNumber: get('Hosp#'),
            ward: get('Ward').toUpperCase(),
            bed: get('Bed'),
            admissionDate: get('Date') || today(),
            note: rawNote,
        }
    }

    const lines = text.split('\n')
    return {
        name: (lines[0] || '').trim(),
        hospitalNumber: (lines[1] || '').trim(),
        ward: (lines[2] || '').trim().toUpperCase(),
        bed: (lines[3] || '').trim(),
        admissionDate: (lines[4] || '').trim() || today(),
        note: lines.slice(5).join('\n').trim()
    }
}

function loadDraft() {
    try {
        const raw = localStorage.getItem(DRAFT_KEY)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

function saveDraft(data) {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)) }
    catch { /* quota exceeded */ }
}

function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY) }
    catch { /* ignore */ }
}

export default function AddPatientForm({ onAdd, onCancel, initialData, initialTeam = 'my_team', isMortalityMode = false }) {
    const [team, setTeam] = useState(initialTeam)
    
    const [fields, setFields] = useState({ name: '', hospitalNumber: '', ward: '', bed: '', admissionDate: today(), note: '' })
    
    const [critical, setCritical] = useState(false)
    const [error, setError] = useState('')

    const nameRef = useRef(null)
    const hospRef = useRef(null)
    const wardRef = useRef(null)
    const bedRef = useRef(null)
    const dateRef = useRef(null)
    const noteRef = useRef(null)

    const [history, setHistory] = useState({ stack: [], index: -1 })
    const isUndoRedo = useRef(false)

    useEffect(() => {
        let initialFields = { name: '', hospitalNumber: '', ward: '', bed: '', admissionDate: today(), note: '' }
        if (initialData) {
            setTeam(initialData.team || 'my_team')
            initialFields = {
                name: initialData.name || '',
                hospitalNumber: initialData.hospitalNumber || '',
                ward: initialData.ward || '',
                bed: initialData.bed || '',
                admissionDate: initialData.admissionDate || today(),
                note: initialData.note || ''
            }
            setCritical(!!initialData.critical)
        } else {
            setTeam(initialTeam)
            setCritical(false)

            if (!isMortalityMode) {
                const draft = loadDraft()
                if (draft) {
                    setTeam(draft.team ?? initialTeam)
                    setCritical(!!draft.critical)
                    if (draft.fields) {
                        initialFields = draft.fields
                    } else if (draft.text && draft.text.trim()) {
                        initialFields = parsePatientText(draft.text)
                    }
                }
            }
        }
        setFields(initialFields)
        setHistory({ stack: [initialFields], index: 0 })
        isUndoRedo.current = true
    }, [initialData, initialTeam, isMortalityMode])

    useEffect(() => {
        if (isUndoRedo.current) {
            isUndoRedo.current = false
            return
        }
        const timer = setTimeout(() => {
            setHistory(prev => {
                const currStr = JSON.stringify(fields)
                const prevStr = JSON.stringify(prev.stack[prev.index])
                if (currStr === prevStr) return prev
                const nextStack = [...prev.stack.slice(0, prev.index + 1), fields]
                if (nextStack.length > 50) nextStack.shift()
                return { stack: nextStack, index: nextStack.length - 1 }
            })
        }, 500)
        return () => clearTimeout(timer)
    }, [fields])

    const handleUndo = () => {
        if (history.index > 0) {
            isUndoRedo.current = true
            const prevFields = history.stack[history.index - 1]
            setFields(prevFields)
            setHistory(prev => ({ ...prev, index: prev.index - 1 }))
            noteRef.current?.focus()
        }
    }

    const handleRedo = () => {
        if (history.index < history.stack.length - 1) {
            isUndoRedo.current = true
            const nextFields = history.stack[history.index + 1]
            setFields(nextFields)
            setHistory(prev => ({ ...prev, index: prev.index + 1 }))
            noteRef.current?.focus()
        }
    }

    const saveTimerRef = useRef(null)
    const scheduleDraftSave = useCallback((patch) => {
        if (initialData || isMortalityMode) return
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => saveDraft(patch), 500)
    }, [initialData, isMortalityMode])

    useEffect(() => () => clearTimeout(saveTimerRef.current), [])

    const currentDraft = useCallback((overrides = {}) => ({ team, fields, critical, ...overrides }), [team, fields, critical])
    
    // Add custom field update handler
    const updateField = (key, value) => {
        setFields(prev => {
            const next = { ...prev, [key]: value }
            scheduleDraftSave(currentDraft({ fields: next }))
            return next
        })
        setError('')
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setError('')
        const { name: n, hospitalNumber: h, ward: w } = fields
        if (!w && !h && !n) { setError('Please fill in at least Name, Hospital # or Ward.'); return }
        const result = onAdd({ team, name: n, hospitalNumber: h, ward: w, bed: fields.bed, note: fields.note, critical, admissionDate: fields.admissionDate })
        if (result === 'duplicate_hosp') { setError('A patient with this Hospital Number already exists.'); return }
        if (result === 'duplicate_bed')  { setError('This Ward/Bed is already occupied by another patient.'); return }
        if (result === 'duplicate')      { setError('A patient with this Hospital Number or Ward/Bed already exists.'); return }
        if (result) {
            clearDraft()
            const newBlank = { name: '', hospitalNumber: '', ward: '', bed: '', admissionDate: today(), note: '' }
            setFields(newBlank)
            setHistory({ stack: [newBlank], index: 0 })
            isUndoRedo.current = true
            setCritical(false)
            setError('')
        }
    }

    const handleEnter = (e, nextRef) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            nextRef.current?.focus()
        }
    }

    return (
        <div className="card p-2.5 sm:p-3 mb-4 dark:bg-gray-800 dark:border-gray-700">

            <form id="add-patient-form" onSubmit={handleSubmit}>

                {/* Team toggle */}
                {!isMortalityMode && (
                    <div className="flex bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg mb-2.5">
                        {[['my_team', 'My Team', 'text-blue-700 dark:text-blue-300'], ['other_team', 'On Call', 'text-purple-700 dark:text-purple-300']].map(([val, label, activeColor]) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => { setTeam(val); scheduleDraftSave(currentDraft({ team: val })) }}
                                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${team === val ? `bg-white dark:bg-gray-600 ${activeColor} shadow-sm` : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Faux-textarea container */}
                <div className="mb-2 relative">
                    <div className="flex items-center justify-between mb-2 sticky top-[72px] z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md py-1.5 -mx-1 px-1 rounded-lg">
                        {/* Undo / Redo */}
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleUndo}
                                disabled={history.index <= 0}
                                className="p-2 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
                                aria-label="Undo"
                            >
                                <Undo2 size={18} strokeWidth={2.5} />
                            </button>
                            <button
                                type="button"
                                onClick={handleRedo}
                                disabled={history.index >= history.stack.length - 1}
                                className="p-2 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
                                aria-label="Redo"
                            >
                                <Redo2 size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Critical in the middle */}
                            {!isMortalityMode && (
                                <button
                                    type="button"
                                    aria-label={critical ? 'Unmark critical' : 'Mark as critical'}
                                    onClick={() => { const next = !critical; setCritical(next); scheduleDraftSave(currentDraft({ critical: next })) }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-[11px] font-bold transition-all ${
                                        critical
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400'
                                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-300'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${critical ? 'bg-red-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-500'}`} />
                                    {critical ? 'CRITICAL' : 'Critical'}
                                </button>
                            )}

                            {/* Add / Save with text label */}
                            <button
                                id="btn-add-patient"
                                type="submit"
                                aria-label={initialData ? "Save" : "Add"}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 transition-colors"
                            >
                                {initialData ? <Save size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
                                <span className="text-xs font-bold">{initialData ? 'Save' : 'Add'}</span>
                            </button>

                            {/* Cancel */}
                            <button
                                type="button"
                                onClick={onCancel}
                                aria-label="Cancel"
                                className="p-2.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                            >
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    <div className="input-field text-left py-2.5 px-3 font-mono leading-relaxed flex flex-col cursor-text overflow-y-auto" style={{ minHeight: '148px', maxHeight: '520px', fontSize: '0.8rem' }} onClick={() => noteRef.current?.focus()}>
                        <div className="flex items-center gap-1 min-h-[22px]" onClick={e => e.stopPropagation()}>
                            <label className="text-gray-400 dark:text-gray-500 font-semibold select-none flex-shrink-0 w-14">Name:</label>
                            <input ref={nameRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 min-w-0" value={fields.name} onChange={e => updateField('name', e.target.value)} onKeyDown={e => handleEnter(e, hospRef)} autoComplete="off" spellCheck={false} />
                        </div>
                        <div className="flex items-center gap-1 min-h-[22px]" onClick={e => e.stopPropagation()}>
                            <label className="text-gray-400 dark:text-gray-500 font-semibold select-none flex-shrink-0 w-14">Hosp#:</label>
                            <input ref={hospRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 min-w-0" value={fields.hospitalNumber} onChange={e => updateField('hospitalNumber', e.target.value)} onKeyDown={e => handleEnter(e, wardRef)} autoComplete="off" spellCheck={false} />
                        </div>
                        <div className="flex items-center gap-1 min-h-[22px]" onClick={e => e.stopPropagation()}>
                            <label className="text-gray-400 dark:text-gray-500 font-semibold select-none flex-shrink-0 w-14">Ward:</label>
                            <input ref={wardRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 min-w-0" value={fields.ward} onChange={e => updateField('ward', e.target.value)} onKeyDown={e => handleEnter(e, bedRef)} autoComplete="off" spellCheck={false} />
                        </div>
                        <div className="flex items-center gap-1 min-h-[22px]" onClick={e => e.stopPropagation()}>
                            <label className="text-gray-400 dark:text-gray-500 font-semibold select-none flex-shrink-0 w-14">Bed:</label>
                            <input ref={bedRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 min-w-0" value={fields.bed} onChange={e => updateField('bed', e.target.value)} onKeyDown={e => handleEnter(e, dateRef)} autoComplete="off" spellCheck={false} />
                        </div>
                        <div className="flex items-center gap-1 min-h-[22px]" onClick={e => e.stopPropagation()}>
                            <label className="text-gray-400 dark:text-gray-500 font-semibold select-none flex-shrink-0 w-14">Date:</label>
                            <input ref={dateRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 min-w-0" value={fields.admissionDate} onChange={e => updateField('admissionDate', e.target.value)} onKeyDown={e => handleEnter(e, noteRef)} autoComplete="off" spellCheck={false} />
                        </div>
                        <div className="flex flex-col items-start gap-1 mt-1 relative" onClick={e => e.stopPropagation()}>
                            <label className="text-gray-400 dark:text-gray-500 font-semibold select-none flex-shrink-0 pt-[1px]">Notes:</label>
                            <textarea
                                ref={noteRef}
                                rows={15}
                                className="w-full bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 min-w-0 resize-none"
                                value={fields.note}
                                onChange={e => updateField('note', e.target.value)}
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div role="alert" className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-xs font-medium mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                        {error}
                    </div>
                )}

            </form>
        </div>
    )
}
