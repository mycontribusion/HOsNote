import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { Plus, Save, X, Undo2, Redo2 } from 'lucide-react'
import MicrophoneButton from './MicrophoneButton'
import { cleanPastedText } from '../utils/clipboard'
import { generateUniqueValue } from '../utils/uniqueSuffix'
import DuplicatePromptModal from './DuplicatePromptModal'

const DRAFT_KEY = '4myteam_draft_patient'
const EDIT_DRAFT_KEY = '4myteam_edit_draft_patient'
const DRAFT_KEY_NOTE = '4myteam_draft_note'
const EDIT_DRAFT_KEY_NOTE = '4myteam_edit_draft_note'

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

function loadEditDraft() {
    try {
        const raw = localStorage.getItem(EDIT_DRAFT_KEY)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

function saveEditDraft(data) {
    try { localStorage.setItem(EDIT_DRAFT_KEY, JSON.stringify(data)) }
    catch { /* quota exceeded */ }
}

function clearEditDraft() {
    try { localStorage.removeItem(EDIT_DRAFT_KEY) }
    catch { /* ignore */ }
}

function loadNoteDraft() {
    try {
        const raw = localStorage.getItem(DRAFT_KEY_NOTE)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

function saveNoteDraft(data) {
    try { localStorage.setItem(DRAFT_KEY_NOTE, JSON.stringify(data)) }
    catch { /* quota exceeded */ }
}

function clearNoteDraft() {
    try { localStorage.removeItem(DRAFT_KEY_NOTE) }
    catch { /* ignore */ }
}

function loadNoteEditDraft() {
    try {
        const raw = localStorage.getItem(EDIT_DRAFT_KEY_NOTE)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

function saveNoteEditDraft(data) {
    try { localStorage.setItem(EDIT_DRAFT_KEY_NOTE, JSON.stringify(data)) }
    catch { /* quota exceeded */ }
}

function clearNoteEditDraft() {
    try { localStorage.removeItem(EDIT_DRAFT_KEY_NOTE) }
    catch { /* ignore */ }
}

function toTitleCase(str) {
    if (!str) return str
    return str
        .split('')
        .map((char, index, arr) => {
            if (index === 0 || arr[index - 1] === ' ') {
                return char.toUpperCase()
            }
            return char.toLowerCase()
        })
        .join('')
}

function splitSuffix(value) {
    if (!value) return { base: '', suffix: '' }
    const match = value.match(/^(.+?)\((\d+)\)$/)
    if (match) {
        return { base: match[1], suffix: match[2] }
    }
    return { base: value, suffix: '' }
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
    const [keyboardOffset, setKeyboardOffset] = useState(0)

    useEffect(() => {
        if (!window.visualViewport) return

        const handleResize = () => {
            const viewport = window.visualViewport
            const offset = window.innerHeight - viewport.height - viewport.offsetTop
            setKeyboardOffset(offset > 0 ? offset : 0)
        }

        window.visualViewport.addEventListener('resize', handleResize)
        window.visualViewport.addEventListener('scroll', handleResize)
        handleResize()

        return () => {
            window.visualViewport.removeEventListener('resize', handleResize)
            window.visualViewport.removeEventListener('scroll', handleResize)
        }
    }, [])

    useEffect(() => {
        hasSavedRef.current = false
        let initialFields = { name: '', hospitalNumber: '', ward: '', bed: '', admissionDate: today(), diagnosis: '', note: '' }
        if (initialData) {
            // Check for edit draft first — retains unsaved changes across tab closes
            const loadEditDraftFn = isNoteMode ? loadNoteEditDraft : loadEditDraft
            const editDraft = loadEditDraftFn()
            if (editDraft && editDraft.patientId === initialData.id) {
                initialFields = editDraft.fields || initialFields
                setCritical(!!editDraft.critical)
            } else {
                initialFields = {
                    name: toTitleCase(initialData.name || ''),
                    hospitalNumber: initialData.hospitalNumber || '',
                    ward: initialData.ward || '',
                    bed: initialData.bed || '',
                    admissionDate: initialData.admissionDate || today(),
                    diagnosis: initialData.diagnosis || '',
                    note: initialData.note || ''
                }
                setCritical(!!initialData.critical)
            }
        } else if (isNoteMode) {
            setCritical(false)
            const draft = loadNoteDraft()
            if (draft) {
                if (draft.fields) {
                    initialFields = {
                        ...draft.fields,
                        name: toTitleCase(draft.fields.name || '')
                    }
                } else if (draft.text && draft.text.trim()) {
                    initialFields = parsePatientText(draft.text)
                }
            }
        } else {
            setCritical(false)

            if (!isMortalityMode) {
                const draft = loadDraft()
                if (draft) {
                    setCritical(!!draft.critical)
                    if (draft.fields) {
                        initialFields = {
                            ...draft.fields,
                            name: toTitleCase(draft.fields.name || '')
                        }
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
        if (isMortalityMode) return
        clearTimeout(saveTimerRef.current)
        if (initialData) {
            const saveFn = isNoteMode ? saveNoteEditDraft : saveEditDraft
            saveTimerRef.current = setTimeout(() => saveFn(patch), 500)
        } else {
            const saveFn = isNoteMode ? saveNoteDraft : saveDraft
            saveTimerRef.current = setTimeout(() => saveFn(patch), 500)
        }
    }, [initialData, isMortalityMode, isNoteMode])

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
                Promise.resolve(onAddRef.current({
                    team: teamRef.current,
                    name: fieldsRef.current.name,
                    hospitalNumber: fieldsRef.current.hospitalNumber,
                    ward: fieldsRef.current.ward,
                    bed: fieldsRef.current.bed,
                    note: fieldsRef.current.note,
                    critical: criticalRef.current,
                    admissionDate: fieldsRef.current.admissionDate,
                    diagnosis: fieldsRef.current.diagnosis,
                })).catch(() => {})
            }
        }
    }, [])

    // Save edit draft immediately on tab/browser close
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (initialData && !hasSavedRef.current) {
                const saveFn = isNoteMode ? saveNoteEditDraft : saveEditDraft
                saveFn({
                    patientId: initialData.id,
                    team: teamRef.current,
                    fields: {
                        name: fieldsRef.current.name,
                        hospitalNumber: fieldsRef.current.hospitalNumber,
                        ward: fieldsRef.current.ward,
                        bed: fieldsRef.current.bed,
                        admissionDate: fieldsRef.current.admissionDate,
                        diagnosis: fieldsRef.current.diagnosis,
                        note: fieldsRef.current.note,
                    },
                    critical: criticalRef.current,
                })
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [initialData, isNoteMode])

    useLayoutEffect(() => {
        if (isUndoRedo.current && scrollRestoreRef.current > 0) {
            scrollContainerRef.current?.scrollTo({ top: scrollRestoreRef.current, behavior: 'instant' })
            scrollRestoreRef.current = 0
        }
    }, [fields])

    useLayoutEffect(() => {
        // Focus management: new forms focus the first relevant input,
        // editing mode focuses the textarea at the end of the last word.
        if (initialData) {
            if (noteRef.current) {
                noteRef.current.focus()
                const text = (noteRef.current.value || '').trimEnd()
                if (text) {
                    const match = text.match(/(\S+)\s*$/)
                    if (match) {
                        const lastWordEnd = match.index + match[0].length
                        noteRef.current.setSelectionRange(lastWordEnd, lastWordEnd)
                    } else {
                        noteRef.current.setSelectionRange(text.length, text.length)
                    }
                } else {
                    noteRef.current.setSelectionRange(0, 0)
                }
            }
        } else if (isNoteMode) {
            diagRef.current?.focus()
        } else {
            nameRef.current?.focus()
        }
    }, [initialData, isNoteMode])

    useEffect(() => {
        // Lock background scroll while modal is open
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const currentDraft = useCallback((overrides = {}) => {
        const base = { team: 'my_team', fields, critical }
        if (initialData) {
            return { ...base, patientId: initialData.id, ...overrides }
        }
        return { ...base, ...overrides }
    }, [fields, critical, initialData])
    
    // Add custom field update handler
    const updateField = (key, value) => {
        setFields(prev => {
            const next = { ...prev, [key]: key === 'name' ? toTitleCase(value) : value }
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
            const currentVal = (fieldKey === 'hospitalNumber' || fieldKey === 'bed')
                ? splitSuffix(fields[fieldKey] || '').base
                : (fields[fieldKey] || '')
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
                    clearNoteDraft()
                } else {
                    clearNoteEditDraft()
                }
                const newBlank = { name: '', hospitalNumber: '', ward: '', bed: '', admissionDate: today(), diagnosis: '', note: '' }
                setFields(newBlank)
                setHistory({ stack: [newBlank], index: 0 })
                isUndoRedo.current = true
                setError('')
            }
            return
        }
        const { name: n, hospitalNumber: h, ward: w } = fields
        if (!w && !h && !n) { setError('Please fill in at least Name, Hospital # or Ward.'); return }
        hasSavedRef.current = true
        const result = onAdd({ team, name: n, hospitalNumber: h, ward: w, bed: fields.bed, note: fields.note, critical, admissionDate: fields.admissionDate, diagnosis: fields.diagnosis })
        if (result && result.type === 'duplicate_both') {
            setDuplicateInfo({ ...result, fieldLabel: 'Hospital Number & Ward/Bed' })
            return
        }
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
            else clearEditDraft()
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

        let currentFields = { ...fields }
        let currentDuplicate = duplicateInfo
        let attempts = 0
        const maxAttempts = 5

        while (currentDuplicate && attempts < maxAttempts) {
            const { field, value, ward, bedValue } = currentDuplicate
            let newValue = value
            let newBedValue = bedValue

            if (field === 'hospitalNumber') {
                newValue = generateUniqueValue(patients, 'hospitalNumber', value)
            } else if (field === 'bed') {
                newValue = generateUniqueValue(patients, 'bed', value, ward)
            } else if (field === 'both') {
                // Both hospital number and bed are duplicates — add suffix to both
                newValue = generateUniqueValue(patients, 'hospitalNumber', value)
                newBedValue = generateUniqueValue(patients, 'bed', bedValue, ward)
            }

            if (field === 'both') {
                currentFields = { ...currentFields, hospitalNumber: newValue, bed: newBedValue }
            } else {
                currentFields = { ...currentFields, [field]: newValue }
            }

            const { name: n, hospitalNumber: h, ward: w, bed: b, note: t, admissionDate: ad, diagnosis: d } = currentFields
            const result = onAdd({ team, name: n, hospitalNumber: h, ward: w, bed: b, note: t, critical, admissionDate: ad, diagnosis: d })

            if (result && result.type === 'duplicate_both') {
                currentDuplicate = { ...result, fieldLabel: 'Hospital Number & Ward/Bed' }
            } else if (result && result.type === 'duplicate_hosp') {
                currentDuplicate = { ...result, fieldLabel: 'Hospital Number' }
            } else if (result && result.type === 'duplicate_bed') {
                currentDuplicate = { ...result, fieldLabel: 'Ward/Bed' }
            } else {
                currentDuplicate = null
            }
            attempts++
        }

        setFields(currentFields)

        if (currentDuplicate) {
            setDuplicateInfo(currentDuplicate)
            return
        }

        setDuplicateInfo(null)
        setError('')
        hasSavedRef.current = true

        if (!initialData) clearDraft()
        else clearEditDraft()
        const newBlank = { name: '', hospitalNumber: '', ward: '', bed: '', admissionDate: today(), diagnosis: '', note: '' }
        setFields(newBlank)
        setHistory({ stack: [newBlank], index: 0 })
        isUndoRedo.current = true
        setCritical(false)
        setError('')
    }

    const handleCancel = () => {
        if (initialData) {
            const clearFn = isNoteMode ? clearNoteEditDraft : clearEditDraft
            clearFn()
            hasSavedRef.current = true
            // Auto-save changes when exiting edit mode
            if (isNoteMode) {
                const result = onAdd({ text: fields.note, diagnosis: fields.diagnosis, isStandaloneNote: true })
                if (result && result.type === 'duplicate_both') {
                    setError('A patient with this Hospital Number and Ward/Bed already exists.')
                    return
                }
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
                if (result && result.type === 'duplicate_both') {
                    setError('A patient with this Hospital Number and Ward/Bed already exists.')
                    return
                }
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

    const hospSplit = splitSuffix(fields.hospitalNumber)
    const bedSplit = splitSuffix(fields.bed)

    return (
        <div className="fixed top-0 left-0 w-full h-[100dvh] z-50 bg-gray-50 dark:bg-gray-950 flex flex-col sm:p-4 sm:items-center sm:justify-center overflow-hidden animate-in fade-in duration-200 min-w-0 max-w-full">
            <div className="bg-white dark:bg-gray-800 w-full h-full sm:h-[85vh] sm:max-h-[800px] sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col sm:border sm:border-gray-200 dark:sm:border-gray-700 overflow-hidden min-w-0 max-w-full">
                <form id="add-patient-form" onSubmit={handleSubmit} className="flex flex-col h-full min-w-0 max-w-full overflow-hidden">
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
                                        <input ref={nameRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 font-medium min-w-0 max-w-full placeholder-gray-300 dark:placeholder-gray-600" value={fields.name} onChange={e => updateField('name', e.target.value)} onPaste={e => handleCleanPaste(e, 'name')} onKeyDown={e => handleEnter(e, hospRef)} autoComplete="off" spellCheck={false} placeholder="Patient name" autoCapitalize="words" inputMode="text" />
                                    </div>
                                    <div className="flex items-center min-h-[32px] min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                                        <input ref={hospRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 font-medium min-w-0 max-w-full placeholder-gray-300 dark:placeholder-gray-600" value={hospSplit.base} onChange={e => updateField('hospitalNumber', e.target.value)} onPaste={e => handleCleanPaste(e, 'hospitalNumber')} onKeyDown={e => handleEnter(e, wardRef)} autoComplete="off" spellCheck={false} placeholder="Hospital number" />
                                        {hospSplit.suffix && (
                                            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium ml-2 select-none pointer-events-none flex-shrink-0">
                                                ({hospSplit.suffix})
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center min-h-[32px] min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                                        <input ref={wardRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 font-medium min-w-0 max-w-full placeholder-gray-300 dark:placeholder-gray-600" value={fields.ward} onChange={e => updateField('ward', e.target.value)} onPaste={e => handleCleanPaste(e, 'ward')} onKeyDown={e => handleEnter(e, bedRef)} autoComplete="off" spellCheck={false} placeholder="Ward" />
                                    </div>
                                    <div className="flex items-center min-h-[32px] min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                                        <input ref={bedRef} className="flex-1 bg-transparent outline-none p-0 text-gray-900 dark:text-gray-100 font-medium min-w-0 max-w-full placeholder-gray-300 dark:placeholder-gray-600" value={bedSplit.base} onChange={e => updateField('bed', e.target.value)} onPaste={e => handleCleanPaste(e, 'bed')} onKeyDown={e => handleEnter(e, dateRef)} autoComplete="off" spellCheck={false} placeholder="Bed" />
                                        {bedSplit.suffix && (
                                            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium ml-2 select-none pointer-events-none flex-shrink-0">
                                                ({bedSplit.suffix})
                                            </span>
                                        )}
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
                        <div className="h-20 sm:h-12 w-full shrink-0 pointer-events-none select-none" aria-hidden="true" />
                        
                    </div>

                    {/* Bottom Action Bar (Stays on top of keyboard) */}
                    <div 
                        style={{ transform: `translateY(-${keyboardOffset}px)` }}
                        className="flex items-center justify-between px-3 sm:px-4 py-2 min-h-[52px] border-t border-gray-200/70 dark:border-gray-700/70 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shrink-0 z-20 min-w-0 max-w-full transition-transform duration-75 ease-out pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-xs"
                    >
                        {/* Left Group: Undo/Redo (Expands based on device width) */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-[140px] sm:max-w-[220px]">
                            {/* Segmented Undo / Redo */}
                            <div className="flex items-center w-full p-1 rounded-xl bg-gray-100/90 dark:bg-gray-700/60 border border-gray-200/60 dark:border-gray-600/60">
                                <button
                                    type="button"
                                    onClick={handleUndo}
                                    disabled={history.index <= 0}
                                    className="flex-1 py-1.5 px-2 sm:px-3 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95"
                                    aria-label="Undo"
                                    title="Undo"
                                >
                                    <Undo2 size={15} strokeWidth={2.5} />
                                    <span className="hidden sm:inline">Undo</span>
                                </button>
                                <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-600 mx-0.5" />
                                <button
                                    type="button"
                                    onClick={handleRedo}
                                    disabled={history.index >= history.stack.length - 1}
                                    className="flex-1 py-1.5 px-2 sm:px-3 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95"
                                    aria-label="Redo"
                                    title="Redo"
                                >
                                    <Redo2 size={15} strokeWidth={2.5} />
                                    <span className="hidden sm:inline">Redo</span>
                                </button>
                            </div>
                        </div>

                        {/* Right Group: Critical toggle + Save + Cancel */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {!isNoteMode && !isMortalityMode && (
                                <button
                                    type="button"
                                    aria-label={critical ? 'Unmark critical' : 'Mark as critical'}
                                    onClick={() => { const next = !critical; setCritical(next); scheduleDraftSave(currentDraft({ critical: next })) }}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 ${
                                        critical
                                            ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm shadow-red-500/30'
                                            : 'bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400'
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${critical ? 'bg-white animate-pulse' : 'bg-gray-400 dark:bg-gray-500'}`} />
                                    {critical ? 'CRITICAL' : 'Critical'}
                                </button>
                            )}

                            {/* Add / Save Button */}
                            <button
                                id={isNoteMode ? 'btn-add-note' : 'btn-add-patient'}
                                type="submit"
                                aria-label={initialData ? 'Save' : 'Add'}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white font-bold text-xs transition-all active:scale-95 shadow-sm ${
                                    isMortalityMode
                                        ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-red-500/25'
                                        : isNoteMode
                                            ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-teal-500/25'
                                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-blue-500/25'
                                }`}
                            >
                                {initialData ? <Save size={13} strokeWidth={2.5} /> : <Plus size={13} strokeWidth={2.5} />}
                                {initialData ? 'Save' : 'Add'}
                            </button>

                            {/* Cancel / Dismiss */}
                            <button
                                type="button"
                                onClick={handleCancel}
                                aria-label="Cancel"
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700/70 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center transition-all active:scale-90"
                                title="Close"
                            >
                                <X size={14} strokeWidth={2.5} />
                            </button>
                        </div>
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
