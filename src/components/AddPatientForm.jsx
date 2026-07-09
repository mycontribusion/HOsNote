import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Save, X, Undo2, Redo2 } from 'lucide-react'

const DRAFT_KEY = '4myteam_draft_patient'

function today() {
    return new Date().toISOString().split('T')[0]
}

function makeTemplate(patient = {}) {
    return [
        `Name: ${patient.name || ''}`,
        `Hosp#: ${patient.hospitalNumber || ''}`,
        `Ward: ${patient.ward || ''}`,
        `Bed: ${patient.bed || ''}`,
        `Date: ${patient.admissionDate || today()}`,
        `Notes: ${patient.note || ''}`,
    ].join('\n')
}

// Parse label-prefixed lines, or fallback to original line-based format
function parsePatientText(text) {
    const hasLabels = /^(Name|Hosp#|Ward|Bed|Date|Notes):/im.test(text)

    if (hasLabels) {
        const get = (label) => {
            const re = new RegExp(`^${label}:\\s*(.*)`, 'im')
            const m = text.match(re)
            return m ? m[1].trim() : ''
        }
        // Notes can span multiple lines — grab everything after "Notes: ..."
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

    // Fallback: old line-based parsing
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
    const [text, setText] = useState('')
    const [critical, setCritical] = useState(false)
    const [error, setError] = useState('')
    const [draftRestored, setDraftRestored] = useState(false)
    const textareaRef = useRef(null)

    const autoGrow = useCallback((el) => {
        if (!el) return
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 240) + 'px'
    }, [])



    useEffect(() => { autoGrow(textareaRef.current) }, [text, autoGrow])

    const [history, setHistory] = useState({ stack: [], index: -1 })
    const isUndoRedo = useRef(false)

    useEffect(() => {
        let initialText = ''
        if (initialData) {
            setTeam(initialData.team || 'my_team')
            initialText = makeTemplate(initialData)
            setCritical(!!initialData.critical)
            setDraftRestored(false)
        } else {
            setTeam(initialTeam)
            setCritical(false)
            setDraftRestored(false)

            if (!isMortalityMode) {
                const draft = loadDraft()
                if (draft && draft.text && draft.text.trim()) {
                    setTeam(draft.team ?? initialTeam)
                    initialText = draft.text
                    setCritical(!!draft.critical)
                    setDraftRestored(true)
                } else {
                    initialText = makeTemplate()
                }
            } else {
                initialText = makeTemplate()
            }
        }
        setText(initialText)
        setHistory({ stack: [initialText], index: 0 })
        isUndoRedo.current = true
    }, [initialData, initialTeam, isMortalityMode])

    useEffect(() => {
        if (isUndoRedo.current) {
            isUndoRedo.current = false
            return
        }
        const timer = setTimeout(() => {
            setHistory(prev => {
                if (prev.stack[prev.index] === text) return prev
                const nextStack = [...prev.stack.slice(0, prev.index + 1), text]
                if (nextStack.length > 50) nextStack.shift()
                return { stack: nextStack, index: nextStack.length - 1 }
            })
        }, 500)
        return () => clearTimeout(timer)
    }, [text])

    const handleUndo = () => {
        if (history.index > 0) {
            isUndoRedo.current = true
            const prevText = history.stack[history.index - 1]
            setText(prevText)
            setHistory(prev => ({ ...prev, index: prev.index - 1 }))
            textareaRef.current?.focus()
        }
    }

    const handleRedo = () => {
        if (history.index < history.stack.length - 1) {
            isUndoRedo.current = true
            const nextText = history.stack[history.index + 1]
            setText(nextText)
            setHistory(prev => ({ ...prev, index: prev.index + 1 }))
            textareaRef.current?.focus()
        }
    }

    const saveTimerRef = useRef(null)
    const scheduleDraftSave = useCallback((patch) => {
        if (initialData || isMortalityMode) return
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => saveDraft(patch), 500)
    }, [initialData, isMortalityMode])

    useEffect(() => () => clearTimeout(saveTimerRef.current), [])

    const handleSubmit = (e) => {
        e.preventDefault()
        setError('')
        const parsed = parsePatientText(text)
        const { name: n, hospitalNumber: h, ward: w } = parsed
        if (!w && !h && !n) { setError('Please fill in at least Name, Hospital # or Ward.'); return }
        const result = onAdd({ team, name: n, hospitalNumber: h, ward: w, bed: parsed.bed, note: parsed.note, critical, admissionDate: parsed.admissionDate })
        if (result === 'duplicate_hosp') { setError('A patient with this Hospital Number already exists.'); return }
        if (result === 'duplicate_bed')  { setError('This Ward/Bed is already occupied by another patient.'); return }
        if (result === 'duplicate')      { setError('A patient with this Hospital Number or Ward/Bed already exists.'); return }
        if (result) {
            clearDraft()
            const newBlank = makeTemplate()
            setText(newBlank)
            setHistory({ stack: [newBlank], index: 0 })
            isUndoRedo.current = true
            setCritical(false)
            setError('')
            setDraftRestored(false)
        }
    }

    const currentDraft = useCallback((overrides = {}) => ({ team, text, critical, ...overrides }), [team, text, critical])

    return (
        <div className="card p-2.5 sm:p-3 mb-4 dark:bg-gray-800 dark:border-gray-700">

            {/* Draft restored notice */}
            {draftRestored && (
                <div role="status" className="flex items-center justify-between gap-2 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-2.5 py-1.5 text-xs font-medium mb-2">
                    <span>Draft restored</span>
                    <button type="button" aria-label="Dismiss" onClick={() => setDraftRestored(false)} className="text-blue-400 hover:text-blue-600 transition-colors">✕</button>
                </div>
            )}

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

                {/* Fill-in-the-blank textarea */}
                <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <label htmlFor="input-patient-text" className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                Patient Details
                            </label>
                            {/* Undo / Redo */}
                            <div className="flex items-center gap-0.5 ml-1">
                                <button
                                    type="button"
                                    onClick={handleUndo}
                                    disabled={history.index <= 0}
                                    className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
                                    aria-label="Undo"
                                >
                                    <Undo2 size={13} strokeWidth={2.5} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRedo}
                                    disabled={history.index >= history.stack.length - 1}
                                    className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
                                    aria-label="Redo"
                                >
                                    <Redo2 size={13} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Actions as icons */}
                            <button
                                type="button"
                                onClick={onCancel}
                                aria-label="Cancel"
                                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                            >
                                <X size={14} strokeWidth={2.5} />
                            </button>
                            <button
                                id="btn-add-patient"
                                type="submit"
                                aria-label={initialData ? "Save" : "Add"}
                                className="p-1.5 rounded-full text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 transition-colors"
                            >
                                {initialData ? <Save size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
                            </button>

                            {/* Compact critical toggle — inline pill */}
                            {!isMortalityMode && (
                                <button
                                    type="button"
                                    aria-label={critical ? 'Unmark critical' : 'Mark as critical'}
                                    onClick={() => { const next = !critical; setCritical(next); scheduleDraftSave(currentDraft({ critical: next })) }}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all ${
                                        critical
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400'
                                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-300'
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${critical ? 'bg-red-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-500'}`} />
                                    {critical ? 'CRITICAL' : 'Critical'}
                                </button>
                            )}
                        </div>
                    </div>

                    <textarea
                        id="input-patient-text"
                        ref={textareaRef}
                        rows={6}
                        className="input-field text-left resize-none py-2.5 px-3 font-mono leading-relaxed"
                        style={{ minHeight: '148px', maxHeight: '240px', fontSize: '0.8rem' }}
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value)
                            setError('')
                            autoGrow(e.target)
                            scheduleDraftSave(currentDraft({ text: e.target.value }))
                        }}
                        autoComplete="off"
                        spellCheck={false}
                    />
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
