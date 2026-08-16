import { useState, useEffect, memo } from 'react'
import { QrCode, Share2, UserPlus, ChevronDown, ChevronUp } from 'lucide-react'

/**
 * Floating horizontal bottom action bar for the clinical tracker main view.
 * Displays 3 perfectly symmetrical action buttons (Receive, Handover, Add Patient)
 * with a floating collapse/expand button that stays anchored at the exact same screen position.
 */
const PatientActionBarInner = ({
    isMortality = false,
    onAdd,
    onImport,
    onHandover,
    handoverBadge = null,
    handoverDisabled = false,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const hasSelection = handoverBadge !== null && handoverBadge > 0

    // Auto-expand if user selects patients while collapsed
    useEffect(() => {
        if (hasSelection) {
            setIsCollapsed(false)
        }
    }, [hasSelection])

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl h-[54px] pointer-events-none mb-[env(safe-area-inset-bottom,0px)]">
            <div className="relative w-full h-full">
                {/* Micro-collapse / expand button — anchored at top-right of bar container (identical position expanded & collapsed) */}
                <button
                    id={isCollapsed ? "pat-action-expand" : "pat-action-collapse"}
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label={isCollapsed ? "Expand action bar" : "Collapse action bar"}
                    className="absolute -top-2.5 right-4 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 shadow-md text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-1 rounded-full transition-all active:scale-90 cursor-pointer z-20 pointer-events-auto flex items-center justify-center"
                    title={isCollapsed ? "Expand action bar" : "Collapse action bar"}
                >
                    {isCollapsed ? (
                        <ChevronUp size={18} strokeWidth={2.5} />
                    ) : (
                        <ChevronDown size={18} strokeWidth={2.5} />
                    )}
                    {isCollapsed && hasSelection && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-xs animate-pulse">
                            {handoverBadge}
                        </span>
                    )}
                </button>

                {/* 3-Button Action Bar (Hidden when collapsed) */}
                {!isCollapsed && (
                    <div className="w-full h-full p-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-xl shadow-gray-900/10 dark:shadow-black/40 flex items-center justify-between pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
                        {/* 1. Receive / Import Button */}
                        <button
                            id="pat-action-import"
                            type="button"
                            onClick={onImport}
                            aria-label="Receive or import patients"
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-all active:scale-95 cursor-pointer"
                        >
                            <QrCode size={19} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.2} />
                            <span>Receive</span>
                        </button>

                        {/* Divider */}
                        <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700/80 shrink-0" />

                        {/* 2. Handover / Export Button */}
                        <button
                            id="pat-action-handover"
                            type="button"
                            disabled={handoverDisabled}
                            onClick={onHandover}
                            aria-label={hasSelection ? `Handover ${handoverBadge} selected patients` : 'Handover patients'}
                            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                                handoverDisabled
                                    ? 'opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-500'
                                    : hasSelection
                                        ? 'bg-purple-600 dark:bg-purple-600 text-white shadow-xs shadow-purple-500/30 font-extrabold active:scale-95 cursor-pointer'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 active:scale-95 cursor-pointer'
                            }`}
                        >
                            <div className="relative flex items-center justify-center">
                                <Share2 size={19} className={hasSelection ? 'text-white' : 'text-purple-600 dark:text-purple-400'} strokeWidth={2.2} />
                                {hasSelection && (
                                    <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-[9px] font-black px-1 rounded-full min-w-[16px] h-[16px] flex items-center justify-center shadow-xs border border-white dark:border-gray-800">
                                        {handoverBadge}
                                    </span>
                                )}
                            </div>
                            <span>Handover</span>
                        </button>

                        {/* Divider */}
                        <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700/80 shrink-0" />

                        {/* 3. Add Patient / Record Button */}
                        <button
                            id="pat-action-add"
                            type="button"
                            onClick={onAdd}
                            aria-label={isMortality ? 'Add mortality record' : 'Add patient'}
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-all active:scale-95 cursor-pointer"
                        >
                            <UserPlus size={19} className={isMortality ? "text-red-500 dark:text-red-400" : "text-blue-600 dark:text-blue-400"} strokeWidth={2.2} />
                            <span>{isMortality ? 'Add Record' : 'Add Patient'}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default memo(PatientActionBarInner)
