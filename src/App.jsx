import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { SearchProvider } from './context/SearchContext'
import Header from './components/Header'
import AddPatientForm from './components/AddPatientForm'
import PatientList from './components/PatientList'
import ConfirmDialog from './components/ConfirmDialog'
import EmptyState from './components/EmptyState'
import RemovalChoiceDialog from './components/RemovalChoiceDialog'
import PatientActionBar from './components/PatientActionBar'
import { get, set } from 'idb-keyval'
import { generateUniqueValue, updateSuffixesAfterRemoval } from './utils/uniqueSuffix'
import { formatSmartDate } from './utils/formatSmartDate'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'

import DemoBanner from './components/DemoBanner'

const ExportModal = lazy(() => import('./components/ExportModal'))
const ScannerComponent = lazy(() => import('./components/ScannerComponent'))
const ReviewDuplicatesModal = lazy(() => import('./components/ReviewDuplicatesModal'))
const SettingsModal = lazy(() => import('./components/SettingsModal'))
const NotebookPage = lazy(() => import('./components/NotebookPage'))
const DocComposer = lazy(() => import('./components/DocComposer'))
const SearchResultsPage = lazy(() => import('./components/SearchResultsPage'))
const InteractiveSpotlightTour = lazy(() => import('./components/InteractiveSpotlightTour'))

