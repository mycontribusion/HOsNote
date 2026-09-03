import { useState, useEffect, memo } from 'react'
import { QrCode, Share2, UserPlus, ChevronDown, ChevronUp } from 'lucide-react'

/**
 * Floating horizontal bottom action bar for the clinical tracker main view.
 * Displays 3 perfectly symmetrical action buttons (Receive, Handover, Add Patient)
 * styled to match the header gradient background and crisp white text.
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

    // Match exact Header gradient styling
    const headerBg = isMortality
        ? 'bg-gradient-to-r from-red-700 via-red-800 to-red-900 dark:from-red-950 dark:via-gray-900 dark:to-gray-900 shadow-red-900/40 border-red-500/40'
        : 'bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 shadow-blue-900/40 border-blue-500/40'

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl h-[56px] pointer-events-none mb-[env(safe-area-inset-bottom,0px)]">
            <div className="relative w-full h-full">
                {/* Micro-collapse / expand button — Matching Header Theme Glass Floating Pill */}
                <button
                    id="tour-action-collapse"
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label={isCollapsed ? "Expand action bar" : "Collapse action bar"}
                    className={`absolute -top-3.5 right-0 z-30 pointer-events-auto ${headerBg} text-white border-2 border-white/40 dark:border-gray-700 shadow-lg p-1.5 rounded-full transition-all duration-200 active:scale-90 cursor-pointer flex items-center justify-center ring-2 ring-white/20`}
                    title={isCollapsed ? "Expand action bar" : "Collapse action bar"}
                >
                    {isCollapsed ? (
                        <ChevronUp size={18} strokeWidth={3} />
                    ) : (
                        <ChevronDown size={18} strokeWidth={3} />
                    )}
                    {isCollapsed && hasSelection && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-xs animate-pulse">
                            {handoverBadge}
                        </span>
                    )}
                </button>

                {/* 3-Button Action Bar (Hidden when collapsed) */}
                {!isCollapsed && (
                    <div className={`w-full h-full p-1.5 ${headerBg} text-white backdrop-blur-xl border-2 border-white/25 dark:border-gray-700/80 rounded-2xl shadow-2xl flex items-center justify-between pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200 ring-1 ring-white/20`}>
                        {/* 1. Receive / Import Button */}
                        <button
                            id="pat-action-import"
                            type="button"
                            onClick={onImport}
                            aria-label="Receive or import patients"
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-extrabold text-white hover:bg-white/15 active:bg-white/25 transition-all active:scale-95 cursor-pointer group"
                        >
                            <QrCode size={19} className="text-emerald-300 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                            <span className="tracking-wide">Receive</span>
                        </button>

                        {/* Divider */}
                        <div className="w-[1px] h-6 bg-white/25 dark:bg-gray-700 shrink-0" />

                        {/* 2. Handover / Export Button */}
                        <button
                            id="pat-action-handover"
                            type="button"
                            disabled={handoverDisabled}
                            onClick={onHandover}
                            aria-label={hasSelection ? `Handover ${handoverBadge} selected patients` : 'Handover patients'}
                            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-extrabold transition-all ${
                                handoverDisabled
                                    ? 'opacity-40 cursor-not-allowed text-white/50'
                                    : hasSelection
                                        ? 'bg-white text-purple-900 shadow-md font-black active:scale-95 cursor-pointer'
                                        : 'text-white hover:bg-white/15 active:bg-white/25 active:scale-95 cursor-pointer group'
                            }`}
                        >
                            <div className="relative flex items-center justify-center">
                                <Share2 size={19} className={hasSelection ? 'text-purple-900' : 'text-purple-300 group-hover:scale-110 transition-transform'} strokeWidth={2.5} />
                                {hasSelection && (
                                    <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-[9px] font-black px-1 rounded-full min-w-[16px] h-[16px] flex items-center justify-center shadow-xs border border-white dark:border-gray-800">
                                        {handoverBadge}
                                    </span>
                                )}
                            </div>
                            <span className="tracking-wide">Handover</span>
                        </button>

                        {/* Divider */}
                        <div className="w-[1px] h-6 bg-white/25 dark:bg-gray-700 shrink-0" />

                        {/* 3. Add Patient / Record Button */}
                        <button
                            id="pat-action-add"
                            type="button"
                            onClick={onAdd}
                            aria-label={isMortality ? 'Add mortality record' : 'Add patient'}
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-extrabold text-white hover:bg-white/15 active:bg-white/25 transition-all active:scale-95 cursor-pointer group"
                        >
                            <UserPlus size={19} className={`${isMortality ? "text-red-300" : "text-blue-200"} group-hover:scale-110 transition-transform`} strokeWidth={2.5} />
                            <span className="tracking-wide">{isMortality ? 'Add Record' : 'Add Patient'}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default memo(PatientActionBarInner)
