import { UserPlus, QrCode, Share2 } from 'lucide-react'

/**
 * Fixed bottom action bar for the patient tracker page.
 * Shows Add, Import, and Handover as always-visible labeled buttons.
 */
export default function PatientActionBar({
    isMortality = false,
    onAdd,
    onImport,
    onHandover,
    handoverBadge = null,
    handoverDisabled = false,
}) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
            <div
                className="pointer-events-auto w-full max-w-2xl mx-auto px-4 pb-safe"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
            >
                {/* Bar container */}
                <div className="
                    flex items-stretch
                    bg-white/85 dark:bg-gray-900/90
                    backdrop-blur-xl
                    border border-gray-200/60 dark:border-gray-700/60
                    rounded-2xl
                    shadow-[0_-4px_32px_rgba(0,0,0,0.10)] dark:shadow-[0_-4px_32px_rgba(0,0,0,0.40)]
                    overflow-hidden
                    mb-2
                ">
                    {/* ADD PATIENT */}
                    <ActionButton
                        id="pat-action-add"
                        icon={<UserPlus size={20} strokeWidth={2} />}
                        label={isMortality ? 'Add Record' : 'Add Patient'}
                        onClick={onAdd}
                        colorClass={
                            isMortality
                                ? 'text-red-600 dark:text-red-400 active:bg-red-50 dark:active:bg-red-900/30'
                                : 'text-blue-600 dark:text-blue-400 active:bg-blue-50 dark:active:bg-blue-900/30'
                        }
                        dotClass={isMortality ? 'bg-red-500' : 'bg-blue-500'}
                    />

                    <Divider />

                    {/* RECEIVE */}
                    <ActionButton
                        id="pat-action-receive"
                        icon={<QrCode size={20} strokeWidth={2} />}
                        label="Receive"
                        onClick={onImport}
                        colorClass="text-emerald-600 dark:text-emerald-400 active:bg-emerald-50 dark:active:bg-emerald-900/30"
                        dotClass="bg-emerald-500"
                    />

                    <Divider />

                    {/* HANDOVER */}
                    <ActionButton
                        id="pat-action-handover"
                        icon={<Share2 size={20} strokeWidth={2} />}
                        label="Handover"
                        onClick={handoverDisabled ? null : onHandover}
                        badge={handoverBadge}
                        disabled={handoverDisabled}
                        colorClass="text-purple-600 dark:text-purple-400 active:bg-purple-50 dark:active:bg-purple-900/30"
                        dotClass="bg-purple-500"
                    />
                </div>
            </div>
        </div>
    )
}

function Divider() {
    return (
        <div className="w-px self-stretch bg-gray-200/70 dark:bg-gray-700/60 my-2 flex-shrink-0" />
    )
}

function ActionButton({ id, icon, label, onClick, badge = null, disabled = false, colorClass, dotClass }) {
    return (
        <button
            id={id}
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`
                relative flex-1 flex flex-col items-center justify-center gap-1
                py-3 px-2
                transition-all duration-150
                focus:outline-none
                select-none
                ${disabled
                    ? 'opacity-35 cursor-not-allowed'
                    : `cursor-pointer active:scale-95 ${colorClass}`
                }
            `}
        >
            {/* Icon */}
            <span className="relative">
                {icon}

                {/* Badge */}
                {badge !== null && badge !== undefined && (
                    <span className="
                        absolute -top-2 -right-2.5
                        bg-red-500 text-white
                        text-[10px] font-black
                        min-w-[16px] h-4 px-1
                        rounded-full
                        flex items-center justify-center
                        border-2 border-white dark:border-gray-900
                        shadow-sm
                        animate-in zoom-in-50 duration-200
                    ">
                        {badge}
                    </span>
                )}
            </span>

            {/* Label */}
            <span className={`text-[10px] font-bold tracking-wide leading-none ${disabled ? 'text-gray-400 dark:text-gray-600' : ''}`}>
                {label}
            </span>
        </button>
    )
}
