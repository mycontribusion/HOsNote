import { useState, useRef } from 'react'
import {
    X,
    Type,
    Trash2,
    Database,
    Download,
    Upload,
    CheckCircle,
    ChevronRight,
    MessageSquare,
    Skull,
    Sparkles,
    ShieldCheck,
    FileX,
    Cloud,
    CloudUpload,
    CloudDownload,
    RefreshCw,
    LogOut,
} from 'lucide-react'

function formatBackupDate(isoString) {
    if (!isoString) return ''
    try {
        const date = new Date(isoString)
        if (isNaN(date.getTime())) return ''
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
    } catch {
        return ''
    }
}

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
    onViewDiscardedDrafts,
    hasMyTeamPatients,
    hasOnCallPatients,
    hasMortalities,
    hasDiscardedDrafts,
    hasDocs,
    hasAnyData,
    onStartDemo,
    isStoragePersisted,
    onRequestStoragePersist,
    // Google Drive props
    isGoogleDriveConnected = false,
    googleDriveUser = null,
    googleBackupMeta = null,
    isGoogleDriveLoading = false,
    googleDriveStatusMsg = null,
    onConnectGoogleDrive,
    onDisconnectGoogleDrive,
    onBackupGoogleDrive,
    onRestoreGoogleDrive,
    onRefreshGoogleDrive,
}) {
    const [backupDone, setBackupDone] = useState(false)
    const [restoreMsg, setRestoreMsg] = useState('')
    const [confirmClear, setConfirmClear] = useState(null)
    const [confirmRestoreCloud, setConfirmRestoreCloud] = useState(false)
    const [confirmDisconnectDrive, setConfirmDisconnectDrive] = useState(false)
    const [localDriveMsg, setLocalDriveMsg] = useState('')
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

    const handleConnectClick = async () => {
        try {
            await onConnectGoogleDrive?.()
        } catch (err) {
            setLocalDriveMsg(err.message || 'Unable to connect to Google Drive. Please check your internet connection and try again.')
            setTimeout(() => setLocalDriveMsg(''), 4500)
        }
    }

    const clearOptions = [
        { label: 'My Team', action: 'my_team' },
        { label: 'On Call', action: 'on_call' },
        { label: 'Mortalities', action: 'mortalities' },
        { label: 'Discarded Drafts', action: 'discarded_drafts' },
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

    const Row = ({ icon, iconBg, label, sublabel, right, onClick, danger, noBorder, disabled: rowDisabled }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={!onClick || rowDisabled}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors
                ${(!onClick || rowDisabled) ? 'opacity-40 cursor-not-allowed' : (danger ? 'hover:bg-red-50/60 dark:hover:bg-red-900/10 active:bg-red-100/60' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40 active:bg-gray-100 dark:active:bg-gray-700/60')}
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
                className="w-full sm:max-w-sm bg-gray-50 dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
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

                    {/* App Tour & Demo */}
                    <Section title="Help & Tour">
                        <Row
                            icon={<Sparkles size={15} className="text-white animate-pulse" />}
                            iconBg="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xs"
                            label="Watch App Demo"
                            sublabel="Interactive tour of all features & workflows"
                            right={<ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                            onClick={() => {
                                if (onStartDemo) {
                                    onStartDemo()
                                } else {
                                    onClose()
                                }
                            }}
                            noBorder
                        />
                    </Section>

                    {/* Google Drive Cloud Backup */}
                    <Section title="Google Drive Cloud Backup">
                        {!isGoogleDriveConnected ? (
                            <>
                                <div className="p-4 bg-blue-50/40 dark:bg-blue-950/20 border-b border-gray-100 dark:border-gray-700/40">
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                        Back up your HOsNote data to your Google Drive and restore it when needed.
                                    </p>
                                </div>
                                <Row
                                    icon={<Cloud size={15} className="text-white" />}
                                    iconBg="bg-blue-600"
                                    label="Connect Google Drive"
                                    sublabel="Sign in with your Google account"
                                    right={
                                        isGoogleDriveLoading ? (
                                            <RefreshCw size={15} className="animate-spin text-blue-500 shrink-0" />
                                        ) : (
                                            <span className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shrink-0 shadow-xs">
                                                Connect
                                            </span>
                                        )
                                    }
                                    onClick={handleConnectClick}
                                    disabled={isGoogleDriveLoading}
                                    noBorder={!googleDriveStatusMsg && !localDriveMsg}
                                />
                            </>
                        ) : (
                            <>
                                {/* Account chip */}
                                <div className="px-4 py-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-gray-100 dark:border-gray-700/40">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                                        Connected to:
                                    </p>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                                            {googleDriveUser?.photoLink ? (
                                                <img src={googleDriveUser.photoLink} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                googleDriveUser?.displayName ? googleDriveUser.displayName[0].toUpperCase() : 'G'
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                                {googleDriveUser?.emailAddress || googleDriveUser?.displayName || 'Google Account'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onRefreshGoogleDrive?.()}
                                            title="Check Google Drive"
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        >
                                            <RefreshCw size={13} className={isGoogleDriveLoading ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                    {googleBackupMeta?.exists && (
                                        <div className="mt-2 pt-2 border-t border-blue-100/60 dark:border-gray-700/50 flex flex-col gap-0.5">
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                Last backup:
                                            </p>
                                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                                {formatBackupDate(googleBackupMeta.lastBackupTime)}
                                                {googleBackupMeta.recordCount > 0 && ` (${googleBackupMeta.recordCount} records)`}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Back Up Now */}
                                <Row
                                    icon={<CloudUpload size={15} className="text-white" />}
                                    iconBg="bg-blue-600"
                                    label="Back Up Now"
                                    sublabel="Save your latest patient list and notes to Drive"
                                    right={
                                        isGoogleDriveLoading ? (
                                            <RefreshCw size={15} className="animate-spin text-blue-500 shrink-0" />
                                        ) : (
                                            <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                        )
                                    }
                                    onClick={async () => {
                                        try {
                                            await onBackupGoogleDrive?.()
                                        } catch (e) {
                                            setLocalDriveMsg(e.message || 'Backup failed')
                                            setTimeout(() => setLocalDriveMsg(''), 4000)
                                        }
                                    }}
                                    disabled={!hasAnyData || isGoogleDriveLoading}
                                />

                                {/* Restore Backup */}
                                {confirmRestoreCloud ? (
                                    <div className="px-4 py-3 bg-teal-50/70 dark:bg-teal-950/30 border-b border-gray-100 dark:border-gray-700/40">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                                            Restore from Google Drive?
                                        </p>
                                        <p className="text-[11px] text-gray-600 dark:text-gray-300 mb-2.5 leading-relaxed">
                                            {googleBackupMeta?.exists
                                                ? `Found backup from ${formatBackupDate(googleBackupMeta.lastBackupTime)} with ${googleBackupMeta.recordCount} records. This will safely restore and merge records into your current list.`
                                                : 'This will download your latest backup from Google Drive and restore records.'}
                                        </p>
                                        <div className="flex items-center gap-2 justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setConfirmRestoreCloud(false)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    setConfirmRestoreCloud(false)
                                                    try {
                                                        await onRestoreGoogleDrive?.()
                                                    } catch (e) {
                                                        setLocalDriveMsg(e.message || 'Restore failed')
                                                        setTimeout(() => setLocalDriveMsg(''), 4000)
                                                    }
                                                }}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white shadow-xs"
                                            >
                                                Confirm Restore
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <Row
                                        icon={<CloudDownload size={15} className="text-white" />}
                                        iconBg="bg-teal-600"
                                        label="Restore Backup"
                                        sublabel={
                                            googleBackupMeta?.exists
                                                ? `Cloud backup available (${googleBackupMeta.recordCount} records)`
                                                : 'Download latest backup from Drive'
                                        }
                                        right={
                                            isGoogleDriveLoading ? (
                                                <RefreshCw size={15} className="animate-spin text-teal-500 shrink-0" />
                                            ) : (
                                                <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                            )
                                        }
                                        onClick={() => setConfirmRestoreCloud(true)}
                                        disabled={!googleBackupMeta?.exists || isGoogleDriveLoading}
                                    />
                                )}

                                {/* Disconnect */}
                                {confirmDisconnectDrive ? (
                                    <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-700/40">
                                        <p className="flex-1 text-xs text-red-600 dark:text-red-400 font-semibold">Disconnect Google Drive?</p>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDisconnectDrive(false)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setConfirmDisconnectDrive(false)
                                                await onDisconnectGoogleDrive?.()
                                            }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                ) : (
                                    <Row
                                        icon={<LogOut size={14} className="text-gray-600 dark:text-gray-300" />}
                                        iconBg="bg-gray-100 dark:bg-gray-700"
                                        label="Disconnect"
                                        sublabel="Sign out of Google on this device"
                                        right={<ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                                        onClick={() => setConfirmDisconnectDrive(true)}
                                        noBorder
                                    />
                                )}
                            </>
                        )}

                        {/* Status Messages */}
                        {(googleDriveStatusMsg || localDriveMsg) && (
                            <p className={`text-xs font-semibold text-center px-4 py-2 border-t border-gray-100 dark:border-gray-700/40 ${
                                (googleDriveStatusMsg?.type === 'error' || localDriveMsg?.includes('failed') || localDriveMsg?.includes('Error') || localDriveMsg?.includes('cancel') || localDriveMsg?.includes('Unable'))
                                    ? 'text-red-500'
                                    : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                                {googleDriveStatusMsg?.text || localDriveMsg}
                            </p>
                        )}
                    </Section>

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

                    {/* Local Backup & Restore */}
                    <Section title="Local Data & File Backup">
                        <Row
                            icon={<ShieldCheck size={15} className="text-white" />}
                            iconBg={isStoragePersisted ? 'bg-emerald-500' : 'bg-amber-500'}
                            label="Storage Protection"
                            sublabel={isStoragePersisted ? 'Persistent storage active (Protected)' : 'Tap to request eviction protection'}
                            right={
                                isStoragePersisted ? (
                                    <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 rounded-full shrink-0">
                                        Protected
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 rounded-full shrink-0">
                                        Enable
                                    </span>
                                )
                            }
                            onClick={onRequestStoragePersist}
                        />
                        <Row
                            icon={backupDone ? <CheckCircle size={15} className="text-white" /> : <Download size={15} className="text-white" />}
                            iconBg={backupDone ? 'bg-emerald-500' : 'bg-blue-500'}
                            label={backupDone ? 'Backup saved!' : 'Save Backup File'}
                            sublabel="Export full data snapshot as JSON"
                            right={<ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                            onClick={handleSaveBackupClick}
                            disabled={!hasAnyData}
                        />
                        <Row
                            icon={<Upload size={15} className="text-white" />}
                            iconBg="bg-purple-500"
                            label="Restore from File"
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

                    {/* View Discarded Drafts */}
                    <Section title="Records">
                        <Row
                            icon={<FileX size={15} className="text-white" />}
                            iconBg="bg-amber-500"
                            label="Discarded Drafts"
                            sublabel="Recover accidentally discarded drafts"
                            right={<ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                            onClick={onViewDiscardedDrafts}
                            disabled={!hasDiscardedDrafts}
                        />
                        <Row
                            icon={<Skull size={15} className="text-white" />}
                            iconBg="bg-red-500"
                            label="View Mortalities"
                            sublabel="Browse archived mortality records"
                            right={<ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                            onClick={onViewMortalities}
                            disabled={!hasMortalities}
                            noBorder
                        />
                    </Section>

                    {/* Clear data */}
                    <Section title="Clear Data">
                        {clearOptions.map((opt, i) => {
                            const isDisabled = (opt.action === 'my_team' && !hasMyTeamPatients) ||
                                (opt.action === 'on_call' && !hasOnCallPatients) ||
                                (opt.action === 'mortalities' && !hasMortalities) ||
                                (opt.action === 'discarded_drafts' && !hasDiscardedDrafts) ||
                                (opt.action === 'notebook' && !hasDocs)

                            return confirmClear === opt.action ? (
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
                                    disabled={isDisabled}
                                    noBorder={i === clearOptions.length - 1}
                                />
                            )
                        })}
                    </Section>

                    {/* Contact & Support */}
                    <Section title="Contact & Support">
                        {/* Developer Profile Header */}
                        <div className="p-3.5 bg-gradient-to-br from-blue-50/90 via-slate-50 to-teal-50/70 dark:from-gray-800/90 dark:via-gray-800 dark:to-gray-800/60 border-b border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white font-extrabold text-sm flex items-center justify-center shadow-md shrink-0">
                                    AM
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate">Ahmad M. Musa</h3>
                                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                                            Developer
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">HealthTech & Clinical Systems</p>
                                </div>
                            </div>
                        </div>

                        {/* Direct Contact Links */}
                        <div className="divide-y divide-gray-100 dark:divide-gray-700/40">
                            <a
                                href="mailto:ahmadmusamuhd@gmail.com"
                                className="flex items-center gap-3.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 active:bg-gray-100 transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Send Email</p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">ahmadmusamuhd@gmail.com</p>
                                </div>
                                <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 group-hover:translate-x-0.5 transition-transform" />
                            </a>

                            <a
                                href="https://www.linkedin.com/in/ahmad-m-musa-b93587156/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 active:bg-gray-100 transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">LinkedIn Profile</p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">ahmad-m-musa</p>
                                </div>
                                <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 group-hover:translate-x-0.5 transition-transform" />
                            </a>
                        </div>
                    </Section>

                    {/* App Version Footer */}
                    <div className="flex flex-col items-center justify-center pt-1 pb-2">
                        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                            HOsNote v1.0 • Built with ❤️ for Healthcare Teams
                        </span>
                    </div>

                </div>
            </div>
        </div>
    )
}
