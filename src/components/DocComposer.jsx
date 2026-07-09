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

    const autoGrow = (el) => {
        if (!el) return
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 280) + 'px'
    }

    const handleSave = () => {
        if (!text.trim()) { setError('Note text cannot be empty.'); return }
        onSave({ text: text.trim(), color })
    }

    return (
        <div
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal-box max-w-md w-[95%] p-0 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="doc-composer-title">
                {/* Header */}
                <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="min-w-0 flex-1">
                        <h2 id="doc-composer-title" className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                            {existingDoc ? 'Edit Note' : 'New Note'}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {patient.name || 'Unknown Patient'}
                            {patient.ward ? ` · ${patient.ward}` : ''}
                            {patient.bed ? ` Bed ${patient.bed}` : ''}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-icon !min-h-[36px] !min-w-[36px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ml-2 flex-shrink-0"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                    {/* Color picker */}
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Color</p>
                        <div className="flex gap-2">
                            {COLOR_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setColor(opt.value)}
                                    aria-label={opt.label}
                                    className={`w-8 h-8 rounded-full transition-all ${opt.bg} ${
                                        color === opt.value
                                            ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110'
                                            : 'opacity-60 hover:opacity-90 hover:scale-105'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Text area */}
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Note</p>
                        <textarea
                            ref={textareaRef}
                            className="input-field resize-none text-sm leading-relaxed"
                            style={{ minHeight: '120px', maxHeight: '280px', overflowY: 'auto' }}
                            placeholder="Write your clinical documentation here…"
                            value={text}
                            onChange={(e) => {
                                setText(e.target.value)
                                setError('')
                                autoGrow(e.target)
                            }}
                        />
                        {error && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium">{error}</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-5 pb-5">
                    <button
                        type="button"
                        className="btn-secondary px-5"
                        style={{ minHeight: '40px', fontSize: '0.875rem' }}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        id="btn-save-doc"
                        className="btn-primary px-5 flex items-center gap-2"
                        style={{ minHeight: '40px', fontSize: '0.875rem' }}
                        onClick={handleSave}
                    >
                        <Save size={15} strokeWidth={2.5} />
                        {existingDoc ? 'Save Changes' : 'Save Note'}
                    </button>
                </div>
            </div>
        </div>
    )
}
