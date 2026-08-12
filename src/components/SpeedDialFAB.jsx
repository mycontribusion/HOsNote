import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'

export default function SpeedDialFAB({
    actions = [],
    onClick,
    mainTheme = 'blue',
    mainIcon,
    sizeClass = 'w-11 h-11',
    positionClass = 'bottom-5 right-5',
    badge,
    disabled = false,
    ariaLabel = 'Actions menu',
    shape = 'circle',
}) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef(null)

    const isSingleAction = Boolean(onClick || actions.length === 1)

    const handleMainClick = () => {
        if (disabled) return
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
        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-500/25'
        : mainTheme === 'red'
        ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/25'
        : mainTheme === 'purple'
        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25'
        : mainTheme === 'emerald'
        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25'
        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25'

    return (
        <div ref={containerRef} className={`fixed ${positionClass} z-50 flex flex-col items-end`}>
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
                    className="relative z-50 flex flex-col items-end gap-2.5 mb-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200 ease-out"
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
                                className={`flex items-center gap-2.5 group focus:outline-none transition-transform duration-150 ${
                                    action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'
                                }`}
                            >
                                {/* Label card */}
                                <span className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 flex items-center gap-1.5 whitespace-nowrap">
                                    {action.label}
                                    {action.badge !== undefined && action.badge !== null && (
                                        <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                                            {action.badge}
                                        </span>
                                    )}
                                </span>

                                {/* Circular Icon Button */}
                                <span className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-shadow group-hover:shadow-lg ${iconBg}`}>
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
                disabled={disabled}
                onClick={handleMainClick}
                aria-expanded={isSingleAction ? undefined : isOpen}
                aria-label={ariaLabel}
                className={`relative z-50 ${shape === 'square' ? 'w-12 h-12 rounded-2xl' : `${sizeClass} rounded-full`} flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-90 cursor-pointer'} focus:outline-none focus:ring-4 ${
                    mainTheme === 'red' ? 'focus:ring-red-300 dark:focus:ring-red-800' :
                    mainTheme === 'purple' ? 'focus:ring-purple-300 dark:focus:ring-purple-800' :
                    mainTheme === 'teal' ? 'focus:ring-teal-300 dark:focus:ring-teal-800' :
                    'focus:ring-blue-300 dark:focus:ring-blue-800'
                } ${themeClasses}`}
            >
                <div className={`transition-transform duration-300 ${isOpen && !isSingleAction ? 'rotate-135' : 'rotate-0'}`}>
                    {mainIcon || <Plus size={20} strokeWidth={2.5} />}
                </div>

                {/* Optional Badge Indicator on Main FAB */}
                {badge !== undefined && badge !== null && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm animate-in zoom-in-50 duration-200">
                        {badge}
                    </span>
                )}
            </button>
        </div>
    )
}
