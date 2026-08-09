import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, X, User, BookOpen, ChevronRight } from 'lucide-react'

export default function SearchOverlay({ patients, docs, onClose, onNavigateToPatient, onNavigateToNote }) {
    const [query, setQuery] = useState('')
    const inputRef = useRef(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const results = useMemo(() => {
        if (!query.trim()) return { patients: [], notes: [] }
        const q = query.trim().toLowerCase()

        const matchedPatients = patients
            .map(p => {
                let matchedField = null
                if ((p.name || '').toLowerCase().includes(q)) matchedField = 'name'
                else if ((p.hospitalNumber || '').toLowerCase().includes(q)) matchedField = 'hospitalNumber'
                else if ((p.ward || '').toLowerCase().includes(q)) matchedField = 'ward'
                else if ((p.bed || '').toLowerCase().includes(q)) matchedField = 'bed'
                else if ((p.diagnosis || '').toLowerCase().includes(q)) matchedField = 'diagnosis'
                else if ((p.note || '').toLowerCase().includes(q)) matchedField = 'note'
                return { ...p, matchedField }
            })
            .filter(p => p.matchedField !== null)
            .slice(0, 20)

        const matchedNotes = docs
            .filter(d =>
                (d.patientName || '').toLowerCase().includes(q) ||
                (d.patientHosp || '').toLowerCase().includes(q) ||
                (d.patientWard || '').toLowerCase().includes(q) ||
                (d.patientDiagnosis || d.diagnosis || '').toLowerCase().includes(q) ||
                (d.text || '').toLowerCase().includes(q)
            )
            .slice(0, 20)

        return { patients: matchedPatients, notes: matchedNotes }
    }, [query, patients, docs])

    const totalResults = results.patients.length + results.notes.length

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose()
    }

    return (
        <div
            className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-[60] flex flex-col"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            onKeyDown={handleKeyDown}
        >
            <div className="w-full max-w-2xl mx-auto mt-4 sm:mt-8 px-4">
                {/* Search input */}
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <Search size={20} className="text-gray-400 flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="search"
                            className="flex-1 bg-transparent text-base font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none min-w-0"
                            placeholder="Search patients, wards, notes..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                            aria-label="Close search"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Results */}
                    {query.trim() && (
                        <div className="border-t border-gray-100 dark:border-gray-700 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {totalResults === 0 ? (
                                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    <p className="text-sm font-medium">No results found</p>
                                    <p className="text-xs mt-1">Try a different search term</p>
                                </div>
                            ) : (
                                <div className="py-2">
                                    {/* Patient results */}
                                    {results.patients.length > 0 && (
                                        <div className="mb-2">
                                            <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                Patients ({results.patients.length})
                                            </p>
                                            {results.patients.map((patient) => (
                                                <button
                                                    key={patient.id}
                                                    onClick={() => {
                                                        onNavigateToPatient(patient.id, patient.matchedField, query)
                                                        onClose()
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                                        <User size={14} className="text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                            {patient.name || 'Unnamed'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                            {patient.ward && patient.bed
                                                                ? `Ward ${patient.ward} · Bed ${patient.bed}`
                                                                : patient.ward || patient.bed || 'No ward/bed'}
                                                            {patient.hospitalNumber && ` · ${patient.hospitalNumber}`}
                                                        </p>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Note results */}
                                    {results.notes.length > 0 && (
                                        <div>
                                            <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                Notes ({results.notes.length})
                                            </p>
                                            {results.notes.map((note) => (
                                                <button
                                                    key={note.id}
                                                    onClick={() => {
                                                        onNavigateToNote(note.id, query)
                                                        onClose()
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                                                        <BookOpen size={14} className="text-teal-600 dark:text-teal-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                            {note.patientName || 'Unnamed'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                            {note.patientWard && `Ward ${note.patientWard}`}
                                                            {note.patientDiagnosis || note.diagnosis
                                                                ? ` · ${(note.patientDiagnosis || note.diagnosis).substring(0, 30)}`
                                                                : ''}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                                            {note.text?.substring(0, 60)}{note.text?.length > 60 ? '...' : ''}
                                                        </p>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Hint */}
                <p className="text-center text-[10px] text-gray-500 dark:text-gray-400 mt-3">
                    Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[9px] font-mono">ESC</kbd> to close
                </p>
            </div>
        </div>
    )
}
