import { useState, useEffect, useRef } from 'react'
import { UserPlus, QrCode, Share2, MoreHorizontal, X } from 'lucide-react'

/**
 * Two stacked rounded-square buttons in the bottom-right corner.
 *
 * DEFAULT (nothing selected):
 * ┌──────────┐   ← More (•••) — expands Import & Handover above
 * └──────────┘
 * ┌──────────┐   ← Add Patient (direct)
 * └──────────┘
 *
 * SELECTION ACTIVE (patients checked):
 * ┌──────────┐   ← Import (replaces More button, always visible)
 * └──────────┘
 * ┌──────────┐   ← Handover w/ badge (replaces Add button slot... no, stacked)
 * └──────────┘
 * ┌──────────┐   ← Add Patient (still always there below)
 * └──────────┘
 *
 * Actually per user request: when selection is active, the top slot becomes
 * TWO buttons (Import on top, Handover below) replacing the single More button,
 * and the Add Patient remains at the bottom.
 *
 * ┌──────────┐   ← Import
 * └──────────┘
 * ┌──────────┐   ← Handover (with badge)
 * └──────────┘
 * ┌──────────┐   ← Add Patient
 * └──────────┘
 */
export default function PatientActionBar({
    isMortality = false,
    onAdd,
    onImport,
    onHandover,
    handoverBadge = null,
    handoverDisabled = false,
}) {
    const [moreOpen, setMoreOpen] = useState(false)
    const containerRef = useRef(null)

    // When selection activates, close the More menu
    const hasSelection = handoverBadge !== null && handoverBadge > 0
    useEffect(() => {
        if (hasSelection) setMoreOpen(false)
    }, [hasSelection])

    // Close on outside tap (only when More is open)
    useEffect(() => {
        if (!moreOpen) return
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setMoreOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        document.addEventListener('touchstart', handler)
        return () => {
            document.removeEventListener('mousedown', handler)
            document.removeEventListener('touchstart', handler)
        }
    }, [moreOpen])

    // Close on Escape
    useEffect(() => {
        if (!moreOpen) return
        const handler = (e) => { if (e.key === 'Escape') setMoreOpen(false) }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [moreOpen])

    const addColor = isMortality
        ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-400/40'
        : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-400/40'

    const addRing = isMortality
        ? 'focus:ring-red-300 dark:focus:ring-red-700'
        : 'focus:ring-blue-300 dark:focus:ring-blue-700'

    return (
        <>
            {/* Backdrop — only when More menu is open */}
            {moreOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
                    onClick={() => setMoreOpen(false)}
                    aria-hidden="true"
                />
            )}

            <div
                ref={containerRef}
                className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2.5"
            >
                {/* ══════════════════════════════════════════════
                    SELECTION MODE: Import + Handover visible as
                    two inline square buttons (replace More slot)
                    ══════════════════════════════════════════════ */}
                {hasSelection ? (
                    <div className="flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {/* Receive */}
                        <SquareButton
                            id="pat-action-import-sel"
                            icon={<QrCode size={20} strokeWidth={2} />}
                            colorClass="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-400/40 text-white"
                            ringClass="focus:ring-emerald-300 dark:focus:ring-emerald-700"
                            ariaLabel="Receive patients"
                            onClick={onImport}
                        />

                        {/* Handover */}
                        <SquareButton
                            id="pat-action-handover-sel"
                            icon={<Share2 size={20} strokeWidth={2} />}
                            badge={handoverBadge}
                            colorClass="bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-400/40 text-white"
                            ringClass="focus:ring-purple-300 dark:focus:ring-purple-700"
                            ariaLabel="Handover selected patients"
                            disabled={handoverDisabled}
                            onClick={onHandover}
                        />
                    </div>
                ) : (
                    /* ══════════════════════════════════════════
                       DEFAULT MODE: single More (•••) button
                       ══════════════════════════════════════════ */
                    <>
                        {/* Expanded menu items — float above the More button */}
                        {moreOpen && (
                            <div className="flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200 ease-out">
                                {/* Handover */}
                                <ExpandedAction
                                    icon={<Share2 size={18} strokeWidth={2} />}
                                    label="Handover"
                                    badge={handoverBadge}
                                    disabled={handoverDisabled}
                                    colorClass="bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-400/40"
                                    onClick={() => {
                                        if (!handoverDisabled) {
                                            setMoreOpen(false)
                                            onHandover()
                                        }
                                    }}
                                />
                                {/* Receive */}
                                <ExpandedAction
                                    icon={<QrCode size={18} strokeWidth={2} />}
                                    label="Receive"
                                    colorClass="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-400/40"
                                    onClick={() => {
                                        setMoreOpen(false)
                                        onImport()
                                    }}
                                />
                            </div>
                        )}

                        {/* More / Cancel button */}
                        <div className="flex items-center gap-2.5">
                            {moreOpen && (
                                <span className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 whitespace-nowrap">
                                    Cancel
                                </span>
                            )}
                            <button
                                id="pat-action-more"
                                type="button"
                                onClick={() => setMoreOpen(prev => !prev)}
                                aria-label={moreOpen ? 'Cancel' : 'More actions'}
                                aria-expanded={moreOpen}
                                className={`
                                    w-12 h-12 rounded-2xl
                                    flex items-center justify-center
                                    shadow-lg
                                    transition-all duration-200
                                    focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600
                                    active:scale-90 cursor-pointer
                                    ${moreOpen
                                        ? 'bg-gray-700 dark:bg-gray-600 text-white shadow-gray-700/40'
                                        : 'bg-white/90 dark:bg-gray-800/95 text-gray-600 dark:text-gray-300 border border-gray-200/70 dark:border-gray-700/60 backdrop-blur-sm shadow-gray-200/60 dark:shadow-black/40'
                                    }
                                `}
                            >
                                <div className={`transition-transform duration-300 ${moreOpen ? 'rotate-90' : 'rotate-0'}`}>
                                    {moreOpen
                                        ? <X size={20} strokeWidth={2.5} />
                                        : <MoreHorizontal size={20} strokeWidth={2.5} />
                                    }
                                </div>
                            </button>
                        </div>
                    </>
                )}

                {/* ─── BOTTOM: Add Patient — always visible ─── */}
                <div className="flex items-center gap-2.5">
                    {moreOpen && (
                        <span className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 whitespace-nowrap">
                            Add patient
                        </span>
                    )}
                    <SquareButton
                        id="pat-action-add"
                        icon={<UserPlus size={20} strokeWidth={2} />}
                        colorClass={`${addColor} text-white`}
                        ringClass={addRing}
                        ariaLabel={isMortality ? 'Add mortality record' : 'Add patient'}
                        onClick={onAdd}
                    />
                </div>
            </div>
        </>
    )
}

