import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, ChevronRight, ChevronLeft, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'

// ── Demo data injected during the tour ─────────────────────────────────────
const DEMO_PATIENTS = [
    {
        id: '__demo_patient_right__',
        name: 'Demo Abc',
        hospitalNumber: 'DEMO-001',
        ward: 'Ward 3B',
        bed: '7',
        diagnosis: 'Post-op Appendicitis · Day 2',
        note: '',
        team: 'my_team',
        reviewed: false,
        critical: false,
        isDemoData: true,
        demoSwipeDir: 'right',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
    },
    {
        id: '__demo_patient_left__',
        name: 'Demo Def',
        hospitalNumber: 'DEMO-002',
        ward: 'Ward 5A',
        bed: '12',
        diagnosis: 'Hypertensive Crisis',
        note: '',
        team: 'my_team',
        reviewed: false,
        critical: false,
        isDemoData: true,
        demoSwipeDir: 'left',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
    },
]

const DEMO_DOCS = [
    {
        id: '__demo_doc_patient__',
        patientId: null,
        patientName: 'Demo Abc',
        patientWard: 'Ward 3B',
        patientHosp: 'DEMO-001',
        diagnosis: 'Post-op Appendicitis',
        text: 'Day 2 post-op. Patient stable, tolerating oral fluids well. Wound site clean and dry. Plan to step down analgesia and commence mobilisation tomorrow.',
        color: 'teal',
        isDemoData: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '__demo_doc_standalone__',
        patientId: null,
        patientName: '',
        patientWard: '',
        patientHosp: '',
        diagnosis: 'Sepsis 6 Bundle ⚡',
        text: '1. O₂ if SpO₂ <94%\n2. Blood cultures ×2\n3. IV antibiotics (within 1hr)\n4. IV fluids — 500ml bolus\n5. Check lactate + FBC\n6. Monitor urine output (catheterise if needed)',
        color: 'blue',
        isDemoData: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
]

// First step index that belongs to the notebook section
const NOTEBOOK_START_STEP = 9

export default function InteractiveSpotlightTour({ onClose, onAddDemoData, onRemoveDemoData }) {
    const navigate = useNavigate()
    const location = useLocation()
    const [currentStep, setCurrentStep] = useState(0)
    const [targetRect, setTargetRect] = useState(null)
    const [popoverHeight, setPopoverHeight] = useState(240)
    const popoverRef = useRef(null)
    const notebookDataAdded = useRef(false)

    // Inject demo patients and demo notes immediately on tour start
    useEffect(() => {
        onAddDemoData?.({ patients: DEMO_PATIENTS, docs: DEMO_DOCS })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const steps = [
        // --- PART 1: PATIENTS TRACKER GUIDE ---
        {
            targetId: 'tour-search-btn',
            title: 'Global Instant Search',
            description: 'Search across active patients, hospital numbers, ward names, diagnoses, and notes in real time.',
            preferredPos: 'bottom',
            route: '/team/my_team',
        },
        {
            targetId: 'tour-settings-btn',
            title: 'Settings & Data Backups',
            description: '• Your app control center.\n• Back up all records.\n• Adjust text size for comfortable reading.\n• Restart the guided tour anytime.\n• Clear specific data sections',
            preferredPos: 'bottom',
            route: '/team/my_team',
        },
        {
            targetId: 'tour-team-tabs',
            title: 'My Team & On Call Tabs',
            description: 'Separate your primary ward team patients from temporary on-call patients.',
            preferredPos: 'bottom',
            route: '/team/my_team',
        },
        {
            targetId: 'tour-patient-card-right',
            title: 'Swipe Right to Mark Reviewed',
            description: 'Swipe Left-to-Right ➡️ on a patient card to instantly add it to the Reviewed list and remove it from the active list, keeping your tracker clean.',
            preferredPos: 'bottom',
            route: '/team/my_team',
        },
        {
            targetId: 'tour-patient-card-left',
            title: 'Swipe Left for Quick Actions',
            description: 'Swipe Right-to-Left ⬅️ on a patient card to reveal Quick Actions (Dischare or Mortality).',
            preferredPos: 'top',
            route: '/team/my_team',
        },
        {
            targetId: 'tour-action-collapse',
            title: 'Collapse / Expand Action Bar',
            description: 'Tap this button to collapse the action bar for full-screen reading, or tap again to expand.',
            preferredPos: 'top',
            route: '/team/my_team',
        },
        {
            targetId: 'pat-action-add',
            title: 'Add Patient / Record',
            description: 'Tap here to admit a new patient with details like ward, bed, hospital number & diagnosis.',
            preferredPos: 'top',
            route: '/team/my_team',
        },
        {
            targetId: 'pat-action-handover',
            title: 'Instant Shift Handover',
            description: 'Export selected patients into a QR code, sharable file, or code.',
            preferredPos: 'top',
            route: '/team/my_team',
        },
        {
            targetId: 'pat-action-import',
            title: 'Receive & Scan Handover',
            description: 'Scan a colleague’s handover QR code, import a shared file, or paste a copied text to add their patient list directly into your tracker.',
            preferredPos: 'top',
            route: '/team/my_team',
        },

        // --- PART 2: CLINICAL NOTEBOOK GUIDE (Transitions automatically to /notebook) ---
        {
            targetId: 'tour-page-switch',
            title: 'Patients vs. Notebook Switcher',
            description: 'Tab this button to switch between your Patients Tracker (ward lists) and Clinical Notebook (all your documentations).',
            preferredPos: 'bottom',
            route: '/notebook',
        },
        {
            targetId: 'tour-notebook-filter',
            title: 'Filter Clinical Notes',
            description: 'Filter your notebook list by All entries, Patient-linked notes, or Standalone clinical entries.',
            preferredPos: 'bottom',
            route: '/notebook',
        },
        {
            targetId: 'tour-notebook-sort',
            title: 'Sort Notebook Entries',
            description: 'Sort your clinical notes by Newest First, Oldest First, Patient Name, Ward, or Diagnosis.',
            preferredPos: 'bottom',
            route: '/notebook',
        },
        {
            targetId: 'note-action-add',
            title: 'Add Standalone Note',
            description: 'Jot down anything, clinical pearls to review later, new treatment protocols, ward reminders, or quick reference notes.',
            preferredPos: 'top',
            route: '/notebook',
        },
        {
            targetId: 'note-action-handover',
            title: 'Send / Share Notebook Entries',
            description: 'Export selected notes ,by long press on cards, into a QR code, sharable file, or code.',
            preferredPos: 'top',
            route: '/notebook',
        },
        {
            targetId: 'note-action-import',
            title: 'Receive Notebook Entries',
            description: 'Import notes or clinical documentation from another user.',
            preferredPos: 'top',
            route: '/notebook',
        },
    ]

    const activeStep = steps[currentStep]

    const updateRect = useCallback(() => {
        if (!activeStep) return
        const el = document.getElementById(activeStep.targetId)
        if (el) {
            const rect = el.getBoundingClientRect()
            setTargetRect(prev => {
                if (
                    prev &&
                    prev.top === rect.top &&
                    prev.left === rect.left &&
                    prev.width === rect.width &&
                    prev.height === rect.height
                ) {
                    return prev
                }
                return {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    right: rect.right,
                    bottom: rect.bottom,
                }
            })
        } else {
            setTargetRect(prev => (prev === null ? null : null))
        }
    }, [activeStep])

    useEffect(() => {
        if (!activeStep) return

        // Auto-navigate to section if step belongs to a different route
        if (activeStep.route && location.pathname !== activeStep.route) {
            navigate(activeStep.route)
        }

        const el = document.getElementById(activeStep.targetId)
        if (el) {
            const rect = el.getBoundingClientRect()
            const isOffscreen = rect.top < 0 || rect.bottom > window.innerHeight || rect.left < 0 || rect.right > window.innerWidth
            if (isOffscreen) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }
        updateRect()
        const timer = setTimeout(updateRect, 350)
        return () => clearTimeout(timer)
    }, [currentStep, activeStep, navigate, location.pathname, updateRect])

    // Measure rendered popover card height
    useEffect(() => {
        if (popoverRef.current) {
            const h = popoverRef.current.offsetHeight
            if (h && h !== popoverHeight) {
                setPopoverHeight(h)
            }
        }
    })

    useEffect(() => {
        const handleReposition = () => updateRect()
        window.addEventListener('resize', handleReposition)
        window.addEventListener('scroll', handleReposition, true)
        return () => {
            window.removeEventListener('resize', handleReposition)
            window.removeEventListener('scroll', handleReposition, true)
        }
    }, [updateRect])

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
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

    // Dynamic popover positioning calculation ensuring ZERO overlap with target elements
    const getPopoverStyle = () => {
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const cardWidth = Math.min(410, viewportWidth - 24)
        const cardH = popoverHeight || 230

        if (!targetRect) {
            return {
                popoverStyle: {
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: `${cardWidth}px`,
                },
                arrowPos: 'none',
                arrowStyle: {},
            }
        }

        const margin = 16
        const targetCenterX = targetRect.left + targetRect.width / 2

        let left = targetCenterX - cardWidth / 2
        if (left < 12) left = 12
        if (left + cardWidth > viewportWidth - 12) left = viewportWidth - 12 - cardWidth

        const arrowLeft = targetCenterX - left

        let top = 0
        let arrowPos = 'top'
        let arrowStyle = { left: `${Math.max(24, Math.min(cardWidth - 24, arrowLeft))}px` }

        if (activeStep.preferredPos === 'top') {
            // Position card ABOVE target element with safety margin
            if (targetRect.top - cardH - margin >= 10) {
                top = targetRect.top - cardH - margin
                arrowPos = 'bottom'
            } else {
                top = targetRect.bottom + margin
                arrowPos = 'top'
            }
        } else {
            // Position card BELOW target element with safety margin
            if (targetRect.bottom + cardH + margin <= viewportHeight - 10) {
                top = targetRect.bottom + margin
                arrowPos = 'top'
            } else {
                top = Math.max(10, targetRect.top - cardH - margin)
                arrowPos = 'bottom'
            }
        }

        return {
            popoverStyle: {
                top: `${top}px`,
                left: `${left}px`,
                width: `${cardWidth}px`,
            },
            arrowPos,
            arrowStyle,
        }
    }

    const { popoverStyle, arrowPos, arrowStyle } = getPopoverStyle()

    return (
        <div className="fixed inset-0 z-[200] overflow-hidden pointer-events-auto">
            {/* Fallback backdrop when no target rect */}
            {!targetRect && (
                <div className="absolute inset-0 bg-black/75 transition-opacity duration-300" />
            )}

            {/* Target Highlight Cutout with HUGE Box-Shadow overlay */}
            {targetRect && (
                <div
                    className="fixed rounded-2xl border-2 border-yellow-400 dark:border-yellow-300 transition-all duration-300 pointer-events-none z-[201]"
                    style={{
                        top: `${targetRect.top - 6}px`,
                        left: `${targetRect.left - 6}px`,
                        width: `${targetRect.width + 12}px`,
                        height: `${targetRect.height + 12}px`,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 25px rgba(250, 204, 21, 0.8)',
                    }}
                >
                    <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-yellow-400 text-blue-950 font-black text-xs flex items-center justify-center shadow-lg animate-bounce">
                        {currentStep + 1}
                    </div>
                </div>
            )}

            {/* Floating Popover Card */}
            <div
                ref={popoverRef}
                className="absolute z-[210] bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200"
                style={popoverStyle}
            >
                {/* Arrow Pointer Tip */}
                {arrowPos === 'top' && (
                    <div
                        className="absolute -top-3.5 w-0 h-0 border-x-10 border-x-transparent border-b-[12px] border-b-white dark:border-b-gray-900 -translate-x-1/2 filter drop-shadow-sm"
                        style={arrowStyle}
                    />
                )}
                {arrowPos === 'bottom' && (
                    <div
                        className="absolute -bottom-3.5 w-0 h-0 border-x-10 border-x-transparent border-t-[12px] border-t-white dark:border-t-gray-900 -translate-x-1/2 filter drop-shadow-sm"
                        style={arrowStyle}
                    />
                )}

                {/* Card Header */}
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                            {currentStep + 1}
                        </div>
                        <h3 className="text-base font-black text-gray-900 dark:text-white truncate tracking-tight">
                            {activeStep.title}
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white shrink-0"
                        aria-label="Close tour"
                        title="Exit tour"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Description Text */}
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {activeStep.description}
                </p>

                {/* Footer Controls */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-extrabold text-gray-400 dark:text-gray-400">
                        Step {currentStep + 1} of {steps.length}
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className="px-3 py-2 rounded-xl text-xs font-extrabold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <span>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</span>
                            {currentStep === steps.length - 1 ? <CheckCircle2 size={15} /> : <ChevronRight size={15} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

