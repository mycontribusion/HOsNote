import { memo } from 'react'

const BottomNavInner = ({ activePage, onPageChange, docCount = 0 }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-700/80 safe-area-bottom">
            <div className="max-w-2xl mx-auto flex pb-[env(safe-area-inset-bottom,0px)]">

                {/* Patients Tab */}
                <button
                    id="nav-patients"
                    onClick={() => onPageChange('patients')}
                    className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all duration-200 relative ${
                        activePage === 'patients'
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                >
                    {/* Active pill background */}
                    {activePage === 'patients' && (
                        <span className="absolute inset-x-6 top-1.5 bottom-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 -z-0" />
                    )}
                    {/* Top bar indicator */}
                    {activePage === 'patients' && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-blue-600 dark:bg-blue-400 rounded-b-full" />
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activePage === 'patients' ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className={`text-[10px] font-bold tracking-wide relative z-10 ${activePage === 'patients' ? 'text-blue-700 dark:text-blue-400' : ''}`}>
                        Patients
                    </span>
                </button>

                {/* Notebook Tab */}
                <button
                    id="nav-notebook"
                    onClick={() => onPageChange('notebook')}
                    className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all duration-200 relative ${
                        activePage === 'notebook'
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                >
                    {/* Active pill background */}
                    {activePage === 'notebook' && (
                        <span className="absolute inset-x-6 top-1.5 bottom-1.5 rounded-2xl bg-teal-50 dark:bg-teal-950/50 -z-0" />
                    )}
                    {/* Top bar indicator */}
                    {activePage === 'notebook' && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-teal-500 dark:bg-teal-400 rounded-b-full" />
                    )}
                    <div className="relative z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activePage === 'notebook' ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        {docCount > 0 && (
                            <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-teal-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 leading-none shadow-sm shadow-teal-500/30">
                                {docCount > 99 ? '99+' : docCount}
                            </span>
                        )}
                    </div>
                    <span className={`text-[10px] font-bold tracking-wide relative z-10 ${activePage === 'notebook' ? 'text-teal-600 dark:text-teal-400' : ''}`}>
                        Notebook
                    </span>
                </button>

            </div>
        </div>
    )
}

export default memo(BottomNavInner)
