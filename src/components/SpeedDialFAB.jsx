import { useState, useEffect, useRef } from 'react'
import { Plus, X } from 'lucide-react'

export default function SpeedDialFAB({ actions = [], onClick, mainTheme = 'blue', ariaLabel = 'Actions menu' }) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef(null)

    const isSingleAction = Boolean(onClick || actions.length === 1)

    const handleMainClick = () => {
        if (onClick) {
            onClick()
        } else if (actions.length === 1) {
            actions[0].onClick()
        } else {
            setIsOpen(!isOpen)
        }
    }

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            document.addEventListener('touchstart', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
        }
    }, [isOpen])

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false)
        }
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen])

    const themeClasses = mainTheme === 'teal'
        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-500/30'
        : mainTheme === 'red'
        ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/30'
        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/30'

    return (
        <div ref={containerRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Backdrop overlay when menu is open */}
            {isOpen && !isSingleAction && (
                <div
                    className="fixed inset-0 bg-gray-900/30 dark:bg-black/40 backdrop-blur-[2px] z-40 transition-opacity animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Action items menu */}
            {isOpen && !isSingleAction && (
                <div
                    role="menu"
                    className="relative z-50 flex flex-col items-end gap-3 mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200 ease-out"
                >
                    {actions.map((action, idx) => {
                        const iconBg = action.color === 'emerald'
                            ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                            : action.color === 'purple'
                            ? 'bg-purple-600 text-white dark:bg-purple-500'
                            : action.color === 'teal'
                            ? 'bg-teal-600 text-white dark:bg-teal-500'
                            : 'bg-blue-600 text-white dark:bg-blue-500'

                        return (
                            <button
                                key={action.id || idx}
                                role="menuitem"
                                disabled={action.disabled}
                                onClick={() => {
                                    setIsOpen(false)
                                    action.onClick()
                                }}
                                className={`flex items-center gap-3 group focus:outline-none transition-transform duration-150 ${
                                    action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'
                                }`}
                            >
                                {/* Label card */}
                                <span className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-1.5 whitespace-nowrap">
                                    {action.label}
                                    {action.badge !== undefined && action.badge !== null && (
                                        <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                                            {action.badge}
                                        </span>
                                    )}
                                </span>

                                {/* Circular Icon Button */}
                                <span className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-shadow group-hover:shadow-xl ${iconBg}`}>
                                    {action.icon}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Main FAB Button */}
            <button
                type="button"
                onClick={handleMainClick}
                aria-expanded={isSingleAction ? undefined : isOpen}
                aria-label={ariaLabel}
                className={`relative z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-90 focus:outline-none focus:ring-4 ${mainTheme === 'red' ? 'focus:ring-red-300 dark:focus:ring-red-800' : mainTheme === 'teal' ? 'focus:ring-teal-300 dark:focus:ring-teal-800' : 'focus:ring-blue-300 dark:focus:ring-blue-800'} ${themeClasses}`}
            >
                <div className={`transition-transform duration-300 ${isOpen && !isSingleAction ? 'rotate-135' : 'rotate-0'}`}>
                    <Plus size={28} strokeWidth={2.5} />
                </div>
            </button>
        </div>
    )
}