/* ─── Reusable rounded-square button ─── */
function SquareButton({ id, icon, badge = null, disabled = false, colorClass, ringClass, ariaLabel, onClick }) {
    return (
        <button
            id={id}
            type="button"
            disabled={disabled}
            onClick={onClick}
            aria-label={ariaLabel}
            className={`
                relative w-12 h-12 rounded-2xl
                flex items-center justify-center
                shadow-lg
                transition-all duration-200
                focus:outline-none focus:ring-2 ${ringClass}
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-90 cursor-pointer'}
                ${colorClass}
            `}
        >
            {icon}
            {badge !== null && badge !== undefined && (
                <span className="
                    absolute -top-1.5 -right-1.5
                    bg-red-500 text-white
                    text-[10px] font-black
                    min-w-[18px] h-[18px] px-1
                    rounded-full
                    flex items-center justify-center
                    border-2 border-white dark:border-gray-900
                    shadow-sm animate-in zoom-in-50 duration-200
                ">
                    {badge}
                </span>
            )}
        </button>
    )
}

/* ─── Expanded action item (label + square icon) ─── */
function ExpandedAction({ icon, label, badge = null, disabled = false, colorClass, onClick }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`
                flex items-center gap-2.5
                group focus:outline-none
                transition-transform duration-150
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}
            `}
        >
            {/* Label pill */}
            <span className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 whitespace-nowrap flex items-center gap-1.5">
                {label}
                {badge !== null && badge !== undefined && (
                    <span className="bg-red-500 text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                        {badge}
                    </span>
                )}
            </span>

            {/* Icon rounded-square */}
            <span className={`
                w-12 h-12 rounded-2xl
                flex items-center justify-center
                text-white shadow-lg
                transition-shadow group-hover:shadow-xl
                ${colorClass}
            `}>
                {icon}
            </span>
        </button>
    )
}
