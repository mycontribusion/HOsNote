export default function BottomNav({ activePage, setActivePage, docCount = 0 }) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-2xl mx-auto flex">
                <button
                    id="nav-patients"
                    onClick={() => setActivePage('patients')}
                    className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative ${
                        activePage === 'patients'
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                >
                    {/* Active indicator */}
                    {activePage === 'patients' && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-b-full" />
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activePage === 'patients' ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-[10px] font-semibold tracking-wide">Patients</span>
                </button>

                <button
                    id="nav-notebook"
                    onClick={() => setActivePage('notebook')}
                    className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative ${
                        activePage === 'notebook'
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                >
                    {/* Active indicator */}
                    {activePage === 'notebook' && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-teal-500 dark:bg-teal-400 rounded-b-full" />
                    )}
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activePage === 'notebook' ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        {docCount > 0 && (
                            <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-teal-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
                                {docCount > 99 ? '99+' : docCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-semibold tracking-wide">Notebook</span>
                </button>
            </div>
        </div>
    )
}