const STORAGE_KEY = '4myteam_patients'
const MORTALITIES_KEY = '4myteam_mortalities'
const DISCHARGES_KEY = '4myteam_discharges'
const DISCHARGES_RESET_KEY = '4myteam_discharges_reset'
const DARK_MODE_KEY = '4myteam_darkmode'
const DOCUMENTATION_KEY = 'hosnote_docs'

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function PrintView({ patients, listName }) {
    return (
        <div id="print-view" className="hidden">
            <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-tighter">Handover Report: {listName}</h1>
                    <p className="text-xs text-gray-600 font-medium">Generated on {formatSmartDate(new Date().toISOString())}</p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-black italic">HOsNote</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th className="col-ward">Ward</th>
                        <th className="col-bed">Bed</th>
                        <th className="col-name">Patient Name</th>
                        <th className="col-hosp">Hosp. No</th>
                        <th className="col-notes">Notes / Observations</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map(p => (
                        <tr key={p.id} className={p.critical ? 'critical-row' : ''}>
                            <td className="font-bold whitespace-normal break-all">{p.ward}</td>
                            <td className="font-bold">{p.bed}</td>
                            <td>
                                {p.critical && <span className="critical-tag">CRITICAL</span>}
                                <span className="font-bold">{p.name}</span>
                            </td>
                            <td className="text-sm font-mono">{p.hospitalNumber}</td>
                            <td className="italic">{p.note}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-8 pt-4 border-t border-gray-300 text-[8pt] text-gray-500 flex justify-between">
                <p>Digital signature: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                <p>Page 1 of 1</p>
            </div>
        </div>
    )
}

export default function App() {
    const params = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    // Real URL-based navigation:
    //   /                 -> patients page, my_team tab
    //   /team/:tab        -> patients page, :tab in {my_team, other_team, mortalities}
    //   /notebook         -> clinical notebook page
    const activePage = location.pathname === '/search' ? 'search' : location.pathname.startsWith('/notebook') ? 'notebook' : 'patients'
    const activeTab = params.tab && ['my_team', 'other_team', 'mortalities'].includes(params.tab)
        ? params.tab
        : location.pathname === '/mortalities'
            ? 'mortalities'
            : 'my_team'

    const goToPage = useCallback((page) => {
        setMortalitiesOnly(false)
        if (page === 'notebook') navigate('/notebook')
        else navigate(`/team/${activeTab}`)
    }, [navigate, activeTab])
    const goToTab = useCallback((tab) => {
        setMortalitiesOnly(false)
        navigate(`/team/${tab}`)
    }, [navigate])

    const onHome = useCallback(() => {
        setMortalitiesOnly(false)
        navigate('/team/my_team')
    }, [navigate])

// Navigate back to default page when closing a URL-triggered modal/form
const navigateBackFromUrlRoute = useCallback(() => {
    const path = location.pathname
    if (path === '/notebook/edit' || path === '/notebook/add' ||
        path === '/notebook/handover' || path === '/notebook/receive') {
        navigate('/notebook')
    } else if (path.endsWith('/add') || path.includes('/edit') ||
        path.includes('/handover') || path.includes('/recieve') || path.includes('/receive')) {
        navigate(`/team/${activeTab}`)
    } else if (path === '/settings' || path === '/search' || path === '/demo') {
        navigate('/team/my_team')
    }
}, [location.pathname, navigate, activeTab])

// Detect URL routes and trigger corresponding modals/forms
useEffect(() => {
    const path = location.pathname

    // Reset all modal states first (but NOT showDemoModal — the tour
    // manages its own lifecycle and navigates between routes internally)
    setShowAddForm(false)
    setShowMortalityForm(false)
    if (!path.includes('/edit')) {
        setEditingPatient(null)
    }
    setShowExport(false)
    setShowScanner(false)
    setShowSettings(false)
    setShowSearch(false)
    if (path !== '/notebook/edit' && path !== '/notebook/add') {
        setNotebookEditDoc(null)
    }

    if (path.endsWith('/add') && !path.startsWith('/notebook/add')) {
        setShowAddForm(true)
    } else if (path.includes('/edit') && !path.startsWith('/notebook/edit')) {
        if (pendingEditRef.current) {
            setEditingPatient(pendingEditRef.current)
            pendingEditRef.current = null
        }
    } else if (path === '/notebook/edit' || path === '/notebook/add') {
        // Notebook state is managed by NotebookPage component
    } else if (path.includes('/handover')) {
        setShowExport(true)
    } else if (path.includes('/recieve') || path.includes('/receive')) {
        setShowScanner(true)
    } else if (path === '/settings') {
        setShowSettings(true)
    } else if (path === '/search') {
        setShowSearch(true)
    } else if (path === '/demo') {
        setShowDemoModal(true)
    }
}, [location.pathname])

const [isLoaded, setIsLoaded] = useState(false)
const [patients, setPatients] = useState([])
const [mortalities, setMortalities] = useState([])
const [discharges, setDischarges] = useState([])
const [docs, setDocs] = useState([])
const [notebookExportDocs, setNotebookExportDocs] = useState(null)
const [notebookEditDoc, setNotebookEditDoc] = useState(null)
const [composingFor, setComposingFor] = useState(null) // patient object when DocComposer is open
const [dischargesResetDate, setDischargesResetDate] = useState(new Date().toLocaleDateString())
const [mortalitiesOnly, setMortalitiesOnly] = useState(false)
const [initialSelectedPatientId, setInitialSelectedPatientId] = useState(null)
const [darkMode, setDarkMode] = useState(() => {
    try {
        const stored = localStorage.getItem(DARK_MODE_KEY)
        if (stored !== null) return JSON.parse(stored)
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
        return false
    }
})

// Refs for route detection effect (avoid re-running effect on every patient change)
const patientsRef = useRef(patients)
patientsRef.current = patients
const mortalitiesRef = useRef(mortalities)
mortalitiesRef.current = mortalities
const docsRef = useRef(docs)
docsRef.current = docs
const pendingEditRef = useRef(null)

// Load from IndexedDB or migrate from localStorage
    useEffect(() => {
        const loadData = async () => {
            try {
                // Patients
                let pts = await get(STORAGE_KEY)
                if (pts === undefined) {
                    const legacy = localStorage.getItem(STORAGE_KEY)
                    if (legacy) { pts = JSON.parse(legacy); await set(STORAGE_KEY, pts); localStorage.removeItem(STORAGE_KEY) }
                    else pts = []
                }
                
                // Mortalities
                let morts = await get(MORTALITIES_KEY)
                if (morts === undefined) {
                    const legacy = localStorage.getItem(MORTALITIES_KEY)
                    if (legacy) { morts = JSON.parse(legacy); await set(MORTALITIES_KEY, morts); localStorage.removeItem(MORTALITIES_KEY) }
                    else morts = []
                }

                // Discharges
                let dis = await get(DISCHARGES_KEY)
                if (dis === undefined) {
                    const legacy = localStorage.getItem(DISCHARGES_KEY)
                    if (legacy) { dis = JSON.parse(legacy); await set(DISCHARGES_KEY, dis); localStorage.removeItem(DISCHARGES_KEY) }
                    else dis = []
                }

                // Discharge Reset Date
                let resDate = await get(DISCHARGES_RESET_KEY)
                if (resDate === undefined) {
                    const legacy = localStorage.getItem(DISCHARGES_RESET_KEY)
                    if (legacy) { resDate = legacy; await set(DISCHARGES_RESET_KEY, resDate); localStorage.removeItem(DISCHARGES_RESET_KEY) }
                    else resDate = new Date().toLocaleDateString()
                }

                setPatients(pts)
                setMortalities(morts)
                setDischarges(dis)
                setDischargesResetDate(resDate)

                // Docs — load then migrate any legacy patient.note strings
                let storedDocs = await get(DOCUMENTATION_KEY)
                if (storedDocs === undefined) storedDocs = []

                // One-time migration: any patient that still has a note string
                // but no corresponding doc entry gets one created
                const existingPatientIds = new Set(storedDocs.map(d => d.patientId))
                const migrated = []
                pts.forEach(p => {
                    if (p.note && p.note.trim() && !existingPatientIds.has(p.id)) {
                        migrated.push({
                            id: `${Date.now()}-migrated-${p.id}`,
                            patientId: p.id,
                            patientName: p.name || '',
                            patientWard: p.ward || '',
                            patientHosp: p.hospitalNumber || '',
                            text: p.note.trim(),
                            color: 'blue',
                            createdAt: p.lastUpdated || new Date().toISOString(),
                            updatedAt: p.lastUpdated || new Date().toISOString(),
                        })
                    }
                })
                const allDocs = [...storedDocs, ...migrated]
                // One-time migration & repair: link imported docs with patient biodata, and clean up falsely assigned patientIds on standalone notes
                const identityKey = (name, ward, hosp) => {
                    const n = (name || '').trim().toLowerCase();
                    const w = (ward || '').trim().toUpperCase();
                    const h = (hosp || '').trim().toLowerCase();
                    if (!n && !w && !h) return null;
                    return `${n}|${w}|${h}`;
                };
                const patientIdentityMap = {};
                [...pts, ...morts].forEach(p => {
                    const k = identityKey(p.name, p.ward, p.hospitalNumber);
                    if (k) patientIdentityMap[k] = p.id;
                });
                const linkedDocs = allDocs.map(d => {
                    const hasBiodata = Boolean(d.patientName?.trim() || d.patientWard?.trim() || d.patientHosp?.trim());
                    if (!hasBiodata) {
                        // Standalone note: ensure patientId is null
                        if (d.patientId !== null && d.patientId !== undefined) {
                            return { ...d, patientId: null };
                        }
                        return d;
                    }
                    // Patient note: if missing patientId, attempt to link by identity
                    if (!d.patientId) {
                        const key = identityKey(d.patientName, d.patientWard, d.patientHosp);
                        const matchedId = key ? patientIdentityMap[key] : null;
                        if (matchedId) {
                            return { ...d, patientId: matchedId };
                        }
                    }
                    return d;
                });
                const hasChanged = linkedDocs.some((d, i) => d.patientId !== allDocs[i]?.patientId);
                const finalDocs = hasChanged ? linkedDocs : allDocs;
                if (hasChanged) await set(DOCUMENTATION_KEY, finalDocs);
                setDocs(finalDocs);

            } catch (err) {
                console.error("Failed to load data from IndexedDB", err)
            } finally {
                setIsLoaded(true)
            }
        }
        loadData()
    }, [])

    const [showExport, setShowExport] = useState(false)
    const [showScanner, setShowScanner] = useState(false)
    const [showConfirmResetStats, setShowConfirmResetStats] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [showMortalityForm, setShowMortalityForm] = useState(false)
    const [showFeedback, setShowFeedback] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const searchReturnPathRef = useRef('/team/my_team')
    const [initialSelectedDocId, setInitialSelectedDocId] = useState(null)
    const [reviewedExpandTrigger, setReviewedExpandTrigger] = useState(0)
    const [notebookSearchHighlight, setNotebookSearchHighlight] = useState('')
    const [searchHighlightField, setSearchHighlightField] = useState(null)
    const [searchHighlightQuery, setSearchHighlightQuery] = useState('')
    const [textSize, setTextSize] = useState(() => {
        try {
            const saved = localStorage.getItem('hosnote_textsize')
            if (saved) return JSON.parse(saved)
        } catch { /* ignore */ }
        return 100
    })
    const [editingPatient, setEditingPatient] = useState(null)
    const editingPatientRef = useRef(editingPatient)
    useEffect(() => {
        editingPatientRef.current = editingPatient
    })
    const [removalCandidateId, setRemovalCandidateId] = useState(null)
    const [pendingImport, setPendingImport] = useState(null)
    const [history, setHistory] = useState([]) // Stack of { patients, mortalities, discharges } objects
    const [showUndoToast, setShowUndoToast] = useState(false)
    const [selectedPatientIds, setSelectedPatientIds] = useState(new Set())
    const [pendingClearAction, setPendingClearAction] = useState(null)
    const [showDemoModal, setShowDemoModal] = useState(false)
    const [showDemoBanner, setShowDemoBanner] = useState(() => {
        try {
            return localStorage.getItem('hosnote_demo_banner_dismissed') !== 'true'
        } catch {
            return true
        }
    })
    const [showDemoSkipToast, setShowDemoSkipToast] = useState(false)

    const handleSkipDemoBanner = useCallback(() => {
        setShowDemoBanner(false)
        try {
            localStorage.setItem('hosnote_demo_banner_dismissed', 'true')
        } catch { /* ignore */ }
        setShowDemoSkipToast(true)
        setTimeout(() => setShowDemoSkipToast(false), 5000)
    }, [])

    // Clear selection when switching tabs or pages
    useEffect(() => {
        setSelectedPatientIds(new Set())
    }, [activeTab, activePage])

    // Apply dark mode class to <html>
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        try {
            localStorage.setItem(DARK_MODE_KEY, JSON.stringify(darkMode))
        } catch { /* ignore */ }
    }, [darkMode])

    // Apply text size to root
    useEffect(() => {
        document.documentElement.style.fontSize = `${textSize}%`
        try {
            localStorage.setItem('hosnote_textsize', JSON.stringify(textSize))
        } catch { /* ignore */ }
    }, [textSize])


    const toggleDarkMode = useCallback(() => setDarkMode(prev => !prev), [])

    const decreaseTextSize = useCallback(() => {
        setTextSize(prev => Math.max(80, prev - 10))
    }, [])

    const increaseTextSize = useCallback(() => {
        setTextSize(prev => Math.min(130, prev + 10))
    }, [])

    const clearMyTeam = useCallback(() => {
        setHistory(prev => [{ patients, mortalities, discharges, docs }, ...prev].slice(0, 5))
        const removedPatients = patients.filter(p => p.team === 'my_team')
        const remainingPatients = patients.filter(p => p.team !== 'my_team')
        const updatedPatients = updateSuffixesAfterRemoval(remainingPatients, removedPatients)
        setPatients(updatedPatients)
        setShowUndoToast(true)
        setTimeout(() => setShowUndoToast(false), 5000)
    }, [patients, mortalities, discharges, docs])

    const clearOnCall = useCallback(() => {
        setHistory(prev => [{ patients, mortalities, discharges, docs }, ...prev].slice(0, 5))
        const removedPatients = patients.filter(p => p.team === 'other_team')
        const remainingPatients = patients.filter(p => p.team !== 'other_team')
        const updatedPatients = updateSuffixesAfterRemoval(remainingPatients, removedPatients)
        setPatients(updatedPatients)
        setShowUndoToast(true)
        setTimeout(() => setShowUndoToast(false), 5000)
    }, [patients, mortalities, discharges, docs])

    const clearMortalities = useCallback(() => {
        setHistory(prev => [{ patients, mortalities, discharges, docs }, ...prev].slice(0, 5))
        setMortalities([])
        setShowUndoToast(true)
        setTimeout(() => setShowUndoToast(false), 5000)
    }, [patients, mortalities, discharges, docs])

    const clearNotebook = useCallback(() => {
        setHistory(prev => [{ patients, mortalities, discharges, docs }, ...prev].slice(0, 5))
        setDocs([])
        setShowUndoToast(true)
        setTimeout(() => setShowUndoToast(false), 5000)
    }, [patients, mortalities, discharges, docs])

    const handleClearRequest = useCallback((action) => {
        setPendingClearAction(action)
    }, [])

    const confirmClear = useCallback(() => {
        switch (pendingClearAction) {
            case 'my_team':
                clearMyTeam()
                break
            case 'on_call':
                clearOnCall()
                break
            case 'mortalities':
                clearMortalities()
                break
            case 'notebook':
                clearNotebook()
                break
        }
        setPendingClearAction(null)
    }, [pendingClearAction, clearMyTeam, clearOnCall, clearMortalities, clearNotebook])

    // Debounced IndexedDB persistence to avoid blocking main thread
    const saveTimers = useRef({})

    const debouncedSave = useCallback((key, data, delay = 500) => {
        if (saveTimers.current[key]) clearTimeout(saveTimers.current[key])
        saveTimers.current[key] = setTimeout(() => {
            set(key, data).catch(console.error)
        }, delay)
    }, [])

    useEffect(() => {
        if (!isLoaded) return;
        debouncedSave(STORAGE_KEY, patients)
    }, [patients, isLoaded, debouncedSave])

    useEffect(() => {
        if (!isLoaded) return;
        debouncedSave(MORTALITIES_KEY, mortalities)
    }, [mortalities, isLoaded, debouncedSave])

    useEffect(() => {
        if (!isLoaded) return;
        debouncedSave(DISCHARGES_KEY, discharges)
        debouncedSave(DISCHARGES_RESET_KEY, dischargesResetDate)
    }, [discharges, dischargesResetDate, isLoaded, debouncedSave])

    useEffect(() => {
        if (!isLoaded) return;
        // Use a longer debounce for docs — the array can be large and changes
        // frequently during note editing. 1500ms reduces write amplification.
        debouncedSave(DOCUMENTATION_KEY, docs, 1500)
    }, [docs, isLoaded, debouncedSave])

    // ── Documentation callbacks ───────────────────────────────────────────────

    const addDoc = useCallback((patient, text, color = 'blue') => {
        const entry = {
            id: generateId(),
            patientId: patient.id,
            patientName: patient.name || '',
            patientWard: patient.ward || '',
            patientHosp: patient.hospitalNumber || '',
            diagnosis: patient.diagnosis || patient.patientDiagnosis || '',
            patientDiagnosis: patient.diagnosis || patient.patientDiagnosis || '',
            text: text.trim(),
            color,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        setDocs(prev => [entry, ...prev])
        setComposingFor(null)
    }, [])

    const addStandaloneDoc = useCallback((text, diagnosis = '') => {
        const entry = {
            id: generateId(),
            patientId: null,
            patientName: '',
            patientWard: '',
            patientHosp: '',
            diagnosis: diagnosis.trim(),
            patientDiagnosis: diagnosis.trim(),
            text: text.trim(),
            color: 'blue',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        setDocs(prev => [entry, ...prev])
    }, [])

    const updateDoc = useCallback((id, text, color, fieldPatch = {}) => {
        setDocs(prev => prev.map(d =>
            d.id === id ? {
                ...d,
                text: text.trim(),
                color,
                updatedAt: new Date().toISOString(),
                ...(fieldPatch.name !== undefined      && { patientName: fieldPatch.name }),
                ...(fieldPatch.ward !== undefined      && { patientWard: fieldPatch.ward }),
                ...(fieldPatch.hospitalNumber !== undefined && { patientHosp: fieldPatch.hospitalNumber }),
                ...(fieldPatch.diagnosis !== undefined && { diagnosis: fieldPatch.diagnosis, patientDiagnosis: fieldPatch.diagnosis }),
            } : d
        ))
    }, [])

    const deleteDoc = useCallback((id) => {
        setHistory(prev => [{ patients, mortalities, discharges, docs }, ...prev].slice(0, 5))
        setDocs(prev => prev.filter(d => d.id !== id))
        setShowUndoToast(true)
        setTimeout(() => setShowUndoToast(false), 5000)
    }, [patients, mortalities, discharges, docs])

    const docCountMap = useMemo(() => {
        const map = {}
        for (let i = 0; i < docs.length; i++) {
            const pId = docs[i].patientId
            if (pId) map[pId] = (map[pId] || 0) + 1
        }
        return map
    }, [docs])

    const getDocCount = useCallback((patientId) => {
        return docCountMap[patientId] || 0
    }, [docCountMap])

    // ── Restore from JSON backup ──────────────────────────────────────────────

    const restoreFromBackup = useCallback((data) => {
        setHistory(prev => [{ patients, mortalities, discharges, docs }, ...prev].slice(0, 5))

        if (Array.isArray(data.patients)) {
            setPatients(prev => {
                const ids = new Set(prev.map(p => p.id))
                const newOnes = data.patients.filter(p => !ids.has(p.id))
                return [...prev, ...newOnes]
            })
        }
        if (Array.isArray(data.mortalities)) {
            setMortalities(prev => {
                const ids = new Set(prev.map(p => p.id))
                const newOnes = data.mortalities.filter(p => !ids.has(p.id))
                return [...prev, ...newOnes]
            })
        }
        if (Array.isArray(data.discharges)) {
            setDischarges(prev => {
                const ids = new Set(prev.map(d => d.id))
                const newOnes = data.discharges.filter(d => !ids.has(d.id))
                return [...prev, ...newOnes]
            })
        }
        if (Array.isArray(data.docs)) {
            setDocs(prev => {
                const ids = new Set(prev.map(d => d.id))
                const newOnes = data.docs.filter(d => !ids.has(d.id))
                return [...prev, ...newOnes]
            })
        }
    }, [patients, mortalities, discharges, docs])

    // ── Save full JSON backup ─────────────────────────────────────────────────

    const handleSaveBackup = useCallback(async () => {
        const backup = {
            __type: 'hosnote-backup',
            __v: 1,
            exportedAt: new Date().toISOString(),
            patients,
            mortalities,
            discharges,
            docs,
        }
        const json = JSON.stringify(backup, null, 2)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -1)
        const fileName = `HOsNote_Backup_${timestamp}.json`

        if (Capacitor.isNativePlatform()) {
            try {
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: json,
                    directory: Directory.Cache,
                    encoding: Encoding.UTF8,
                })
                await Share.share({ title: 'HOsNote Backup', url: result.uri })
                return true
            } catch (e) {
                console.error('Native backup share failed:', e)
                return false
            }
        }

        const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', fileName)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        return true
    }, [patients, mortalities, discharges, docs])

    const savePatient = useCallback(({ team = 'my_team', name, hospitalNumber, ward, bed, note, critical = false, admissionDate, diagnosis }) => {
        const n = name.trim()
        const h = hospitalNumber.trim()
        const w = ward.trim().toUpperCase()
        const b = bed.trim()
        const t = note.trim()
        const diag = (diagnosis || '').trim()
        const c = !!critical

        if (!w && !h && !n) return false

        const ep = editingPatientRef.current
        // Duplicate check: same hospital number (includes mortalities) OR same ward+bed combo (active patients only)
        const duplicateHosp = h && [...patients, ...mortalities].some((p) => {
            if (ep && p.id === ep.id) return false;
            return p.hospitalNumber === h;
        });
        const duplicateBed = w && b && patients.some((p) => {
            if (ep && p.id === ep.id) return false;
            return p.ward === w && p.bed === b;
        });

        // If both hospital number and bed are duplicates, report both so suffixes
        // can be added to both fields simultaneously.
        if (duplicateHosp && duplicateBed) {
            const existingHosp = [...patients, ...mortalities].find((p) => {
                if (ep && p.id === ep.id) return false;
                return p.hospitalNumber === h;
            });
            const existingBed = patients.find((p) => {
                if (ep && p.id === ep.id) return false;
                return p.ward === w && p.bed === b;
            });
            return { type: 'duplicate_both', field: 'both', value: h, bedValue: b, ward: w, existingHosp, existingBed };
        }

        if (duplicateHosp) {
            const existing = [...patients, ...mortalities].find((p) => {
                if (ep && p.id === ep.id) return false;
                return p.hospitalNumber === h;
            });
            return { type: 'duplicate_hosp', field: 'hospitalNumber', value: h, existing };
        }

        if (duplicateBed) {
            const existing = patients.find((p) => {
                if (ep && p.id === ep.id) return false;
                return p.ward === w && p.bed === b;
            });
            return { type: 'duplicate_bed', field: 'bed', value: b, ward: w, existing };
        }

        if (ep) {
            const sid = ep.id
            if (t && t !== (ep.note || '').trim()) {
                addDoc({ id: sid, name: n, hospitalNumber: h, ward: w, diagnosis: diag }, t)
            }
            if (ep.reason === 'mortality') {
                setMortalities(prev => prev.map(p =>
                    p.id === sid
                        ? { ...p, name: n, hospitalNumber: h, ward: w, bed: b, note: t, critical: c, admissionDate, diagnosis: diag }
                        : p
                ))
            } else {
                setPatients((prev) => prev.map(p =>
                    p.id === sid
                        ? { ...p, team, name: n, hospitalNumber: h, ward: w, bed: b, note: t, critical: c, admissionDate, diagnosis: diag, lastUpdated: new Date().toISOString() }
                        : p
                ))
            }
            setEditingPatient(null)
            setTimeout(() => {
                const el = document.getElementById(`patient-${sid}`)
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    el.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2')
                    setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2'), 2000)
                }
            }, 100)
            navigateBackFromUrlRoute()
        } else {
            const newId = generateId()
            if (t) addDoc({ id: newId, name: n, hospitalNumber: h, ward: w, diagnosis: diag }, t)
            setPatients((prev) => [
                ...prev,
                { id: newId, team, name: n, hospitalNumber: h, ward: w, bed: b, note: t, critical: c, admissionDate, diagnosis: diag, lastUpdated: new Date().toISOString() },
            ])
            setShowAddForm(false)
            navigateBackFromUrlRoute()
        }
        return true
    }, [patients, addDoc, navigateBackFromUrlRoute])

    const addMortality = useCallback(({ name, hospitalNumber, ward, bed, note, critical = false }) => {
        const n = name.trim()
        const h = hospitalNumber.trim()
        const w = ward.trim().toUpperCase()
        if (!w && !h && !n) return false
        const newId = generateId()
        if (note.trim()) addDoc({ id: newId, name: n, hospitalNumber: h, ward: w }, note.trim())

        const record = {
            id: newId,
            team: 'my_team',
            name: n,
            hospitalNumber: h,
            ward: w,
            bed: bed.trim(),
            note: note.trim(),
            critical: !!critical,
            reason: 'mortality',
            removedAt: new Date().toISOString(),
            originalTeam: 'my_team',
        }
        setHistory(prev => [{ patients, mortalities, discharges }, ...prev].slice(0, 5))
        setMortalities(prev => [record, ...prev])
        setShowMortalityForm(false)
        navigateBackFromUrlRoute()
        return true
    }, [patients, mortalities, discharges, addDoc, navigateBackFromUrlRoute])

    const startEditing = useCallback((patient) => {
        setEditingPatient(patient)
        pendingEditRef.current = patient
        if (location.pathname !== `/team/${activeTab}/edit`) {
            navigate(`/team/${activeTab}/edit`)
        }
    }, [navigate, activeTab, location.pathname])

    const cancelForm = useCallback(() => {
        setShowAddForm(false)
        setShowMortalityForm(false)
        setEditingPatient(null)
        navigateBackFromUrlRoute()
    }, [navigateBackFromUrlRoute])

    const toggleSelectPatient = useCallback((id) => {
        setSelectedPatientIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const toggleSelectAll = useCallback((patientIds) => {
        setSelectedPatientIds(prev => {
            if (patientIds.every(id => prev.has(id))) return new Set()
            return new Set(patientIds)
        })
    }, [])

    const clearSelection = useCallback(() => setSelectedPatientIds(new Set()), [])

    const startRemovalProcess = useCallback((id) => {
        setRemovalCandidateId(id)
    }, [])

    const deleteMortalityRecord = useCallback((id) => {
        setHistory(prev => [{ patients, mortalities, discharges }, ...prev].slice(0, 5))
        setMortalities(prev => prev.filter(p => p.id !== id))
        setShowUndoToast(true)
        setTimeout(() => setShowUndoToast(false), 5000)
    }, [patients, mortalities, discharges])

    const dischargePatient = useCallback(() => {
        if (removalCandidateId) {
            const patient = patients.find(p => p.id === removalCandidateId)
            setHistory(prev => [{ patients, mortalities, discharges }, ...prev].slice(0, 5))
            const remainingPatients = patients.filter((p) => p.id !== removalCandidateId)
            const updatedPatients = patient ? updateSuffixesAfterRemoval(remainingPatients, [patient]) : remainingPatients
            setPatients(updatedPatients)
            if (patient) {
                setDischarges(prev => [...prev, { id: removalCandidateId, team: patient.team || 'my_team', date: new Date().toISOString() }])
            }
            setRemovalCandidateId(null)
            setShowUndoToast(true)
            setTimeout(() => setShowUndoToast(false), 5000)
        }
    }, [removalCandidateId, patients, mortalities, discharges])

    const markAsMortality = useCallback(() => {
        if (removalCandidateId) {
            const deceased = patients.find(p => p.id === removalCandidateId)
            if (deceased) {
                setHistory(prev => [{ patients, mortalities, discharges }, ...prev].slice(0, 5))
                const mortalityRecord = {
                    ...deceased,
                    removedAt: new Date().toISOString(),
                    reason: 'mortality',
                    originalTeam: deceased.team || 'my_team'
                }
                setMortalities(prev => [mortalityRecord, ...prev])
                const remainingPatients = patients.filter(p => p.id !== removalCandidateId)
                const updatedPatients = updateSuffixesAfterRemoval(remainingPatients, [deceased])
                setPatients(updatedPatients)
            }
            setRemovalCandidateId(null)
            setShowUndoToast(true)
            setTimeout(() => setShowUndoToast(false), 5000)
        }
    }, [removalCandidateId, patients, mortalities, discharges])

    const toggleReview = useCallback((id, isReviewed) => {
        setPatients(prev => prev.map(p =>
            p.id === id ? { ...p, reviewed: isReviewed } : p
        ))
    }, [])

    const resetReviews = useCallback(() => {
        setPatients(prev => prev.map(p =>
            (p.team || 'my_team') === activeTab ? { ...p, reviewed: false } : p
        ))
    }, [activeTab])

    const movePatientTeam = useCallback((id, targetTeam) => {
        setHistory(prev => [{ patients, mortalities, discharges, docs }, ...prev].slice(0, 5))
        setPatients(prev => prev.map(p =>
            p.id === id ? { ...p, team: targetTeam, lastUpdated: new Date().toISOString() } : p
        ))
        setShowUndoToast(true)
        setTimeout(() => setShowUndoToast(false), 5000)
    }, [patients, mortalities, discharges, docs])

    const undo = useCallback(() => {
        if (history.length > 0) {
            const [prev, ...rest] = history
            setPatients(prev.patients)
            setMortalities(prev.mortalities)
            setDischarges(prev.discharges)
            if (prev.docs) setDocs(prev.docs)
            setHistory(rest)
            setShowUndoToast(false)
        }
    }, [history])


    const resetDischarges = useCallback(() => {
        setHistory(prev => [{ patients, mortalities, discharges }, ...prev].slice(0, 5))
        setDischarges(prev => prev.filter(d => d.team !== activeTab))
        setDischargesResetDate(new Date().toLocaleDateString())
        setShowConfirmResetStats(false)
        setShowUndoToast(true)
        setTimeout(() => setShowUndoToast(false), 5000)
    }, [activeTab, patients, mortalities, discharges])

    // Merge imported patients, deduplicate
    const importPatients = useCallback((incoming = [], incomingDocs = []) => {
        const conflicts = [];
        const newOnes = [];
        const isMortalityTab = activeTab === 'mortalities';
        const defaultTeam = isMortalityTab ? 'my_team' : activeTab;
        const oldIdToNewIdMap = {};
        // Fallback map used to link docs when the exported patient carried no
        // `id` (e.g. the "Share Code" payload omits ids). Keyed by a normalized
        // identity string so docs can still attach to the right imported patient.
        const identityToNewIdMap = {};
        const identityKey = (name, ward, hosp) => {
            const n = (name || '').trim().toLowerCase();
            const w = (ward || '').trim().toUpperCase();
            const h = (hosp || '').trim().toLowerCase();
            if (!n && !w && !h) return null;
            return `${n}|${w}|${h}`;
        };

        const actualIncoming = [];
        const actualDocs = Array.isArray(incomingDocs) ? [...incomingDocs] : [];

        if (Array.isArray(incoming)) {
            incoming.forEach(item => {
                if (item && typeof item === 'object' && !Array.isArray(item) && (item.t || item.text) && !item.b && !item.bed && item.reason === undefined && !item.hospitalNumber && !item.ward) {
                    actualDocs.push(item);
                } else {
                    actualIncoming.push(item);
                }
            });
        }

        actualIncoming.forEach(_p => {
            // Support both the ultra-compact positional array format
            // [ward, bed, name, hospNo, criticalFlag, mortalityFlag, admissionDate, note, removedAt, lastUpdated]
            // and the legacy object format ({w,b,n,h,c,m,u,ad,...}).
            let src;
            let oldId = null;
            if (Array.isArray(_p)) {
                const [w, b, n, h, cFlag, mFlag, ad, note, removedAt, lastUpdated] = _p;
                src = {
                    w, b, n, h,
                    c: cFlag === 1,
                    m: mFlag === 1,
                    ad,
                    t: note,
                    removedAt,
                    u: lastUpdated,
                };
            } else {
                src = _p;
                oldId = _p.id;
            }

            const isMortalityRecord = !!(
                src.m ||
                src.reason === 'mortality' ||
                isMortalityTab
            );
            const generatedId = generateId();
            const p = {
                id: generatedId,
                team: src.team || defaultTeam,
                name: (src.n || src.name || '').trim(),
                hospitalNumber: (src.h || src.hospitalNumber || '').trim(),
                ward: (src.w || src.ward || '').trim().toUpperCase(),
                bed: (src.b || src.bed || '').trim(),
                note: (src.t || src.note || '').trim(),
                critical: !!(src.c || src.critical),
                reason: isMortalityRecord ? 'mortality' : undefined,
                admissionDate: src.ad || src.admissionDate || new Date().toISOString().split('T')[0],
                lastUpdated: src.u || src.lastUpdated || (isMortalityRecord ? undefined : new Date().toISOString()),
                removedAt: src.removedAt || (isMortalityRecord ? new Date().toISOString() : undefined),
                originalTeam: src.originalTeam || defaultTeam,
            };
            if (!p.name && !p.hospitalNumber && !p.ward) return;

            if (oldId) {
                oldIdToNewIdMap[oldId] = generatedId;
            }
            // Always record an identity-based mapping so docs can be linked
            // even when the exported patient carried no `id`.
            const pKey = identityKey(p.name, p.ward, p.hospitalNumber);
            if (pKey) {
                identityToNewIdMap[pKey] = generatedId;
            }

            let existingMatch = null;
            const duplicateFields = [];
            if (p.hospitalNumber) {
                existingMatch = patients.find(ex => ex.hospitalNumber === p.hospitalNumber) ||
                    mortalities.find(ex => ex.hospitalNumber === p.hospitalNumber);
                if (existingMatch) duplicateFields.push('hospitalNumber');
                // Also check for bed duplicate (ward + bed combo) so that when both
                // hospital number and bed are duplicates, suffixes are added to both.
                if (p.ward && p.bed) {
                    const bedMatch = patients.find(ex => ex.ward === p.ward && ex.bed === p.bed);
                    if (bedMatch) {
                        duplicateFields.push('bed');
                        if (!existingMatch) existingMatch = bedMatch;
                    }
                }
            } else {
                const key = `${p.name}|${p.ward}|${p.bed}`;
                existingMatch = patients.find(ex => `${ex.name}|${ex.ward}|${ex.bed}` === key);
                if (existingMatch) {
                    if (p.name) duplicateFields.push('name');
                    if (p.ward) duplicateFields.push('ward');
                    if (p.bed) duplicateFields.push('bed');
                }
            }

            if (existingMatch) {
                conflicts.push({ imported: p, existing: existingMatch, oldId, duplicateFields });
            } else {
                newOnes.push(p);
            }
        });

        if (conflicts.length > 0) {
            setPendingImport({ conflicts, newOnes, incomingDocs: actualDocs, oldIdToNewIdMap, identityToNewIdMap });
            setShowScanner(false);
            return false;
        } else {
            const incomingMortalities = newOnes.filter(p => p.reason === 'mortality');
            const incomingActive = newOnes.filter(p => p.reason !== 'mortality');

            if (incomingActive.length > 0) setPatients(prev => [...prev, ...incomingActive]);
            if (incomingMortalities.length > 0) {
                setHistory(prev => [{ patients, mortalities, discharges }, ...prev].slice(0, 5));
                setMortalities(prev => [...prev, ...incomingMortalities]);
            }

            if (actualDocs && actualDocs.length > 0) {
                setDocs(prev => {
                    const nextDocs = [...prev];
                    actualDocs.forEach(_d => {
                        let d;
                        if (Array.isArray(_d)) {
                            const [id, color, diagnosis, patientName, patientWard, patientHosp, text, createdAt, updatedAt, patientId] = _d;
                            d = { id, color, diagnosis, patientName, patientWard, patientHosp, text, createdAt, updatedAt, patientId };
                        } else {
                            d = _d;
                        }
                        const docName = (d.n || d.patientName || '').trim();
                        const docWard = (d.w || d.patientWard || '').trim();
                        const docHosp = (d.h || d.patientHosp || '').trim();
                        const docText = (d.t || d.text || '').trim();
                        const docDiag = (d.diagnosis || d.patientDiagnosis || '').trim();

                        if (!docText) return;

                        const docKey = identityKey(docName, docWard, docHosp);

                        let newPatientId = null;
                        if (d.patientId && oldIdToNewIdMap[d.patientId]) {
                            newPatientId = oldIdToNewIdMap[d.patientId];
                        } else if (docKey && identityToNewIdMap[docKey]) {
                            newPatientId = identityToNewIdMap[docKey];
                        } else if (docHosp) {
                            const match = patients.find(ex => ex.hospitalNumber === docHosp) ||
                                          mortalities.find(ex => ex.hospitalNumber === docHosp);
                            if (match) newPatientId = match.id;
                        } else if (docName && docWard) {
                            const match = patients.find(ex => ex.name?.trim().toLowerCase() === docName.toLowerCase() && ex.ward?.trim().toUpperCase() === docWard.toUpperCase()) ||
                                          mortalities.find(ex => ex.name?.trim().toLowerCase() === docName.toLowerCase() && ex.ward?.trim().toUpperCase() === docWard.toUpperCase());
                            if (match) newPatientId = match.id;
                        }

                        const isDuplicate = nextDocs.some(ex =>
                            ex.text.trim() === docText &&
                            (ex.diagnosis || '').trim() === docDiag &&
                            (ex.patientName || '').trim() === docName &&
                            (ex.patientHosp || '').trim() === docHosp
                        );

                        if (!isDuplicate) {
                            nextDocs.unshift({
                                id: d.id || generateId(),
                                patientId: newPatientId,
                                patientName: docName,
                                patientWard: docWard,
                                patientHosp: docHosp,
                                diagnosis: docDiag,
                                patientDiagnosis: docDiag,
                                text: docText,
                                color: d.c || d.color || 'blue',
                                createdAt: d.ca || d.createdAt || new Date().toISOString(),
                                updatedAt: d.ua || d.updatedAt || new Date().toISOString(),
                            });
                        }
                    });
                    return nextDocs;
                });
            }
            return true;
        }
    }, [activeTab, patients, mortalities, discharges])

    const resolveImport = useCallback((resolvedConflicts, newOnes) => {
        setHistory(prev => [{ patients, mortalities, discharges }, ...prev].slice(0, 5))

        const toAddActive = [...newOnes.filter(p => p.reason !== 'mortality')];
        const toAddMortality = [...newOnes.filter(p => p.reason === 'mortality')];

        let nextPatients = [...patients];
        let nextMortalities = [...mortalities];

        const addedOrUpdatedIds = new Set(newOnes.map(p => p.id));
        const finalMap = { ...(pendingImport?.oldIdToNewIdMap || {}) };
        const identityMap = { ...(pendingImport?.identityToNewIdMap || {}) };
        const identityKey = (name, ward, hosp) => {
            const n = (name || '').trim().toLowerCase();
            const w = (ward || '').trim().toUpperCase();
            const h = (hosp || '').trim().toLowerCase();
            if (!n && !w && !h) return null;
            return `${n}|${w}|${h}`;
        };

        resolvedConflicts.forEach(res => {
            const p = res.imported;
            const oldId = res.oldId;
            if (res.action === 'skip') return;

            if (res.action === 'new') {
                // Add counter suffix to duplicated fields before adding as new
                const dupFields = res.duplicateFields || [];
                const cleanP = { ...p };
                dupFields.forEach(field => {
                    if (field === 'hospitalNumber' && cleanP.hospitalNumber) {
                        const allPatients = [...patients, ...mortalities, ...toAddActive, ...toAddMortality];
                        cleanP.hospitalNumber = generateUniqueValue(allPatients, 'hospitalNumber', cleanP.hospitalNumber);
                    } else if (field === 'bed' && cleanP.bed && cleanP.ward) {
                        const allPatients = [...patients, ...toAddActive];
                        cleanP.bed = generateUniqueValue(allPatients, 'bed', cleanP.bed, cleanP.ward);
                    }
                });
                addedOrUpdatedIds.add(cleanP.id);
                const pKey = identityKey(cleanP.name, cleanP.ward, cleanP.hospitalNumber);
                if (pKey) identityMap[pKey] = cleanP.id;
                if (cleanP.reason === 'mortality') toAddMortality.push(cleanP);
                else toAddActive.push(cleanP);
            } else if (res.action === 'update') {
                addedOrUpdatedIds.add(res.existing.id);
                const pKey = identityKey(p.name, p.ward, p.hospitalNumber);
                if (pKey) identityMap[pKey] = res.existing.id;
                if (oldId) {
                    finalMap[oldId] = res.existing.id;
                }
                const activeIdx = nextPatients.findIndex(ex => ex.id === res.existing.id);
                const mortIdx = nextMortalities.findIndex(ex => ex.id === res.existing.id);

                if (p.reason === 'mortality') {
                    if (activeIdx !== -1) nextPatients.splice(activeIdx, 1);
                    if (mortIdx !== -1) nextMortalities[mortIdx] = { ...nextMortalities[mortIdx], ...p, id: res.existing.id };
                    else toAddMortality.push(p);
                } else {
                    if (mortIdx !== -1) nextMortalities.splice(mortIdx, 1);
                    if (activeIdx !== -1) nextPatients[activeIdx] = { ...nextPatients[activeIdx], ...p, id: res.existing.id };
                    else toAddActive.push(p);
                }
            }
        });

        setPatients([...nextPatients, ...toAddActive]);
        setMortalities([...nextMortalities, ...toAddMortality]);

        // Process incoming docs if any exist
        const incomingDocs = pendingImport?.incomingDocs;
        if (incomingDocs && incomingDocs.length > 0) {
            setDocs(prev => {
                const nextDocs = [...prev];
                incomingDocs.forEach(_d => {
                    let d;
                    if (Array.isArray(_d)) {
                        const [id, color, diagnosis, patientName, patientWard, patientHosp, text, createdAt, updatedAt, patientId] = _d;
                        d = { id, color, diagnosis, patientName, patientWard, patientHosp, text, createdAt, updatedAt, patientId };
                    } else {
                        d = _d;
                    }
                    const docName = (d.n || d.patientName || '').trim();
                    const docWard = (d.w || d.patientWard || '').trim();
                    const docHosp = (d.h || d.patientHosp || '').trim();
                    const docText = (d.t || d.text || '').trim();
                    const docDiag = (d.diagnosis || d.patientDiagnosis || '').trim();

                    if (!docText) return;

                    const docKey = identityKey(docName, docWard, docHosp);

                    let newPatientId = null;
                    if (d.patientId && finalMap[d.patientId]) {
                        newPatientId = finalMap[d.patientId];
                    } else if (docKey && identityMap[docKey]) {
                        newPatientId = identityMap[docKey];
                    } else if (docHosp) {
                        const match = nextPatients.find(ex => ex.hospitalNumber === docHosp) ||
                                      nextMortalities.find(ex => ex.hospitalNumber === docHosp);
                        if (match) newPatientId = match.id;
                    } else if (docName && docWard) {
                        const match = nextPatients.find(ex => ex.name?.trim().toLowerCase() === docName.toLowerCase() && ex.ward?.trim().toUpperCase() === docWard.toUpperCase()) ||
                                      nextMortalities.find(ex => ex.name?.trim().toLowerCase() === docName.toLowerCase() && ex.ward?.trim().toUpperCase() === docWard.toUpperCase());
                        if (match) newPatientId = match.id;
                    }

                    const isDuplicate = nextDocs.some(ex =>
                        ex.text.trim() === docText &&
                        (ex.diagnosis || '').trim() === docDiag &&
                        (ex.patientName || '').trim() === docName &&
                        (ex.patientHosp || '').trim() === docHosp
                    );

                    if (!isDuplicate) {
                        nextDocs.unshift({
                            id: d.id || generateId(),
                            patientId: newPatientId,
                            patientName: docName,
                            patientWard: docWard,
                            patientHosp: docHosp,
                            diagnosis: docDiag,
                            patientDiagnosis: docDiag,
                            text: docText,
                            color: d.c || d.color || 'blue',
                            createdAt: d.ca || d.createdAt || new Date().toISOString(),
                            updatedAt: d.ua || d.updatedAt || new Date().toISOString(),
                        });
                    }
                });
                return nextDocs;
            });
        }

        setPendingImport(null);
    }, [patients, mortalities, discharges, pendingImport]);

    const activePatients = useMemo(() => {
        if (activeTab === 'mortalities' || mortalitiesOnly) return mortalities
        return patients.filter(p => (p.team || 'my_team') === activeTab)
    }, [activeTab, patients, mortalities, mortalitiesOnly])

    const lookupPatient = useCallback((hospitalNumber) => {
        const found = activePatients.find(p => p.hospitalNumber === hospitalNumber)
        if (found) {
            setTimeout(() => {
                const el = document.getElementById(`patient-${found.id}`)
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    el.classList.add('ring-2', 'ring-purple-400', 'ring-offset-2')
                    setTimeout(() => el.classList.remove('ring-2', 'ring-purple-400', 'ring-offset-2'), 3000)
                }
            }, 100)
            return found
        }
        // Not found - open add form with hospital number pre-filled
        setShowAddForm(true)
        setEditingPatient({ hospitalNumber })
        return null
    }, [activePatients])

    const counts = useMemo(() => {
        let myTeam = 0, otherTeam = 0
        for (let i = 0; i < patients.length; i++) {
            if ((patients[i].team || 'my_team') === 'my_team') myTeam++
            else if (patients[i].team === 'other_team') otherTeam++
        }
        let myDischarges = 0, otherDischarges = 0
        for (let i = 0; i < discharges.length; i++) {
            if ((discharges[i].team || 'my_team') === 'my_team') myDischarges++
            else if (discharges[i].team === 'other_team') otherDischarges++
        }
        return { myTeam, otherTeam, myDischarges, otherDischarges }
    }, [patients, discharges])

    const myTeamCount = counts.myTeam
    const otherTeamCount = counts.otherTeam
    const mortalitiesCount = mortalities.length
    const dischargeCount = counts.myDischarges
    const otherDischargeCount = counts.otherDischarges

    const listName = mortalitiesOnly ? 'Mortalities' : activeTab === 'my_team' ? 'My Team' : activeTab === 'other_team' ? 'On Call' : 'Mortalities'

    const patientsToExport = useMemo(() => {
        return selectedPatientIds.size > 0
            ? activePatients.filter(p => selectedPatientIds.has(p.id))
            : activePatients
    }, [selectedPatientIds, activePatients])

    const navigateToPatient = useCallback((patientId, highlightField, highlightQuery, targetTeam) => {
        setMortalitiesOnly(false)
        // Determine target tab based on patient team
        let targetTab = activeTab
        if (targetTeam === 'mortalities') {
            targetTab = 'mortalities'
        } else if (targetTeam === 'other_team') {
            targetTab = 'other_team'
        } else if (targetTeam === 'my_team') {
            targetTab = 'my_team'
        }

        // Navigate to correct tab if needed
        if (activeTab !== targetTab || activePage !== 'patients') {
            navigate(targetTab === 'mortalities' ? '/mortalities' : `/team/${targetTab}`)
        }

        // Store highlight info & auto-open patient detail modal for search result
        setSearchHighlightField(highlightField)
        setSearchHighlightQuery(highlightQuery)
        setInitialSelectedPatientId(patientId)

        // Find the patient and check if they are reviewed
        const allPatients = [...patients, ...mortalities]
        const found = allPatients.find(p => p.id === patientId)
        if (found && found.reviewed && targetTab !== 'mortalities') {
            // Expand the reviewed section so the patient card is in the DOM
            setReviewedExpandTrigger(prev => prev + 1)
        }

        // Scroll to the patient and apply persistent ring highlight
        setTimeout(() => {
            const el = document.getElementById(`patient-${patientId}`)
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })

                // Remove existing rings
                document.querySelectorAll('.search-ring-active').forEach(prev => {
                    prev.classList.remove('ring-2', 'ring-purple-400', 'ring-offset-2', 'search-ring-active')
                })
                el.classList.add('ring-2', 'ring-purple-400', 'ring-offset-2', 'search-ring-active')

                const removeRing = () => {
                    if (document.querySelector('.modal-backdrop')) return
                    el.classList.remove('ring-2', 'ring-purple-400', 'ring-offset-2', 'search-ring-active')
                    window.removeEventListener('scroll', removeRing, { capture: true, passive: true })
                    window.removeEventListener('click', removeRing, { capture: true })
                    window.removeEventListener('touchstart', removeRing, { capture: true, passive: true })
                }

                setTimeout(() => {
                    window.addEventListener('scroll', removeRing, { capture: true, passive: true })
                    window.addEventListener('click', removeRing, { capture: true })
                    window.addEventListener('touchstart', removeRing, { capture: true, passive: true })
                }, 400)
            }
        }, found && found.reviewed && targetTab !== 'mortalities' ? 400 : 300)
    }, [activePage, activeTab, navigate, patients, mortalities, setReviewedExpandTrigger])

    const navigateToNote = useCallback((noteId, highlightQuery) => {
        setMortalitiesOnly(false)
        // Navigate to notebook page
        if (activePage !== 'notebook') {
            navigate('/notebook')
        }
        setInitialSelectedDocId(noteId)
        setNotebookSearchHighlight(highlightQuery)
        // Scroll to the note card and add purple ring (mirrors patient search behavior)
        const found = docs.find(d => d.id === noteId)
        if (found) {
            setTimeout(() => {
                const el = document.getElementById(`note-card-${noteId}`)
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

                    document.querySelectorAll('.search-ring-active').forEach(prev => {
                        prev.classList.remove('ring-2', 'ring-purple-400', 'ring-offset-2', 'search-ring-active')
                    })
                    el.classList.add('ring-2', 'ring-purple-400', 'ring-offset-2', 'search-ring-active')

                    const removeRing = () => {
                        if (document.querySelector('.modal-backdrop')) return
                        el.classList.remove('ring-2', 'ring-purple-400', 'ring-offset-2', 'search-ring-active')
                        window.removeEventListener('scroll', removeRing, { capture: true, passive: true })
                        window.removeEventListener('click', removeRing, { capture: true })
                        window.removeEventListener('touchstart', removeRing, { capture: true, passive: true })
                    }

                    setTimeout(() => {
                        window.addEventListener('scroll', removeRing, { capture: true, passive: true })
                        window.addEventListener('click', removeRing, { capture: true })
                        window.addEventListener('touchstart', removeRing, { capture: true, passive: true })
                    }, 400)
                }
            }, 300)
        }
    }, [activePage, navigate, docs])

    const handleNotebookStartEdit = useCallback((doc) => {
        setNotebookEditDoc(doc)
    }, [])

    const handleNotebookCancelEdit = useCallback(() => {
        setNotebookEditDoc(null)
        navigate('/notebook')
    }, [navigate])

    const handleNotebookDocOpened = useCallback(() => {
        setInitialSelectedDocId(null)
        setNotebookSearchHighlight('')
    }, [])

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <SearchProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
                <Header
                    patientCount={patients.length}
                    docCount={docs.length}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    onOpenSettings={() => navigate('/settings')}
                    activePage={activePage}
                    onPageChange={goToPage}
                    onOpenSearch={() => {
                        searchReturnPathRef.current = location.pathname
                        navigate('/search')
                    }}
                    onHome={onHome}
                    onBackFromSearch={() => navigate(searchReturnPathRef.current || '/team/my_team')}
                    theme={activePage === 'patients' && (activeTab === 'mortalities' || mortalitiesOnly) ? 'red' : 'blue'}
                />

                {showDemoBanner && (
                    <DemoBanner
                        onStartDemo={() => navigate('/demo')}
                        onSkip={handleSkipDemoBanner}
                    />
                )}

            {/* Notebook Page */}
            {activePage === 'notebook' && (
                <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                    <NotebookPage
                        docs={docs}
                        onUpdateDoc={updateDoc}
                        onDeleteDoc={deleteDoc}
                        addDoc={addDoc}
                        addStandaloneDoc={addStandaloneDoc}
                        initialEditDoc={notebookEditDoc}
                        onStartEdit={handleNotebookStartEdit}
                        onCancelEdit={handleNotebookCancelEdit}
                        navigate={navigate}
                        initialSelectedDocId={initialSelectedDocId}
                        searchHighlight={notebookSearchHighlight}
                        onDocOpened={handleNotebookDocOpened}
                        onImport={() => {
                            setShowScanner(true)
                            navigate('/notebook/receive')
                        }}
                        onHandover={(selectedIds) => {
                            if (selectedIds && selectedIds.length > 0) {
                                const selectedDocs = docs.filter(d => selectedIds.includes(d.id))
                                setNotebookExportDocs(selectedDocs)
                            } else {
                                setNotebookExportDocs(null)
                            }
                            setShowExport(true)
                            navigate('/notebook/handover')
                        }}
                    />
                </Suspense>
            )}

            {/* Search Page */}
            {activePage === 'search' && (
                <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                    <SearchResultsPage
                        patients={patients}
                        mortalities={mortalities}
                        docs={docs}
                        onBack={() => navigate(searchReturnPathRef.current || '/team/my_team')}
                        onEditPatient={startEditing}
                        onDeletePatient={startRemovalProcess}
                        onReviewPatient={toggleReview}
                        onDocumentPatient={(patient) => setComposingFor(patient)}
                        getDocCount={getDocCount}
                        onDeleteMortality={deleteMortalityRecord}
                        onUpdateDoc={updateDoc}
                        onDeleteDoc={deleteDoc}
                        onStartEditDoc={handleNotebookStartEdit}
                        navigate={navigate}
                    />
                </Suspense>
            )}

            {activePage === 'patients' && (
                <main
                    className="flex-1 w-full max-w-2xl mx-auto px-4 pt-2 pb-24"
                    onClick={() => {
                        if (selectedPatientIds.size > 0) {
                            setSelectedPatientIds(new Set())
                        }
                    }}
                >
                    {showMortalityForm ? (
                        <AddPatientForm
                            initialData={null}
                            initialTeam={activeTab}
                            isMortalityMode
                            onAdd={addMortality}
                            onCancel={cancelForm}
                            patients={patients}
                        />
                    ) : (showAddForm || editingPatient) ? (
                        <AddPatientForm
                            initialData={editingPatient}
                            initialTeam={activeTab}
                            onAdd={savePatient}
                            onCancel={cancelForm}
                            isMortalityMode={editingPatient?.reason === 'mortality'}
                            patients={patients}
                        />
                    ) : null}

                    {/* Tabs */}
                    {!showAddForm && !editingPatient && !showMortalityForm && !mortalitiesOnly && activeTab !== 'mortalities' && (
                        <div id="tour-team-tabs" className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                            <button
                                onClick={() => goToTab('my_team')}
                                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'my_team' ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                My Team
                                <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'my_team' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                    {myTeamCount}
                                </span>
                            </button>
                            <button
                                onClick={() => goToTab('other_team')}
                                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'other_team' ? 'border-purple-600 text-purple-700 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                On Call
                                <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'other_team' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                    {otherTeamCount}
                                </span>
                            </button>
                        </div>
                    )}

                    {(activeTab === 'mortalities' || mortalitiesOnly) ? (
                        <div className="mt-2">
                            <div className="flex items-center gap-2 mb-4">
                                <button
                                    onClick={onHome}
                                    className="flex items-center gap-1 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                    aria-label="Back to main page"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 12H5M12 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>
                            </div>
                            {mortalities.length === 0 ? (
                                <div className="text-center py-12 px-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="bg-gray-50 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                            <path d="M12 2v20" /><path d="m17 7-5-5-5 5" /><path d="m17 17-5 5-5-5" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No mortality records</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-[240px] mx-auto text-sm">Archived mortality records will appear here.</p>
                                </div>
                            ) : (
                                <PatientList
                                    patients={mortalities}
                                    onEdit={startEditing}
                                    onDelete={deleteMortalityRecord}
                                    onReview={null}
                                    onResetReviews={() => { }}
                                    selectedIds={selectedPatientIds}
                                    onToggleSelect={toggleSelectPatient}
                                    onToggleSelectAll={toggleSelectAll}
                                    isMortality
                                    reviewedExpandTrigger={reviewedExpandTrigger}
                                    onReviewedExpanded={() => setReviewedExpandTrigger(prev => prev + 1)}
                                    initialSelectedPatientId={initialSelectedPatientId}
                                    onPatientOpened={() => setInitialSelectedPatientId(null)}
                                />
                            )}
                        </div>
                    ) : activePatients.length === 0 ? (
                        <EmptyState onAddClick={() => navigate(`/team/${activeTab}/add`)} />
                    ) : (
                        <PatientList
                            patients={activePatients}
                            onEdit={startEditing}
                            onDelete={startRemovalProcess}
                            onReview={toggleReview}
                            onResetReviews={resetReviews}
                            onDocument={(patient) => setComposingFor(patient)}
                            getDocCount={getDocCount}
                            selectedIds={selectedPatientIds}
                            onToggleSelect={toggleSelectPatient}
                            onToggleSelectAll={toggleSelectAll}
                            onMoveTeam={activeTab === 'other_team' ? (id) => movePatientTeam(id, 'my_team') : undefined}
                            moveTeamLabel={activeTab === 'other_team' ? 'Move to My Team' : undefined}
                            highlightField={searchHighlightField}
                            highlightQuery={searchHighlightQuery}
                            reviewedExpandTrigger={reviewedExpandTrigger}
                            onReviewedExpanded={() => setReviewedExpandTrigger(prev => prev + 1)}
                            initialSelectedPatientId={initialSelectedPatientId}
                            onPatientOpened={() => setInitialSelectedPatientId(null)}
                        />
                    )}

                    {activeTab === 'my_team' && (
                        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 text-center flex flex-col items-center gap-2 mb-8">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest italic">
                                {dischargeCount} patient{dischargeCount !== 1 ? 's' : ''} discharges since {dischargesResetDate}
                            </p>
                            <button
                                onClick={() => setShowConfirmResetStats(true)}
                                className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 uppercase tracking-tighter"
                            >
                                Reset Stats
                            </button>
                        </div>
                    )}
                    {activeTab === 'other_team' && (
                        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 text-center flex flex-col items-center gap-2 mb-8">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest italic">
                                {otherDischargeCount} patient{otherDischargeCount !== 1 ? 's' : ''} discharges since {dischargesResetDate}
                            </p>
                            <button
                                onClick={() => setShowConfirmResetStats(true)}
                                className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 uppercase tracking-tighter"
                            >
                                Reset Stats
                            </button>
                        </div>
                    )}
                </main>
            )}


            {/* Bottom Action Bar — Tracker Page */}
            {activePage === 'patients' && !showAddForm && !editingPatient && !showMortalityForm && (
                <PatientActionBar
                    isMortality={activeTab === 'mortalities' || mortalitiesOnly}
                    onAdd={() => {
                        if (activeTab === 'mortalities' || mortalitiesOnly) setShowMortalityForm(true)
                        else setShowAddForm(true)
                        navigate(`/team/${activeTab}/add`)
                    }}
                    onImport={() => {
                        setShowScanner(true)
                        navigate(`/team/${activeTab}/receive`)
                    }}
                    onHandover={() => {
                        setShowExport(true)
                        navigate(`/team/${activeTab}/handover`)
                    }}
                    handoverBadge={selectedPatientIds.size > 0 ? selectedPatientIds.size : null}
                    handoverDisabled={activePatients.length === 0}
                />
            )}

            {/* Modals */}
            <Suspense fallback={null}>
                {showExport && (
                    <ExportModal
                        patients={activePage === 'notebook' ? [] : patientsToExport}
                        allPatients={activePage === 'notebook' ? [] : activePatients}
                        listName={activePage === 'notebook' ? 'Notebook' : listName}
                        selectionCount={activePage === 'notebook' ? (notebookExportDocs ? notebookExportDocs.length : 0) : selectedPatientIds.size}
                        onClose={() => { setShowExport(false); setNotebookExportDocs(null); clearSelection(); navigateBackFromUrlRoute() }}
                        mortalities={activePage === 'notebook' ? [] : mortalities}
                        discharges={activePage === 'notebook' ? [] : discharges}
                        dischargesResetDate={dischargesResetDate}
                        docs={activePage === 'notebook' ? (notebookExportDocs || docs) : docs}
                    />
                )}
                {showScanner && (
                    <ScannerComponent
                        listName={activePage === 'notebook' ? 'Notebook' : listName}
                        onImport={importPatients}
                        onLookup={lookupPatient}
                        onRestore={restoreFromBackup}
                        onClose={() => { setShowScanner(false); navigateBackFromUrlRoute() }}
                        onImportComplete={() => setShowExport(false)}
                    />
                )}
                {pendingImport && (
                    <ReviewDuplicatesModal
                        pendingImport={pendingImport}
                        onResolve={resolveImport}
                        onCancel={() => setPendingImport(null)}
                    />
                )}
                {showSettings && (
                    <SettingsModal
                        onClose={() => { setShowSettings(false); navigateBackFromUrlRoute(); }}
                        textSize={textSize}
                        onDecreaseText={decreaseTextSize}
                        onIncreaseText={increaseTextSize}
                        onClearRequest={handleClearRequest}
                        onSaveBackup={handleSaveBackup}
                        onRestoreBackup={restoreFromBackup}
                        onViewMortalities={() => { setShowSettings(false); navigate('/mortalities'); }}
                        hasMyTeamPatients={patients.some(p => p.team === 'my_team')}
                        hasOnCallPatients={patients.some(p => p.team === 'other_team')}
                        hasMortalities={mortalities.length > 0}
                        hasDocs={docs.length > 0}
                        hasAnyData={patients.length > 0 || mortalities.length > 0 || docs.length > 0 || discharges.length > 0}
                        onStartDemo={() => { setShowSettings(false); navigate('/demo'); }}
                    />
                )}

                {showDemoModal && (
                    <InteractiveSpotlightTour
                        onClose={() => { setShowDemoModal(false); navigateBackFromUrlRoute(); }}
                    />
                )}

                {composingFor && (
                    <DocComposer
                        patient={composingFor}
                        onSave={({ text, color }) => addDoc(composingFor, text, color)}
                        onClose={() => setComposingFor(null)}
                    />
                )}
            </Suspense>
            {showConfirmResetStats && (
                <ConfirmDialog
                    title="Reset Discharge Stats?"
                    message={`This will reset the discharge count for ${listName} and update the start date to today. This can be undone.`}
                    confirmLabel="Yes, Reset"
                    onConfirm={resetDischarges}
                    onCancel={() => setShowConfirmResetStats(false)}
                />
            )}
            {removalCandidateId && (
                <RemovalChoiceDialog
                    patientName={patients.find(p => p.id === removalCandidateId)?.name || 'this patient'}
                    onDischarge={dischargePatient}
                    onMortality={markAsMortality}
                    onCancel={() => setRemovalCandidateId(null)}
                />
            )}

            {pendingClearAction && (
                <ConfirmDialog
                    title={`Clear ${pendingClearAction === 'my_team' ? 'My Team' : pendingClearAction === 'on_call' ? 'On Call' : pendingClearAction === 'mortalities' ? 'Mortalities' : 'Notebook'}?`}
                    message={`This will permanently remove all ${pendingClearAction === 'my_team' ? 'My Team' : pendingClearAction === 'on_call' ? 'On Call' : pendingClearAction === 'mortalities' ? 'Mortalities' : 'Notebook'} data. This action can be undone.`}
                    confirmLabel="Yes, Clear"
                    onConfirm={confirmClear}
                    onCancel={() => setPendingClearAction(null)}
                />
            )}
            {/* Demo Skip Toast */}
            {showDemoSkipToast && (
                <div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-800 text-white px-4 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-sm border border-gray-700">
                    <span className="text-xs font-semibold">Demo skipped. You can replay it anytime from Settings ⚙️</span>
                    <button onClick={() => setShowDemoSkipToast(false)} className="text-gray-400 hover:text-white p-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /></svg>
                    </button>
                </div>
            )}
            {/* Undo Toast */}
            {showUndoToast && (
                <div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white px-4 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <span className="text-sm font-medium">Action completed.</span>
                    <button
                        onClick={undo}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider"
                    >
                        Undo
                    </button>
                    <button onClick={() => setShowUndoToast(false)} className="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /></svg>
                    </button>
                </div>
            )}

            <PrintView
                patients={patientsToExport}
                listName={listName}
            />
            </div>
        </SearchProvider>
    )
}
