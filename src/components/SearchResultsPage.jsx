import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Search, X, ArrowLeft, User, BookOpen, Heart, Frown, Users, Sparkles } from 'lucide-react'
import PatientCard from './PatientCard'
import PatientDetailModal from './PatientDetailModal'
import { NoteCardItem, NoteDetailModal } from './NotebookPage'

export default function SearchResultsPage({
    patients = [],
    mortalities = [],
    docs = [],
    initialQuery = '',
    onBack,
    onEditPatient,
    onDeletePatient,
    onReviewPatient,
    onDocumentPatient,
    getDocCount,
    onDeleteMortality,
    onUpdateDoc,
    onDeleteDoc,
    onStartEditDoc,
    navigate
}) {
    const [query, setQuery] = useState(initialQuery)
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
    const [filterCategory, setFilterCategory] = useState('all') // 'all' | 'my_team' | 'other_team' | 'notes' | 'mortalities'
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [selectedDoc, setSelectedDoc] = useState(null)
    const inputRef = useRef(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
        }, 150)
        return () => clearTimeout(timer)
    }, [query])

    // Index notebook documents for search matching
    const indexedDocs = useMemo(() => {
        return docs.map(d => ({
            ...d,
            _searchIndex: [
                d.patientName,
                d.patientHosp,
                d.patientWard,
                d.patientDiagnosis,
                d.diagnosis,
                d.text
            ].filter(Boolean).join(' ').toLowerCase()
        }))
    }, [docs])

    // Compute matching results across all categories
    const searchResults = useMemo(() => {
        const q = debouncedQuery.trim().toLowerCase()
        if (!q) {
            return { my_team: [], on_call: [], notes: [], mortalities: [] }
        }

        const matchedPatients = patients
            .map(p => {
                let matchedField = null
                if ((p.name || '').toLowerCase().includes(q)) matchedField = 'name'
                else if ((p.hospitalNumber || '').toLowerCase().includes(q)) matchedField = 'hospitalNumber'
                else if ((p.ward || '').toLowerCase().includes(q)) matchedField = 'ward'
                else if ((p.bed || '').toLowerCase().includes(q)) matchedField = 'bed'
                else if ((p.diagnosis || '').toLowerCase().includes(q)) matchedField = 'diagnosis'
                else if ((p.note || '').toLowerCase().includes(q)) matchedField = 'note'
                return { ...p, matchedField, team: p.team || 'my_team' }
            })
            .filter(p => p.matchedField !== null)

        const matchedMortalities = mortalities
            .map(p => {
                let matchedField = null
                if ((p.name || '').toLowerCase().includes(q)) matchedField = 'name'
                else if ((p.hospitalNumber || '').toLowerCase().includes(q)) matchedField = 'hospitalNumber'
                else if ((p.ward || '').toLowerCase().includes(q)) matchedField = 'ward'
                else if ((p.bed || '').toLowerCase().includes(q)) matchedField = 'bed'
                else if ((p.diagnosis || '').toLowerCase().includes(q)) matchedField = 'diagnosis'
                else if ((p.note || '').toLowerCase().includes(q)) matchedField = 'note'
                return { ...p, matchedField, team: 'mortalities' }
            })
            .filter(p => p.matchedField !== null)

        const matchedNotes = indexedDocs.filter(d => d._searchIndex.includes(q))

        const myTeam = matchedPatients.filter(p => p.team === 'my_team')
        const onCall = matchedPatients.filter(p => p.team === 'other_team')

        return {
            my_team: myTeam,
            on_call: onCall,
            notes: matchedNotes,
            mortalities: matchedMortalities
        }
    }, [debouncedQuery, patients, mortalities, indexedDocs])

    const totalResults =
        searchResults.my_team.length +
        searchResults.on_call.length +
        searchResults.notes.length +
        searchResults.mortalities.length

    const handleClear = () => {
        setQuery('')
        setDebouncedQuery('')
        inputRef.current?.focus()
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 transition-colors">
            {/* Header & Sticky Search Bar */}
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0 cursor-pointer"
                        aria-label="Back"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="flex-1 relative flex items-center bg-gray-100 dark:bg-gray-700/60 rounded-2xl border border-gray-200 dark:border-gray-600/60 px-3.5 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                        <Search size={18} className="text-gray-400 dark:text-gray-400 shrink-0 mr-2.5" />
                        <input
                            ref={inputRef}
                            type="search"
                            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 outline-none"
                            placeholder="Search patients, wards, notes, mortalities..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoComplete="off"
                            spellCheck={false}
                        />
                        {query && (
                            <button
                                onClick={handleClear}
                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0 ml-1"
                                aria-label="Clear search"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Category Pills */}
                {debouncedQuery.trim() && (
                    <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-1.5 mt-2.5">
                        <button
                            onClick={() => setFilterCategory('all')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                                filterCategory === 'all'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            All ({totalResults})
                        </button>
                        <button
                            onClick={() => setFilterCategory('my_team')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                                filterCategory === 'my_team'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            My Team ({searchResults.my_team.length})
                        </button>
                        <button
                            onClick={() => setFilterCategory('other_team')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                                filterCategory === 'other_team'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            On Call ({searchResults.on_call.length})
                        </button>
                        <button
                            onClick={() => setFilterCategory('notes')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                                filterCategory === 'notes'
                                    ? 'bg-teal-600 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            Notes ({searchResults.notes.length})
                        </button>
                        <button
                            onClick={() => setFilterCategory('mortalities')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                                filterCategory === 'mortalities'
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            Mortalities ({searchResults.mortalities.length})
                        </button>
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="max-w-3xl mx-auto px-4 pt-4">
                {!debouncedQuery.trim() ? (
                    <div className="py-16 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-800/40">
                            <Sparkles size={28} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Search Clinical Records</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                            Search across active team patients, on-call patients, notebook entries, and mortality records.
                        </p>
                    </div>
                ) : totalResults === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto mb-3">
                            <Frown size={24} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">No results found</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            No matches found for <span className="font-semibold text-gray-700 dark:text-gray-300">"{debouncedQuery}"</span>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* My Team Results */}
                        {(filterCategory === 'all' || filterCategory === 'my_team') && searchResults.my_team.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <User size={15} className="text-blue-500" />
                                    <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        My Team Patients ({searchResults.my_team.length})
                                    </h2>
                                </div>
                                <div className="space-y-3">
                                    {searchResults.my_team.map(patient => (
                                        <PatientCard
                                            key={patient.id}
                                            patient={patient}
                                            onEdit={onEditPatient}
                                            onDelete={onDeletePatient}
                                            onReview={onReviewPatient}
                                            onDocument={onDocumentPatient}
                                            getDocCount={getDocCount}
                                            highlightField={patient.matchedField}
                                            highlightQuery={debouncedQuery}
                                            onOpenDetail={(p) => setSelectedPatient(p)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* On Call Results */}
                        {(filterCategory === 'all' || filterCategory === 'other_team') && searchResults.on_call.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <Users size={15} className="text-purple-500" />
                                    <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        On Call Patients ({searchResults.on_call.length})
                                    </h2>
                                </div>
                                <div className="space-y-3">
                                    {searchResults.on_call.map(patient => (
                                        <PatientCard
                                            key={patient.id}
                                            patient={patient}
                                            onEdit={onEditPatient}
                                            onDelete={onDeletePatient}
                                            onReview={onReviewPatient}
                                            onDocument={onDocumentPatient}
                                            getDocCount={getDocCount}
                                            highlightField={patient.matchedField}
                                            highlightQuery={debouncedQuery}
                                            onOpenDetail={(p) => setSelectedPatient(p)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Notebook Notes Results */}
                        {(filterCategory === 'all' || filterCategory === 'notes') && searchResults.notes.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <BookOpen size={15} className="text-teal-500" />
                                    <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Notebook Notes ({searchResults.notes.length})
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {searchResults.notes.map(doc => (
                                        <NoteCardItem
                                            key={doc.id}
                                            doc={doc}
                                            searchHighlight={debouncedQuery}
                                            onSelect={() => setSelectedDoc(doc)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Mortalities Results */}
                        {(filterCategory === 'all' || filterCategory === 'mortalities') && searchResults.mortalities.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <Heart size={15} className="text-red-500" />
                                    <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Mortality Records ({searchResults.mortalities.length})
                                    </h2>
                                </div>
                                <div className="space-y-3">
                                    {searchResults.mortalities.map(patient => (
                                        <PatientCard
                                            key={patient.id}
                                            patient={patient}
                                            onEdit={onEditPatient}
                                            onDelete={onDeleteMortality}
                                            isMortality
                                            highlightField={patient.matchedField}
                                            highlightQuery={debouncedQuery}
                                            onOpenDetail={(p) => setSelectedPatient(p)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>

            {/* Patient Detail Modal (Opened directly on search page) */}
            {selectedPatient && (
                <PatientDetailModal
                    patient={selectedPatient}
                    onClose={() => setSelectedPatient(null)}
                    onEdit={onEditPatient}
                    onDocument={onDocumentPatient}
                    docCount={getDocCount ? getDocCount(selectedPatient.id) : 0}
                    isMortality={selectedPatient.team === 'mortalities'}
                    highlightQuery={debouncedQuery}
                />
            )}

            {/* Note Detail Modal (Opened directly on search page) */}
            {selectedDoc && (
                <NoteDetailModal
                    doc={selectedDoc}
                    onClose={() => setSelectedDoc(null)}
                    onEdit={() => {
                        onStartEditDoc?.(selectedDoc)
                        navigate('/notebook/edit')
                    }}
                    onDelete={() => {
                        onDeleteDoc?.(selectedDoc.id)
                        setSelectedDoc(null)
                    }}
                    highlightText={debouncedQuery}
                />
            )}
        </div>
    )
}
