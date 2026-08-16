import { Moon, Sun, Settings, Stethoscope, BookOpen, Search } from 'lucide-react'
import { memo } from 'react'

const HeaderInner = ({ patientCount, docCount = 0, darkMode, toggleDarkMode, onOpenSettings, activePage, onPageChange, onOpenSearch, onHome, theme = 'blue' }) => {
    const isRed = theme === 'red'

    const headerBg = isRed
        ? 'bg-gradient-to-r from-red-700 to-red-800 dark:from-red-900 dark:to-gray-900'
        : 'bg-gradient-to-r from-blue-700 to-blue-800 dark:from-gray-900 dark:to-gray-900'

    const shadowColor = isRed ? 'shadow-red-900/40' : 'shadow-blue-900/40'
    const iconColor   = isRed ? 'text-red-200'   : 'text-blue-200'
    const pillActive  = isRed ? 'bg-red-600/70 border-red-500/50' : 'bg-blue-600/60 border-blue-500/40'
    const pillHover   = isRed ? 'hover:bg-red-700/40' : 'hover:bg-blue-600/40'

    return (
        <header className={`${headerBg} text-white shadow-lg ${shadowColor} dark:shadow-black/50 sticky top-0 z-30 transition-colors duration-300`}>
            <div className="max-w-2xl mx-auto px-4">
                {/* Top row: Title + Controls */}
                <div className="flex items-center justify-between gap-3 py-2.5">
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
                            onClick={onOpenSearch}
                            className="w-9 h-9 rounded-xl hover:bg-white/15 active:bg-white/25 transition-colors flex items-center justify-center"
                            aria-label="Search"
                            title="Search"
                        >
                            <Search size={17} className={`${iconColor} dark:text-gray-400`} />
                        </button>

                        {/* Settings button */}
                        <button
                            onClick={onOpenSettings}
                            className="w-9 h-9 rounded-xl hover:bg-white/15 active:bg-white/25 transition-colors flex items-center justify-center"
                            aria-label="Settings"
                            title="Settings"
                        >
                            <Settings size={17} className={`${iconColor} dark:text-gray-400`} />
                        </button>

                        {/* Dark mode toggle */}
                        <button
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
                </div>
            </div>
        </header>
    )
}

export default memo(HeaderInner)
