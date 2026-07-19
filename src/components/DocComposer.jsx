import { useState, useEffect, useRef } from 'react'
import { X, Save } from 'lucide-react'

const COLOR_OPTIONS = [
    { value: 'blue',   label: 'Blue',   bg: 'bg-blue-500' },
    { value: 'teal',   label: 'Teal',   bg: 'bg-teal-500' },
    { value: 'purple', label: 'Purple', bg: 'bg-purple-500' },
    { value: 'orange', label: 'Orange', bg: 'bg-orange-500' },
    { value: 'pink',   label: 'Pink',   bg: 'bg-pink-500' },
    { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
]

export default function DocComposer({ patient, existingDoc = null, onSave, onClose }) {
    const [text, setText] = useState(existingDoc?.text ?? '')
    const [color, setColor] = useState(existingDoc?.color ?? 'blue')
    const [error, setError] = useState('')
    const textareaRef = useRef(null)

    useEffect(() => {
        // Auto-focus and set initial height
        if (textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 280) + 'px'
        }
    }, [])

    useEffect(() => {
        // Lock background scroll while modal is open
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const handleSave = () => {
        if (!text.trim()) { setError('Note text cannot be empty.'); return }
        onSave({ text: text.trim(), color })
    }

    return (
        <div className="fixed top-0 left-0 w-full h-[100dvh] z-50 bg-gray-50 dark:bg-gray-950 flex flex-col sm:p-4 sm:items-center sm:justify-center overflow-hidden animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 w-full h-full sm:h-[85vh] sm:max-h-[800px] sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col sm:border sm:border-gray-200 dark:sm:border-gray-700 overflow-hidden">
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex flex-col h-full">
                    {/* Top Action Bar */}
                    <div className="flex items-center justify-between px-3 py-3 sm:px-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 shadow-sm z-10">
                        {/* Left: Title & Patient info */}
                        <div className="min-w-0 flex-1 pr-4">
                            <h2 id="doc-composer-title" className="font-bold text-gray-900 dark:text-white text-base leading-tight truncate">
                                {existingDoc ? 'Edit Note' : 'New Note'}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate font-medium">
                                {patient.name || 'Unknown Patient'}
                                {patient.ward ? ` · ${patient.ward}` : ''}
                                {patient.bed ? ` Bed ${patient.bed}` : ''}
                            </p>
                        </div>
                        {/* Right: Save & Cancel */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <button
                                id="btn-save-doc"
                                type="submit"
                                aria-label="Save"
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm shadow-blue-200 dark:shadow-blue-900/20 transition-all active:scale-95"
                            >
                                <Save size={18} strokeWidth={2.5} />
                                <span className="text-sm font-bold">Save</span>
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Cancel"
                                className="p-2.5 rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors active:scale-95 ml-1"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Form Body */}
                    <div className="flex-1 overflow-y-auto flex flex-col bg-white dark:bg-gray-800 p-4 sm:p-6" onClick={() => textareaRef.current?.focus()}>
                        
                        {/* Error */}
                        {error && (
                            <div role="alert" className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm font-bold mb-4 shrink-0 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                                {error}
                            </div>
                        )}

                        {/* Color picker */}
                        <div className="flex items-center justify-between mb-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shrink-0" onClick={e => e.stopPropagation()}>
                            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Color Tag</p>
                            <div className="flex gap-2">
                                {COLOR_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setColor(opt.value)}
                                        aria-label={opt.label}
                                        className={`w-8 h-8 rounded-full transition-all ${opt.bg} ${
                                            color === opt.value
                                                ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110 shadow-sm'
                                                : 'opacity-60 hover:opacity-90 hover:scale-105'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Text area */}
                        <div className="flex-1 flex flex-col min-h-[200px]">
                            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 shrink-0">Note Content</p>
                            <textarea
                                ref={textareaRef}
                                className="w-full flex-1 bg-transparent border-0 outline-none p-0 text-gray-900 dark:text-gray-100 resize-none text-base sm:text-sm leading-relaxed"
                                placeholder="Write your clinical documentation here…"
                                value={text}
                                onChange={(e) => {
                                    setText(e.target.value)
                                    setError('')
                                }}
                            />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
