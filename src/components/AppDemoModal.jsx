import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Stethoscope, QrCode, BookOpen, Search, ShieldCheck, CheckCircle2, Sparkles, AlertCircle, FileText, ArrowRight, Sun, Moon } from 'lucide-react'

export default function AppDemoModal({ onClose, onGoToPage }) {
    const [currentStep, setCurrentStep] = useState(0)

    const demoSteps = [
        {
            id: 'patients',
            badge: 'Feature 1 of 5',
            icon: <Stethoscope className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
            iconBg: 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800',
            title: 'Patient Tracker & Team Management',
            subtitle: 'Organize ward rounds, team coverage, and patient status seamlessly.',
            details: [
                {
                    title: 'My Team vs. On Call Tabs',
                    desc: 'Separate primary ward patients from temporary call-duty coverage with one tap.',
                },
                {
                    title: 'Ward, Bed & Hospital Number',
                    desc: 'Track bed locations, hospital numbers, and working diagnoses cleanly.',
                },
                {
                    title: 'Critical Patient Flagging',
                    desc: 'Tag unstable or high-risk patients with high-visibility red badges.',
                },
                {
                    title: 'Round Progress Checkboxes',
                    desc: 'Check off reviewed patients during ward rounds to keep track of progress.',
                },
            ],
            previewComponent: (
                <div className="bg-slate-50 dark:bg-gray-800/80 rounded-2xl p-3.5 border border-slate-200 dark:border-gray-700/60 shadow-inner space-y-3 text-left">
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-xl border border-slate-200/80 dark:border-gray-700 shadow-xs">
                        <div className="flex gap-1.5">
                            <span className="px-2.5 py-1 text-[11px] font-extrabold bg-blue-600 text-white rounded-lg shadow-xs">My Team (4)</span>
                            <span className="px-2.5 py-1 text-[11px] font-bold text-gray-500 dark:text-gray-400">On Call (2)</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/50">2 Reviewed</span>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-red-200 dark:border-red-900/40 shadow-xs relative overflow-hidden">
                        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-500" />
                        <div className="flex items-start justify-between pl-1">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-gray-900 dark:text-white">Ward 3A • Bed 12</span>
                                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-900">CRITICAL</span>
                                </div>
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1">John Doe (Hosp #: 98412)</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">Severe Sepsis secondary to CAP</p>
                            </div>
                            <div className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer">
                                <CheckCircle2 size={12} className="text-transparent" />
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'handover',
            badge: 'Feature 2 of 5',
            icon: <QrCode className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
            iconBg: 'bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800',
            title: 'Handover & QR Scanner',
            subtitle: 'Transfer patient lists to incoming doctors instantly via QR code or PDF.',
            details: [
                {
                    title: 'QR Code Instant Share',
                    desc: 'Generate a single QR code containing patient biodata and active notes.',
                },
                {
                    title: 'Built-in Camera Scanner',
                    desc: 'Scan team members’ phones to ingest incoming handovers without manual typing.',
                },
                {
                    title: 'Printable Handover Sheets',
                    desc: 'Export formal, formatted PDF handover documents ready for printing.',
                },
                {
                    title: 'Smart Duplicate Handling',
                    desc: 'Automatically checks for duplicate hospital numbers and updates suffixes.',
                },
            ],
            previewComponent: (
                <div className="bg-slate-50 dark:bg-gray-800/80 rounded-2xl p-4 border border-slate-200 dark:border-gray-700/60 shadow-inner flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-24 h-24 bg-white dark:bg-gray-900 p-2 rounded-2xl border-2 border-purple-500/30 shadow-md flex items-center justify-center relative">
                        <div className="grid grid-cols-4 gap-1 w-full h-full p-1 opacity-80">
                            <div className="bg-purple-900 dark:bg-purple-300 rounded-xs" />
                            <div className="bg-purple-600 dark:bg-purple-500 rounded-xs" />
                            <div className="bg-purple-400 dark:bg-purple-400 rounded-xs" />
                            <div className="bg-purple-900 dark:bg-purple-300 rounded-xs" />
                            <div className="bg-purple-400 dark:bg-purple-400 rounded-xs" />
                            <div className="bg-white dark:bg-gray-900 rounded-xs" />
                            <div className="bg-purple-700 dark:bg-purple-400 rounded-xs" />
                            <div className="bg-purple-600 dark:bg-purple-500 rounded-xs" />
                            <div className="bg-purple-900 dark:bg-purple-300 rounded-xs" />
                            <div className="bg-purple-600 dark:bg-purple-500 rounded-xs" />
                            <div className="bg-white dark:bg-gray-900 rounded-xs" />
                            <div className="bg-purple-800 dark:bg-purple-300 rounded-xs" />
                        </div>
                        <div className="absolute inset-0 bg-purple-500/10 rounded-2xl animate-pulse" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                            Scan or Share Handover QR
                        </span>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 max-w-xs">
                            No internet required. Instant peer-to-peer data synchronization.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'notebook',
            badge: 'Feature 3 of 5',
            icon: <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
            title: 'Clinical Notebook & Composer',
            subtitle: 'Rich documentation area for patient progress notes and standalone entries.',
            details: [
                {
                    title: 'Patient-Linked Notes',
                    desc: 'Keep chronological histories attached to individual patient records.',
                },
                {
                    title: 'Standalone Clinical Notes',
                    desc: 'Draft ward guidelines, drug calculation references, or general quick notes.',
                },
                {
                    title: 'Color Tagging System',
                    desc: 'Organize notes visually with color cards (Blue, Green, Purple, Yellow, Red).',
                },
                {
                    title: 'Quick Note Composer',
                    desc: 'Tap the document icon on any patient to open the instant note drawer.',
                },
            ],
            previewComponent: (
                <div className="bg-slate-50 dark:bg-gray-800/80 rounded-2xl p-3.5 border border-slate-200 dark:border-gray-700/60 shadow-inner space-y-2 text-left">
                    <div className="bg-emerald-500/10 border-l-4 border-emerald-500 dark:bg-emerald-950/30 p-2.5 rounded-r-xl border-y border-r border-emerald-200/50 dark:border-emerald-800/40">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Patient Note • Ward 3A</span>
                            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">10:45 AM</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                            IV Antibiotics day 3. Repeat FBC & CRP in morning. Blood cultures pending.
                        </p>
                    </div>
                    <div className="bg-blue-500/10 border-l-4 border-blue-500 dark:bg-blue-950/30 p-2.5 rounded-r-xl border-y border-r border-blue-200/50 dark:border-blue-800/40">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-900 dark:text-blue-200">Standalone • Electrolyte Protocol</span>
                            <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400">Yesterday</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                            K+ replacement: 40mmol in 1000ml N/Saline over 4 hours max rate.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'search',
            badge: 'Feature 4 of 5',
            icon: <Search className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
            iconBg: 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800',
            title: 'Global Instant Search',
            subtitle: 'Find any patient, ward, hospital number, diagnosis, or note in real-time.',
            details: [
                {
                    title: 'Cross-Category Search',
                    desc: 'Searches active patients, mortalities, and clinical notes simultaneously.',
                },
                {
                    title: 'Live Term Highlighting',
                    desc: 'Matches are highlighted in yellow so you locate specific details instantly.',
                },
                {
                    title: 'Quick Category Filters',
                    desc: 'Filter search results by Wards, Patients, or Notebook entries.',
                },
                {
                    title: 'Keyboard & Esc Navigation',
                    desc: 'Press Esc key or tap Back to return to your previous view without losing state.',
                },
            ],
            previewComponent: (
                <div className="bg-slate-50 dark:bg-gray-800/80 rounded-2xl p-3.5 border border-slate-200 dark:border-gray-700/60 shadow-inner space-y-2.5 text-left">
                    <div className="bg-white dark:bg-gray-900 p-2 px-3 rounded-xl border border-amber-300 dark:border-amber-700 flex items-center gap-2 shadow-xs">
                        <Search size={14} className="text-amber-500 shrink-0" />
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">Sepsis</span>
                        <span className="ml-auto text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">2 Matches</span>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-slate-200 dark:border-gray-700 shadow-xs">
                        <p className="text-xs font-bold text-gray-900 dark:text-white">John Doe • Bed 12</p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                            Diagnosis: Severe <mark className="bg-amber-200 dark:bg-amber-800 dark:text-amber-100 px-0.5 rounded font-bold">Sepsis</mark> secondary to CAP
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'settings',
            badge: 'Feature 5 of 5',
            icon: <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
            iconBg: 'bg-teal-100 dark:bg-teal-900/40 border-teal-200 dark:border-teal-800',
            title: 'Offline Security & Settings',
            subtitle: 'Complete privacy, JSON backups, font adjustments, and re-playable guide.',
            details: [
                {
                    title: '100% Offline-First Security',
                    desc: 'All clinical data resides locally on your device in secure IndexedDB storage.',
                },
                {
                    title: 'Full JSON Backup & Restore',
                    desc: 'Export encrypted snapshots to backup files or transfer to new devices.',
                },
                {
                    title: 'Text Size & Dark Mode',
                    desc: 'Scale text sizes from 80% to 130% and toggle Dark Mode anytime.',
                },
                {
                    title: 'Access Demo Anytime',
                    desc: 'You can replay this interactive tour anytime via the button in Settings!',
                },
            ],
            previewComponent: (
                <div className="bg-slate-50 dark:bg-gray-800/80 rounded-2xl p-3.5 border border-slate-200 dark:border-gray-700/60 shadow-inner flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">Local Encrypted Data</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">Zero cloud sync • Total patient privacy</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                        <Sun size={14} className="text-amber-500" />
                        <Moon size={14} className="text-indigo-400" />
                    </div>
                </div>
            )
        }
    ]

    const activeStep = demoSteps[currentStep]

    const handleNext = () => {
        if (currentStep < demoSteps.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            onClose()
        }
    }

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    return (
        <div
            className="modal-backdrop items-center justify-center p-3 sm:p-4 z-[120]"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-100 dark:border-gray-800"
                role="dialog"
                aria-modal="true"
                aria-labelledby="demo-title"
                style={{ animation: 'slideUp 0.25s ease' }}
            >
                {/* Header with Title & Close */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                            HO
                        </div>
                        <h2 id="demo-title" className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                            HOsNote App Tour
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close demo"
                    >
                        <X size={15} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                {/* Progress Indicators Bar */}
                <div className="px-5 pt-3 pb-1 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800/60">
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        {demoSteps.map((step, idx) => (
                            <button
                                key={step.id}
                                onClick={() => setCurrentStep(idx)}
                                className={`flex-1 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                    idx === currentStep
                                        ? 'bg-blue-600 dark:bg-blue-500 scale-y-125'
                                        : idx < currentStep
                                            ? 'bg-blue-300 dark:bg-blue-900'
                                            : 'bg-gray-200 dark:bg-gray-800'
                                }`}
                                aria-label={`Go to step ${idx + 1}`}
                            />
                        ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 dark:text-gray-500">
                        <span>{activeStep.badge}</span>
                        <span>Step {currentStep + 1} of {demoSteps.length}</span>
                    </div>
                </div>

                {/* Scrollable Step Body */}
                <div className="overflow-y-auto p-5 space-y-4 flex-1">
                    {/* Step Title Header */}
                    <div className="flex items-start gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl border ${activeStep.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
                            {activeStep.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                {activeStep.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                {activeStep.subtitle}
                            </p>
                        </div>
                    </div>

                    {/* Interactive Preview Illustration Card */}
                    <div className="my-2">
                        {activeStep.previewComponent}
                    </div>

                    {/* Bullet List Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {activeStep.details.map((item, index) => (
                            <div
                                key={index}
                                className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex flex-col justify-between"
                            >
                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-gray-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                                    <span>{item.title}</span>
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Navigation Actions */}
                <div className="p-4 px-5 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                        <ChevronLeft size={15} />
                        <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {currentStep === demoSteps.length - 1 ? (
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <CheckCircle2 size={15} />
                                <span>Get Started</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>Next</span>
                                <ChevronRight size={15} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
