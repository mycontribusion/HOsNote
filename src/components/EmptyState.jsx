export default function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            {/* Illustration */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full p-6 mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            </div>

            <h3 className="font-bold text-gray-700 dark:text-gray-200 text-lg mb-2">No patients tracked yet</h3>
            <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs leading-relaxed mb-6">
                Add a patient above using their Ward and Bed number, or scan a QR code to receive handover from another device.
            </p>

            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                </svg>
                <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">All data stays on your device — no internet needed</span>
            </div>
        </div>
    )
}
