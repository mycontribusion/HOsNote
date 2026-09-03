import { Moon, Sun, Settings, Stethoscope, BookOpen, Search, ArrowLeft, X } from 'lucide-react'
import { memo, useRef, useEffect, useState, useCallback } from 'react'
import { useSearch } from '../context/SearchContext'

const HeaderInner = ({ patientCount, docCount = 0, darkMode, toggleDarkMode, onOpenSettings, activePage, onPageChange, onOpenSearch, onHome, onBackFromSearch, theme = 'blue' }) => {
    const isRed = theme === 'red'
    const { query, setQuery } = useSearch()
    const [localQuery, setLocalQuery] = useState(query)
    const searchInputRef = useRef(null)
    const debounceTimerRef = useRef(null)

    // Sync localQuery when global query changes externally (e.g. clear)
    useEffect(() => {
        setLocalQuery(query)
    }, [query])

    const handleInputChange = (e) => {
        const val = e.target.value
        setLocalQuery(val)
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(() => {
            setQuery(val)
        }, 250)
    }

    const handleClearQuery = useCallback(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        setLocalQuery('')
        setQuery('')
        searchInputRef.current?.focus()
    }, [setQuery])

    // Auto-focus input when search page opens
    useEffect(() => {
        if (activePage === 'search' && searchInputRef.current) {
            const timer = setTimeout(() => {
                searchInputRef.current?.focus()
            }, 60)
            return () => clearTimeout(timer)
        }
    }, [activePage])

    // Keyboard navigation: Escape key clears query or exits search
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            if (localQuery) {
                handleClearQuery()
            } else {
                if (onBackFromSearch) onBackFromSearch()
                else if (onHome) onHome()
            }
        }
    }

    const headerBg = isRed
        ? 'bg-gradient-to-r from-red-700 via-red-800 to-red-900 dark:from-red-950 dark:via-gray-900 dark:to-gray-900'
        : 'bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950'

    const shadowColor = isRed ? 'shadow-red-900/30' : 'shadow-blue-900/30'
    const iconColor   = isRed ? 'text-red-200'   : 'text-blue-200'
    const pillActive  = isRed ? 'bg-red-600/70 border-red-500/50' : 'bg-blue-600/60 border-blue-500/40'
    const pillHover   = isRed ? 'hover:bg-red-700/40' : 'hover:bg-blue-600/40'

    return (
        <header className={`${headerBg} text-white shadow-lg ${shadowColor} dark:shadow-black/50 sticky top-0 z-30 transition-colors duration-300 border-b border-white/10 dark:border-gray-800`}>
            <div className="max-w-2xl mx-auto px-3.5 sm:px-4">
                {/* Top row: Title + Controls */}
                <div className="flex items-center justify-between gap-2.5 py-2.5">
                    {activePage === 'search' ? (
                        <div className="w-full flex items-center">
                            {/* Modern Unified Search Bar with Embedded Exit Button */}
                            <div className="w-full relative flex items-center bg-white/20 dark:bg-gray-800 rounded-2xl border border-white/30 dark:border-gray-700 p-1 pl-1.5 pr-3 focus-within:ring-2 focus-within:ring-white/50 focus-within:bg-white/25 dark:focus-within:bg-gray-800 shadow-inner group">
                                {/* Embedded Exit Arrow Button */}
                                <button
                                    type="button"
                                    onClick={onBackFromSearch || onHome}
                                    className="group/btn h-8 px-2 rounded-xl flex items-center gap-1 bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all shrink-0 cursor-pointer border border-white/20 shadow-xs focus:outline-none focus:ring-1 focus:ring-white/40"
                                    aria-label="Exit Search"
                                    title="Exit Search (Esc)"
                                >
                                    <ArrowLeft size={15} className="text-white group-hover/btn:-translate-x-0.5 transition-transform duration-200" />
                                    <span className="text-xs font-semibold tracking-wide hidden xs:inline-block pr-0.5">Back</span>
                                </button>

                                {/* Subtle vertical divider inside bar */}
                                <div className="h-4 w-px bg-white/25 dark:bg-gray-700 mx-2 shrink-0" />

                                {/* Input Field */}
                                <input
                                    ref={searchInputRef}
                                    type="search"
                                    className="w-full bg-transparent text-sm font-medium text-white placeholder-white/60 dark:placeholder-gray-400 outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                                    placeholder="Search patients, wards, notes..."
                                    value={localQuery}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    autoComplete="off"
                                    spellCheck={false}
                                />

                                {/* Clear Button inside bar */}
                                {localQuery && (
                                    <button
                                        type="button"
                                        onClick={handleClearQuery}
                                        className="p-1 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white/80 hover:text-white transition-all ml-1 shrink-0 cursor-pointer"
                                        aria-label="Clear search"
                                        title="Clear search"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Logo + Title */}
                            <button
                                type="button"
                                onClick={onHome}
                                className="min-w-0 text-left hover:opacity-80 active:opacity-60 transition-opacity"
                                aria-label="Go to main page"
                                title="Main Page"
                            >
                                <h1 className="font-extrabold text-xl leading-tight tracking-tight">HOsNote</h1>
                            </button>

                            {/* Right side controls */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {/* Page switch pill */}
                                <button
                                    id="tour-page-switch"
                                    type="button"
                                    onClick={() => onPageChange(activePage === 'patients' ? 'notebook' : 'patients')}
                                    className={`flex items-center gap-1.5 ${pillActive} border backdrop-blur-sm rounded-full px-3 py-1.5 transition-all active:scale-95 text-white ${pillHover}`}
                                    aria-label={activePage === 'patients' ? 'Switch to Clinical Notebook' : 'Switch to Patients Tracker'}
                                    title={activePage === 'patients' ? 'Switch to Clinical Notebook' : 'Switch to Patients Tracker'}
                                >
                                    {activePage === 'patients'
                                        ? <BookOpen size={12} className={iconColor} />
                                        : <Stethoscope size={12} className={iconColor} />
                                    }
                                    <span className="text-[11px] font-bold whitespace-nowrap leading-none">
                                        {activePage === 'patients' ? `${docCount} notes` : `${patientCount} patients`}
                                    </span>
                                </button>

                                {/* Search button */}
                                <button
                                    id="tour-search-btn"
                                    onClick={onOpenSearch}
                                    className="w-9 h-9 rounded-xl hover:bg-white/15 active:bg-white/25 transition-colors flex items-center justify-center"
                                    aria-label="Search"
                                    title="Search"
                                >
                                    <Search size={17} className={`${iconColor} dark:text-gray-400`} />
                                </button>

                                {/* Settings button */}
                                <button
                                    id="tour-settings-btn"
                                    onClick={onOpenSettings}
                                    className="w-9 h-9 rounded-xl hover:bg-white/15 active:bg-white/25 transition-colors flex items-center justify-center"
                                    aria-label="Settings"
                                    title="Settings"
                                >
                                    <Settings size={17} className={`${iconColor} dark:text-gray-400`} />
                                </button>

                                {/* Dark mode toggle */}
                                <button
                                    id="tour-dark-mode-btn"
                                    onClick={toggleDarkMode}
                                    className="w-9 h-9 rounded-xl hover:bg-white/15 active:bg-white/25 transition-colors flex items-center justify-center"
                                    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                                    title={darkMode ? 'Light mode' : 'Dark mode'}
                                >
                                    {darkMode
                                        ? <Sun size={17} className="text-yellow-300" />
                                        : <Moon size={17} className={iconColor} />
                                    }
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}

export default memo(HeaderInner)

