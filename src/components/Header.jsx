import { Moon, Sun, Settings, Stethoscope, BookOpen } from 'lucide-react'

export default function Header({ patientCount, docCount = 0, darkMode, toggleDarkMode, onOpenSettings, activePage, onPageChange }) {
    return (
        <header className="bg-blue-700 dark:bg-gray-900 text-white shadow-lg shadow-blue-900/30 dark:shadow-black/40 sticky top-0 z-30 transition-colors duration-300">
            <div className="max-w-2xl mx-auto px-4">
                {/* Top row: Title + Controls */}
                <div className="flex items-center justify-between gap-3 py-2">
                    {/* Logo + Title */}
                    <div className="min-w-0">
                        <h1 className="font-bold text-xl leading-tight tracking-tight">HOsNote</h1>
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Page switch toggle */}
                        <button
                            type="button"
                            onClick={() => onPageChange(activePage === 'patients' ? 'notebook' : 'patients')}
                            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-full px-3 py-1.5 transition-all active:scale-95 text-white"
                            aria-label={activePage === 'patients' ? 'Switch to Clinical Notebook' : 'Switch to Patients Tracker'}
                            title={activePage === 'patients' ? 'Switch to Clinical Notebook' : 'Switch to Patients Tracker'}
                        >
                            {activePage === 'patients'
                                ? <BookOpen size={13} className="text-blue-200" />
                                : <Stethoscope size={13} className="text-blue-200" />
                            }
                            <span className="text-xs font-semibold whitespace-nowrap leading-none">
                                {activePage === 'patients' ? `${docCount} notes` : `${patientCount} patients`}
                            </span>
                        </button>

                        {/* Settings button */}
                        <button
                            onClick={onOpenSettings}
                            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                            aria-label="Settings"
                            title="Settings"
                        >
                            <Settings size={18} className="text-blue-200 dark:text-gray-400" />
                        </button>

                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={darkMode ? 'Light mode' : 'Dark mode'}
                        >
                            {darkMode
                                ? <Sun size={18} className="text-yellow-300" />
                                : <Moon size={18} className="text-blue-200" />
                            }
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}
