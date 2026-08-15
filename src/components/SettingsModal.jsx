import { useState, useRef } from 'react'
import { X, Type, Trash2, Database, Download, Upload, CheckCircle, ChevronRight, MessageSquare, Skull } from 'lucide-react'

export default function SettingsModal({
    onClose,
    onOpenFeedback,
    textSize,
    onDecreaseText,
    onIncreaseText,
    onClearRequest,
    onSaveBackup,
    onRestoreBackup,
    onViewMortalities,
}) {
    const [backupDone, setBackupDone] = useState(false)
    const [restoreMsg, setRestoreMsg] = useState('')
    const [confirmClear, setConfirmClear] = useState(null) // action string pending confirm
    const fileInputRef = useRef(null)

    const handleSaveBackupClick = async () => {
        if (onSaveBackup) {
            const success = await onSaveBackup()
            if (success !== false) {
                setBackupDone(true)
                setTimeout(() => setBackupDone(false), 2500)
            }
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result)
                if (data && (data.patients || data.mortalities || data.discharges || data.docs || Array.isArray(data))) {
                    if (onRestoreBackup) {
                        onRestoreBackup(data)
                        setRestoreMsg('Restored successfully')
                        setTimeout(() => setRestoreMsg(''), 3500)
                    }
                } else {
                    setRestoreMsg('Invalid backup file')
                }
            } catch {
                setRestoreMsg('Could not read file')
            }
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    const clearOptions = [
        { label: 'My Team', action: 'my_team' },
        { label: 'On Call', action: 'on_call' },
        { label: 'Mortalities', action: 'mortalities' },
        { label: 'Notebook', action: 'notebook' },
    ]

    const Section = ({ title, children }) => (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1 mb-1">{title}</p>
            <div className="bg-white dark:bg-gray-800/60 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50">
                {children}
            </div>
        </div>
    )

    const Row = ({ icon, iconBg, label, sublabel, right, onClick, danger, noBorder }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors
                ${onClick ? (danger ? 'hover:bg-red-50/60 dark:hover:bg-red-900/10 active:bg-red-100/60' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40 active:bg-gray-100 dark:active:bg-gray-700/60') : 'cursor-default'}
                ${!noBorder ? 'border-b border-gray-100 dark:border-gray-700/40 last:border-0' : ''}
            `}
        >
            {icon && (
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    {icon}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{label}</p>
                {sublabel && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">{sublabel}</p>}
            </div>
            {right}
        </button>
    )

    return (
        <div
            className="modal-backdrop items-end sm:items-center"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full sm:max-w-sm bg-gray-50 dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-title"
                style={{ animation: 'slideUp 0.25s ease' }}
            >
                {/* Drag handle (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-3 pb-4 sm:pt-5">
                    <h2 id="settings-title" className="text-lg font-bold text-gray-900 dark:text-white">Settings</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <X size={15} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex flex-col gap-5 px-4 pb-8">

                    {/* Text Size */}
                    <Section title="Appearance">
                        <div className="flex items-center gap-3.5 px-4 py-3.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0">
                                <Type size={15} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Text Size</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{textSize}%</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onDecreaseText}
                                    disabled={textSize <= 80}
                                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Decrease text size"
                                >A-</button>
                                <button
                                    onClick={onIncreaseText}
                                    disabled={textSize >= 130}
                                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Increase text size"
                                >A+</button>
                            </div>
                        </div>
                    </Section>

                    {/* Backup & Restore */}
                    <Section title="Data">
                        <Row
                            icon={backupDone ? <CheckCircle size={15} className="text-white" /> : <Download size={15} className="text-white" />}
                            iconBg={backupDone ? 'bg-emerald-500' : 'bg-blue-500'}
                            label={backupDone ? 'Backup saved!' : 'Save Backup'}
                            sublabel="Export full data snapshot as JSON"
                            right={<ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                            onClick={handleSaveBackupClick}
                        />
                        <Row
                            icon={<Upload size={15} className="text-white" />}
                            iconBg="bg-purple-500"
                            label="Restore Backup"
                            sublabel="Import from a saved JSON file"
                            right={<ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                            onClick={() => fileInputRef.current?.click()}
                            noBorder
                        />
                        {restoreMsg && (
                            <p className={`text-xs font-semibold text-center px-4 pb-3 ${restoreMsg.includes('Invalid') || restoreMsg.includes('Could') ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {restoreMsg}
                            </p>
                        )}
                        <input ref={fileInputRef} type="file" accept=".json,application/json,.txt,text/plain" className="hidden" onChange={handleFileChange} />
                    </Section>

                    {/* View Mortalities */}
                    <Section title="Records">
                        <Row
                            icon={<Skull size={15} className="text-white" />}
                            iconBg="bg-red-500"
                            label="View Mortalities"
                            sublabel="Browse archived mortality records"
                            right={<ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                            onClick={onViewMortalities}
                            noBorder
                        />
                    </Section>

                    {/* Clear data */}
                    <Section title="Clear Data">
                        {clearOptions.map((opt, i) => (
                            confirmClear === opt.action ? (
                                <div key={opt.label} className={`flex items-center gap-2 px-4 py-3 ${i < clearOptions.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/40' : ''}`}>
                                    <p className="flex-1 text-xs text-red-600 dark:text-red-400 font-semibold">Clear {opt.label}?</p>
                                    <button onClick={() => setConfirmClear(null)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={() => { onClearRequest(opt.action); setConfirmClear(null) }} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">
                                        Clear
                                    </button>
                                </div>
                            ) : (
                                <Row
                                    key={opt.label}
                                    icon={<Trash2 size={13} className="text-white" />}
                                    iconBg="bg-red-400"
                                    label={`Clear ${opt.label}`}
                                    danger
                                    right={<ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                                    onClick={() => setConfirmClear(opt.action)}
                                    noBorder={i === clearOptions.length - 1}
                                />
                            )
                        ))}
                    </Section>

                    {/* Contact */}
                    <Section title="Contact">
                        <Row
                            icon={<MessageSquare size={15} className="text-white" />}
                            iconBg="bg-teal-500"
                            label="Send Feedback"
                            sublabel="Report a bug or suggest a feature"
                            right={<ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                            onClick={onOpenFeedback}
                        />
                        <div className="flex items-center justify-center gap-5 px-4 py-3.5">
                            <a href="mailto:ahmadmusamuhd@gmail.com" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Email">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-400"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            </a>
                            <a href="https://wa.me/2347030061764" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="WhatsApp">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500 dark:text-gray-400"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                            </a>
                            <a href="https://www.linkedin.com/in/ahmad-m-musa-b93587156/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="LinkedIn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500 dark:text-gray-400"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                            </a>
                        </div>
                        <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 pb-3">
                            Built with ❤️ for healthcare teams
                        </p>
                    </Section>

                </div>
            </div>
        </div>
    )
}
