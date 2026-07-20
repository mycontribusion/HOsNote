import { X, MessageCircle, Type, Trash2, AlertTriangle } from 'lucide-react'

export default function SettingsModal({
    onClose,
    onOpenFeedback,
    textSize,
    onDecreaseText,
    onIncreaseText,
    onClearRequest,
}) {
    const clearOptions = [
        { label: 'My Team', action: 'my_team', color: 'blue' },
        { label: 'On Call', action: 'on_call', color: 'purple' },
        { label: 'Mortalities', action: 'mortalities', color: 'red' },
        { label: 'Notebook', action: 'notebook', color: 'gray' },
    ]

    const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50',
        purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/50',
        red: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50',
        gray: 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600',
    }

    return (
        <div
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal-box dark:bg-gray-800 max-w-sm" role="dialog" aria-modal="true" aria-labelledby="settings-title">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 id="settings-title" className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    {/* Feedback */}
                    <button
                        onClick={() => { onOpenFeedback(); onClose(); }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <MessageCircle size={20} className="text-white" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">Feedback & Contact</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">We'd love to hear from you</div>
                        </div>
                    </button>

                    {/* Text Resizing */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                            <Type size={20} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">Text Size</div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onDecreaseText}
                                    disabled={textSize <= 80}
                                    className="w-8 h-8 rounded-lg bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Decrease text size"
                                >
                                    A-
                                </button>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[3rem] text-center">
                                    {textSize}%
                                </span>
                                <button
                                    onClick={onIncreaseText}
                                    disabled={textSize >= 130}
                                    className="w-8 h-8 rounded-lg bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Increase text size"
                                >
                                    A+
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Clear All */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
                                <Trash2 size={20} className="text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">Clear All</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Remove data permanently</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {clearOptions.map((option) => (
                                <button
                                    key={option.label}
                                    onClick={() => onClearRequest(option.action)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${colorClasses[option.color]}`}
                                >
                                    <AlertTriangle size={14} />
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
