import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { Plus, Save, X, Undo2, Redo2 } from 'lucide-react'
import MicrophoneButton from './MicrophoneButton'
import { cleanPastedText } from '../utils/clipboard'
import { generateUniqueValue } from '../utils/uniqueSuffix'
import DuplicatePromptModal from './DuplicatePromptModal'

const DRAFT_KEY = '4myteam_draft_patient'

function today() {
    return new Date().toISOString().split('T')[0]
}

// Keep parsePatientText to migrate old string-based drafts from localStorage
function parsePatientText(text) {
    const hasLabels = /^(Name|Hosp#|Ward|Bed|Date|Diag|Diagnosis|Notes):/im.test(text)

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
            diagnosis: get('Diagnosis') || get('Diag'),
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
        diagnosis: (lines[5] || '').trim(),
        note: lines.slice(6).join('\n').trim()
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

export default function AddPatientForm({ onAdd, onCancel, initialData, initialTeam = 'my_team', isMortalityMode = false, patients = [], isNoteMode = false }) {
    const [team] = useState(() => {
        if (initialData?.team) return initialData.team
        return initialTeam
    })
    
    const [fields, setFields] = useState({ name: '', hospitalNumber: '', ward: '', bed: '', admissionDate: today(), diagnosis: '', note: '' })
    
    const [critical, setCritical] = useState(false)
    const [error, setError] = useState('')
    const [duplicateInfo, setDuplicateInfo] = useState(null)

    const nameRef = useRef(null)
    const hospRef = useRef(null)
    const wardRef = useRef(null)
    const bedRef = useRef(null)
    const dateRef = useRef(null)
    const diagRef = useRef(null)
    const noteRef = useRef(null)
    const scrollContainerRef = useRef(null)
    const scrollRestoreRef = useRef(0)

    const hasSavedRef = useRef(false)
    const fieldsRef = useRef(fields)
    const teamRef = useRef(team)
    const criticalRef = useRef(critical)
    const initialDataRef = useRef(initialData)
    const onAddRef = useRef(onAdd)

    const [history, setHistory] = useState({ stack: [], index: -1 })
    const isUndoRedo = useRef(false)

    useEffect(() => {
        hasSavedRef.current = false
        let initialFields = { name: '', hospitalNumber: '', ward: '', bed: '', admissionDate: today(), diagnosis: '', note: '' }
        if (initialData) {
            initialFields = {
                name: initialData.name || '',
                hospitalNumber: initialData.hospitalNumber || '',
                ward: initialData.ward || '',
                bed: initialData.bed || '',
                admissionDate: initialData.admissionDate || today(),
                diagnosis: initialData.diagnosis || '',
                note: initialData.note || ''
            }
            setCritical(!!initialData.critical)
        } else if (isNoteMode) {
            setCritical(false)
        } else {
            setCritical(false)

            if (!isMortalityMode) {
                const draft = loadDraft()
                if (draft) {
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
    }, [initialData, isMortalityMode, isNoteMode])

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
            scrollRestoreRef.current = scrollContainerRef.current?.scrollTop ?? 0
            isUndoRedo.current = true
            const prevFields = history.stack[history.index - 1]
            setFields(prevFields)
            setHistory(prev => ({ ...prev, index: prev.index - 1 }))
            noteRef.current?.focus()
        }
    }

    const handleRedo = () => {
        if (history.index < history.stack.length - 1) {
            scrollRestoreRef.current = scrollContainerRef.current?.scrollTop ?? 0
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

    // Keep refs in sync with latest values for cleanup auto-save
    useEffect(() => {
        fieldsRef.current = fields
        teamRef.current = team
        criticalRef.current = critical
        initialDataRef.current = initialData
        onAddRef.current = onAdd
    })

    // Auto-save on unmount when in edit mode (e.g., browser back button / URL navigation)
    useEffect(() => {
        return () => {
            if (initialDataRef.current && !hasSavedRef.current) {
                onAddRef.current({
                    team: teamRef.current,
                    name: fieldsRef.current.name,
                    hospitalNumber: fieldsRef.current.hospitalNumber,
                    ward: fieldsRef.current.ward,
                    bed: fieldsRef.current.bed,
                    note: fieldsRef.current.note,
                    critical: criticalRef.current,
                    admissionDate: fieldsRef.current.admissionDate,
                    diagnosis: fieldsRef.current.diagnosis,
                }).catch(() => {})
            }
        }
    }, [])

    useLayoutEffect(() => {
        if (isUndoRedo.current && scrollRestoreRef.current > 0) {
            scrollContainerRef.current?.scrollTo({ top: scrollRestoreRef.current, behavior: 'instant' })
            scrollRestoreRef.current = 0
        }
    }, [fields])

    useEffect(() => {
        // Lock background scroll while modal is open
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const currentDraft = useCallback((overrides = {}) => ({ team: 'my_team', fields, critical, ...overrides }), [fields, critical])
    
    // Add custom field update handler
    const updateField = (key, value) => {
        setFields(prev => {
            const next = { ...prev, [key]: value }
            scheduleDraftSave(currentDraft({ fields: next }))
            return next
        })
        setError('')
    }

    const handleCleanPaste = (e, fieldKey) => {
        e.preventDefault()
        const raw = e.clipboardData?.getData('text/plain') || ''
        const cleaned = cleanPastedText(raw)

        if (!fieldKey || fieldKey === 'note') {
            const hasLabels = /^(Name|Hosp#|Ward|Bed|Date|Notes):/im.test(cleaned)
            if (hasLabels) {
                const parsed = parsePatientText(cleaned)
                setFields(parsed)
                scheduleDraftSave(currentDraft({ fields: parsed }))
                setError('')
                return
            }
        }

        if (fieldKey) {
            const target = e.target
            const finalVal = (fieldKey === 'note') ? cleaned : cleaned.replace(/[\n\r]+/g, ' ')
            const currentVal = fields[fieldKey] || ''
            const start = target?.selectionStart ?? currentVal.length
            const end = target?.selectionEnd ?? currentVal.length
            const newVal = currentVal.slice(0, start) + finalVal + currentVal.slice(end)

            updateField(fieldKey, newVal)

            setTimeout(() => {
                if (target && target.setSelectionRange) {
                    target.setSelectionRange(start + finalVal.length, start + finalVal.length)
                }
            }, 0)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setError('')
        if (isNoteMode) {
            hasSavedRef.current = true
            const result = onAdd({ text: fields.note, diagnosis: fields.diagnosis, isStandaloneNote: true })
            if (result) {
                if (!initialData) {
                    const newBlank = { name: '', hospitalNumber: '', ward: '', bed: '', admissionDate: today(), diagnosis: '', note: '' }
                    setFields(newBlank)
                    setHistory({ stack: [newBlank], index: 0 })
                    isUndoRedo.current = true
                }
                setError('')
            }
            return
        }
        const { name: n, hospitalNumber: h, ward: w } = fields
        if (!w && !h && !n) { setError('Please fill in at least Name, Hospital # or Ward.'); return }
        hasSavedRef.current = true
        const result = onAdd({ team, name: n, hospitalNumber: h, ward: w, bed: fields.bed, note: fields.note, critical, admissionDate: fields.admissionDate, diagnosis: fields.diagnosis })
        if (result && result.type === 'duplicate_hosp') {
            setDuplicateInfo({ ...result, fieldLabel: 'Hospital Number' })
            return
        }
        if (result && result.type === 'duplicate_bed') {
            setDuplicateInfo({ ...result, fieldLabel: 'Ward/Bed' })
            return
        }
        if (result) {
            if (!initialData) clearDraft()
            const newBlank = { name: '', hospitalNumber: '', ward: '', bed: '', admissionDate: today(), diagnosis: '', note: '' }
            setFields(newBlank)
            setHistory({ stack: [newBlank], index: 0 })
            isUndoRedo.current = true
            setCritical(false)
            setError('')
        }
    }

    const handleAddAsNew = () => {
        if (!duplicateInfo) return
        const { field, value, ward } = duplicateInfo
        let newValue = value
        if (field === 'hospitalNumber') {
            newValue = generateUniqueValue(patients, 'hospitalNumber', value)
        } else if (field === 'bed') {
            newValue = generateUniqueValue(patients, 'bed', value, ward)
        }
        setFields(prev => ({ ...prev, [field]: newValue }))
        setDuplicateInfo(null)
        setError('')
        hasSavedRef.current = true
        // Re-submit with the new unique value
        const { name: n, hospitalNumber: h, ward: w, bed: b, note: t, admissionDate: ad, diagnosis: d } = { ...fields, [field]: newValue }
        const result = onAdd({ team, name: n, hospitalNumber: h, ward: w, bed: b, note: t, critical, admissionDate: ad, diagnosis: d })
        if (result && result.type === 'duplicate_hosp') {
            setDuplicateInfo({ ...result, fieldLabel: 'Hospital Number' })
            return
        }
        if (result && result.type === 'duplicate_bed') {
            setDuplicateInfo({ ...result, fieldLabel: 'Ward/Bed' })
            return
        }
        if (result) {
            if (!initialData) clearDraft()
            const newBlank = { name: '', hospitalNumber: '', ward: '', bed: '', admissionDate: today(), diagnosis: '', note: '' }
            setFields(newBlank)
            setHistory({ stack: [newBlank], index: 0 })
            isUndoRedo.current = true
            setCritical(false)
            setError('')
        }
    }

    const handleCancel = () => {
        if (initialData) {
            hasSavedRef.current = true
            // Auto-save changes when exiting edit mode
            if (isNoteMode) {
                const result = onAdd({ text: fields.note, diagnosis: fields.diagnosis, isStandaloneNote: true })
                if (result && result.type === 'duplicate_hosp') {
                    setError('A patient with this Hospital Number already exists.')
                    return
                }
                if (result && result.type === 'duplicate_bed') {
                    setError('This Ward/Bed is already occupied by another patient.')
                    return
                }
            } else {
                const result = onAdd({
                    team,
                    name: fields.name,
                    hospitalNumber: fields.hospitalNumber,
                    ward: fields.ward,
                    bed: fields.bed,
                    note: fields.note,
                    critical,
                    admissionDate: fields.admissionDate,
                    diagnosis: fields.diagnosis,
                })
                if (result && result.type === 'duplicate_hosp') {
                    setError('A patient with this Hospital Number already exists.')
                    return
                }
                if (result && result.type === 'duplicate_bed') {
                    setError('This Ward/Bed is already occupied by another patient.')
                    return
                }
            }
        }
        onCancel()
    }

    const handleEnter = (e, nextRef) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            nextRef.current?.focus()
        }
    }

    return (
        <div className="fixed top-0 left-0 w-full h-[100dvh] z-50 bg-gray-50 dark:bg-gray-950 flex flex-col sm:p-4 sm:items-center sm:justify-center overflow-hidden animate-in fade-in duration-200 min-w-0 max-w-full">
            <div className="bg-white dark:bg-gray-800 w-full h-full sm:h-[85vh] sm:max-h-[800px] sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col sm:border sm:border-gray-200 dark:sm:border-gray-700 overflow-hidden min-w-0 max-w-full">
                <form id="add-patient-form" onSubmit={handleSubmit} className="flex flex-col h-full min-w-0 max-w-full overflow-hidden">

                    {/* Top Action Bar */}
                    <div className="flex items-center justify-between px-3 sm:px-4 h-[52px] border-b border-gray-200/70 dark:border-gray-700/70 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shrink-0 z-10 min-w-0 max-w-full">
                        {/* Left Group: Form Header Title & Segmented Undo/Redo */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 hidden sm:inline-block">
                                {isNoteMode ? (initialData ? 'Edit Note' : 'New Note') : isMortalityMode ? 'Mortality Record' : initialData ? 'Edit Patient' : 'New Patient'}
                            </span>

                            {/* Segmented Undo / Redo */}
                            <div className="flex items-center p-0.5 rounded-xl bg-gray-100/90 dark:bg-gray-700/60 border border-gray-200/60 dark:border-gray-600/60">
                                <button
                                    type="button"
                                    onClick={handleUndo}
                                    disabled={history.index <= 0}
                                    className="p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-90"
                                    aria-label="Undo"
                                    title="Undo"
                                >
                                    <Undo2 size={14} strokeWidth={2.5} />
                                </button>
                                <div className="w-[1px] h-3 bg-gray-200 dark:bg-gray-600 mx-0.5" />
                                <button
                                    type="button"
                                    onClick={handleRedo}
                                    disabled={history.index >= history.stack.length - 1}
                                    className="p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-90"
                                    aria-label="Redo"
                                    title="Redo"
                                >
                                    <Redo2 size={14} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Right Group: Primary Save + Dismiss */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {!isNoteMode && !isMortalityMode && (
                                <button
                                    type="button"
                                    aria-label={critical ? 'Unmark critical' : 'Mark as critical'}
                                    onClick={() => { const next = !critical; setCritical(next); scheduleDraftSave(currentDraft({ critical: next })) }}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all active:scale-95 ${
                                        critical
                                            ? 'bg-red-500 dark:bg-red-600 text-white shadow-xs shadow-red-500/30'
                                            : 'bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400'
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${critical ? 'bg-white animate-pulse' : 'bg-gray-400 dark:bg-gray-500'}`} />
                                    {critical ? 'CRITICAL' : 'Critical'}
                                </button>
                            )}

                            {/* Add / Save Button */}
                            <button
                                id={isNoteMode ? "btn-add-note" : "btn-add-patient"}
                                type="submit"
                                aria-label={initialData ? "Save" : "Add"}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-xs shadow-blue-500/25 transition-all active:scale-95"
                            >
                                {initialData ? <Save size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
                                <span className="text-xs font-bold">{initialData ? 'Save' : 'Add'}</span>
                            </button>

                            {/* Cancel / Dismiss */}
                            <button
                                type="button"
                                onClick={handleCancel}
                                aria-label="Cancel"
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700/70 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center transition-all active:scale-90 ml-0.5"
                                title="Close"
                            >
                                <X size={15} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Form Body (Unified scrolling for Biodata + Notes) */}
                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden flex flex-col bg-white dark:bg-gray-800 min-w-0 max-w-full">
                        
                        {/* Error */}
                        {error && (
                            <div role="alert" className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm font-bold mx-3 sm:mx-4 mb-3 shrink-0 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                                {error}
                            </div>
                        )}

                        {/* Faux-textarea container */}
                        <div className="text-left py-2 px-4 sm:px-6 font-sans leading-relaxed flex flex-col cursor-text min-h-[300px] min-w-0 max-w-full text-sm sm:text-base" onClick={() => noteRef.current?.focus()}>
                            {isNoteMode ? (
                                <>
                                    <div className="flex items-center min-h-[32px] mb-2 border-b border-gray-100 dark:border-gray-700/50 pb-2 min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                                        <input ref={diagRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 font-medium min-w-0 max-w-full placeholder-gray-300 dark:placeholder-gray-600" value={fields.diagnosis} onChange={e => updateField('diagnosis', e.target.value)} onPaste={e => handleCleanPaste(e, 'diagnosis')} onKeyDown={e => handleEnter(e, noteRef)} autoComplete="off" spellCheck={false} placeholder="Note title (optional)" />
                                    </div>
                                    <div className="flex flex-col items-start gap-1.5 mt-2 relative min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center justify-end w-full min-w-0 max-w-full mb-1">
                                            <MicrophoneButton
                                                onTranscript={(transcript) => {
                                                    setFields(prev => {
                                                        const next = prev.note.trim() ? `${prev.note.trim()} ${transcript}` : transcript
                                                        scheduleDraftSave(currentDraft({ fields: { ...prev, note: next } }))
                                                        return { ...prev, note: next }
                                                    })
                                                }}
                                                title="Dictate note"
                                            />
                                        </div>
                                        <div className="grid grid-cols-[minmax(0,1fr)] w-full min-h-[150px] min-w-0 max-w-full overflow-hidden [tab-size:2]">
                                            <div className="col-start-1 row-start-1 w-full min-w-0 max-w-full whitespace-pre-wrap break-all [overflow-wrap:anywhere] [word-break:break-word] invisible pointer-events-none p-0 m-0 leading-relaxed overflow-hidden font-sans pb-24" aria-hidden="true" style={{ fontSize: 'inherit', fontFamily: 'inherit' }}>
                                                {fields.note + ' \n'}
                                            </div>
                                            <textarea
                                                ref={noteRef}
                                                className="col-start-1 row-start-1 w-full h-full min-w-0 max-w-full bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 resize-none overflow-y-auto leading-relaxed font-sans break-all [overflow-wrap:anywhere] [word-break:break-word] placeholder-gray-300 dark:placeholder-gray-600 pb-24"
                                                value={fields.note}
                                                onChange={e => updateField('note', e.target.value)}
                                                onPaste={e => handleCleanPaste(e, 'note')}
                                                autoComplete="off"
                                                spellCheck={false}
                                                placeholder="Clinical notes…"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center min-h-[32px] min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                                        <input ref={nameRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 font-medium min-w-0 max-w-full placeholder-gray-300 dark:placeholder-gray-600" value={fields.name} onChange={e => updateField('name', e.target.value)} onPaste={e => handleCleanPaste(e, 'name')} onKeyDown={e => handleEnter(e, hospRef)} autoComplete="off" spellCheck={false} placeholder="Patient name" />
                                    </div>
                                    <div className="flex items-center min-h-[32px] min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                                        <input ref={hospRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 font-medium min-w-0 max-w-full placeholder-gray-300 dark:placeholder-gray-600" value={fields.hospitalNumber} onChange={e => updateField('hospitalNumber', e.target.value)} onPaste={e => handleCleanPaste(e, 'hospitalNumber')} onKeyDown={e => handleEnter(e, wardRef)} autoComplete="off" spellCheck={false} placeholder="Hospital number" />
                                    </div>
                                    <div className="flex items-center min-h-[32px] min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                                        <input ref={wardRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 font-medium min-w-0 max-w-full placeholder-gray-300 dark:placeholder-gray-600" value={fields.ward} onChange={e => updateField('ward', e.target.value)} onPaste={e => handleCleanPaste(e, 'ward')} onKeyDown={e => handleEnter(e, bedRef)} autoComplete="off" spellCheck={false} placeholder="Ward" />
                                    </div>
                                    <div className="flex items-center min-h-[32px] min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                                        <input ref={bedRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 font-medium min-w-0 max-w-full placeholder-gray-300 dark:placeholder-gray-600" value={fields.bed} onChange={e => updateField('bed', e.target.value)} onPaste={e => handleCleanPaste(e, 'bed')} onKeyDown={e => handleEnter(e, dateRef)} autoComplete="off" spellCheck={false} placeholder="Bed" />
                                    </div>
                                    <div className="flex items-center min-h-[32px] mb-2 border-b border-gray-100 dark:border-gray-700/50 pb-2 min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                                        <input ref={dateRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 font-medium min-w-0 max-w-full placeholder-gray-300 dark:placeholder-gray-600" value={fields.admissionDate} onChange={e => updateField('admissionDate', e.target.value)} onPaste={e => handleCleanPaste(e, 'admissionDate')} onKeyDown={e => handleEnter(e, diagRef)} autoComplete="off" spellCheck={false} placeholder="Admission date" />
                                    </div>
                                    <div className="flex items-center min-h-[32px] mb-2 border-b border-gray-100 dark:border-gray-700/50 pb-2 min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                                        <input ref={diagRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 font-medium min-w-0 max-w-full placeholder-gray-300 dark:placeholder-gray-600" value={fields.diagnosis} onChange={e => updateField('diagnosis', e.target.value)} onPaste={e => handleCleanPaste(e, 'diagnosis')} onKeyDown={e => handleEnter(e, noteRef)} autoComplete="off" spellCheck={false} placeholder="Diagnosis" />
                                    </div>
                                    <div className="flex flex-col items-start gap-1.5 mt-2 relative min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center justify-end w-full min-w-0 max-w-full mb-1">
                                            <MicrophoneButton
                                                onTranscript={(transcript) => {
                                                    setFields(prev => {
                                                        const next = prev.note.trim() ? `${prev.note.trim()} ${transcript}` : transcript
                                                        scheduleDraftSave(currentDraft({ fields: { ...prev, note: next } }))
                                                        return { ...prev, note: next }
                                                    })
                                                }}
                                                title="Dictate note"
                                            />
                                        </div>
                                        <div className="grid grid-cols-[minmax(0,1fr)] w-full min-h-[150px] min-w-0 max-w-full overflow-hidden [tab-size:2]">
                                            <div className="col-start-1 row-start-1 w-full min-w-0 max-w-full whitespace-pre-wrap break-all [overflow-wrap:anywhere] [word-break:break-word] invisible pointer-events-none p-0 m-0 leading-relaxed overflow-hidden font-sans pb-24" aria-hidden="true" style={{ fontSize: 'inherit', fontFamily: 'inherit' }}>
                                                {fields.note + ' \n'}
                                            </div>
                                            <textarea
                                                ref={noteRef}
                                                className="col-start-1 row-start-1 w-full h-full min-w-0 max-w-full bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 resize-none overflow-y-auto leading-relaxed font-sans break-all [overflow-wrap:anywhere] [word-break:break-word] placeholder-gray-300 dark:placeholder-gray-600 pb-24"
                                                value={fields.note}
                                                onChange={e => updateField('note', e.target.value)}
                                                onPaste={e => handleCleanPaste(e, 'note')}
                                                autoComplete="off"
                                                spellCheck={false}
                                                placeholder="Clinical notes…"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Non-interactive buffer zone below the form to prevent text from hiding behind mobile keyboards */}
                        <div className="h-48 sm:h-36 w-full shrink-0 pointer-events-none select-none" aria-hidden="true" />
                        
                    </div>
                </form>
                {duplicateInfo && (
                    <DuplicatePromptModal
                        duplicate={duplicateInfo}
                        onAddAsNew={handleAddAsNew}
                        onCancel={() => setDuplicateInfo(null)}
                    />
                )}
            </div>
        </div>
    )
}
