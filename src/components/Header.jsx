import { useState, useEffect, useRef } from 'react'
import { CheckCircle, Moon, Sun, MessageCircle, Menu, Stethoscope, BookOpen } from 'lucide-react'

export default function Header({ saveFlash, patientCount, docCount = 0, darkMode, toggleDarkMode, onFeedback, activePage, onPageChange }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <header className="bg-blue-700 dark:bg-gray-900 text-white shadow-lg shadow-blue-900/30 dark:shadow-black/40 sticky top-0 z-30 transition-colors duration-300">
            <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
                {/* Logo/Menu + Title */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="bg-white/20 hover:bg-white/30 rounded-xl p-2 flex items-center justify-center transition-all active:scale-95 text-white"
                            aria-label="Toggle navigation menu"
                            aria-expanded={menuOpen}
                        >
                            <Menu size={20} />
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpen && (
                            <div className="absolute left-0 top-11 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 text-gray-800 dark:text-gray-100">
                                <button
                                    type="button"
                                    onClick={() => { onPageChange('patients'); setMenuOpen(false) }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors text-left ${
                                        activePage === 'patients'
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                                >
                                    <Stethoscope size={16} className={activePage === 'patients' ? 'text-blue-500' : 'text-gray-400'} />
                                    Patients Tracker
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => { onPageChange('notebook'); setMenuOpen(false) }}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors text-left ${
                                        activePage === 'notebook'
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <BookOpen size={16} className={activePage === 'notebook' ? 'text-blue-500' : 'text-gray-400'} />
                                        Clinical Notebook
                                    </div>
                                    {docCount > 0 && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                            {docCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-bold text-xl leading-tight tracking-tight">HOsNote</h1>
                        <p className="text-blue-200 dark:text-gray-400 text-xs font-medium leading-tight">
                            {patientCount === 0
                                ? 'No patients tracked'
                                : `${patientCount} patient${patientCount !== 1 ? 's' : ''}`}
                            {docCount > 0 && ` · ${docCount} note${docCount !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Saved badge */}
                    <div
                        className={`flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 rounded-full px-3 py-1.5 transition-opacity duration-500 pulse-badge ${saveFlash ? 'opacity-100' : 'opacity-60'}`}
                        title="Data saved to this device"
                    >
                        <CheckCircle size={13} className="text-green-300" />
                        <span className="text-green-200 text-xs font-semibold whitespace-nowrap">Saved</span>
                    </div>

                    {/* Feedback button */}
                    <button
                        onClick={onFeedback}
                        className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                        aria-label="Feedback & Contact"
                        title="Feedback & Contact"
                    >
                        <MessageCircle size={18} className="text-blue-200 dark:text-gray-400" />
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
        </header>
    )
}
