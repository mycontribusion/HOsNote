import { useState, useEffect, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import Header from './components/Header'
import AddPatientForm from './components/AddPatientForm'
import PatientList from './components/PatientList'
import ExportModal from './components/ExportModal'
import ScannerComponent from './components/ScannerComponent'
import ConfirmDialog from './components/ConfirmDialog'
import EmptyState from './components/EmptyState'
import ReviewDuplicatesModal from './components/ReviewDuplicatesModal'
import RemovalChoiceDialog from './components/RemovalChoiceDialog'
import FeedbackModal from './components/FeedbackModal'
import NotebookPage from './components/NotebookPage'
import DocComposer from './components/DocComposer'
import { get, set } from 'idb-keyval'

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
                    <p className="text-xs text-gray-600 font-medium">Generated on {new Date().toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-black italic">4MyTeam</p>
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
                            <td className="font-bold">{p.ward}</td>
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
    const [activeTab, setActiveTab] = useState('my_team') // 'my_team' | 'other_team' | 'mortalities'
    const [activePage, setActivePage] = useState('patients') // 'patients' | 'notebook'
    const [isLoaded, setIsLoaded] = useState(false)
    const [patients, setPatients] = useState([])
    const [mortalities, setMortalities] = useState([])
    const [discharges, setDischarges] = useState([])
    const [docs, setDocs] = useState([])
    const [composingFor, setComposingFor] = useState(null) // patient object when DocComposer is open
    const [dischargesResetDate, setDischargesResetDate] = useState(new Date().toLocaleDateString())
    const [darkMode, setDarkMode] = useState(() => {
        try {
            const stored = localStorage.getItem(DARK_MODE_KEY)
            if (stored !== null) return JSON.parse(stored)
            return window.matchMedia('(prefers-color-scheme: dark)').matches
        } catch {
            return false
        }
    })

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
                if (migrated.length > 0) await set(DOCUMENTATION_KEY, allDocs)
                setDocs(allDocs)

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
    const [showConfirmClear, setShowConfirmClear] = useState(false)
    const [showConfirmResetStats, setShowConfirmResetStats] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [showMortalityForm, setShowMortalityForm] = useState(false)
    const [showFeedback, setShowFeedback] = useState(false)
    const [editingPatient, setEditingPatient] = useState(null)
    const [removalCandidateId, setRemovalCandidateId] = useState(null)
    const [pendingImport, setPendingImport] = useState(null)
    const [history, setHistory] = useState([]) // Stack of { patients, mortalities, discharges } objects
    const [showUndoToast, setShowUndoToast] = useState(false)
    const [selectedPatientIds, setSelectedPatientIds] = useState(new Set())

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

    const toggleDarkMode = useCallback(() => setDarkMode(prev => !prev), [])

    // Persist to IndexedDB on every change
    useEffect(() => {
        if (!isLoaded) return;
        set(STORAGE_KEY, patients).catch(console.error)
    }, [patients, isLoaded])

    useEffect(() => {
        if (!isLoaded) return;
        set(MORTALITIES_KEY, mortalities).catch(console.error)
    }, [mortalities, isLoaded])

    useEffect(() => {
        if (!isLoaded) return;
        set(DISCHARGES_KEY, discharges).catch(console.error)
        set(DISCHARGES_RESET_KEY, dischargesResetDate).catch(console.error)
    }, [discharges, dischargesResetDate, isLoaded])

    useEffect(() => {
        if (!isLoaded) return;
        set(DOCUMENTATION_KEY, docs).catch(console.error)
    }, [docs, isLoaded])

    // ── Documentation callbacks ───────────────────────────────────────────────

    const addDoc = useCallback((patient, text, color = 'blue') => {
        const entry = {
            id: generateId(),
            patientId: patient.id,
            patientName: patient.name || '',
            patientWard: patient.ward || '',
            patientHosp: patient.hospitalNumber || '',
            text: text.trim(),
            color,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        setDocs(prev => [entry, ...prev])
        setComposingFor(null)
    }, [])

    const updateDoc = useCallback((id, text, color) => {
        setDocs(prev => prev.map(d =>
            d.id === id ? { ...d, text: text.trim(), color, updatedAt: new Date().toISOString() } : d
        ))
    }, [])

    const deleteDoc = useCallback((id) => {
        setHistory(prev => [{ patients, mortalities, discharges, docs }, ...prev].slice(0, 5))
        setDocs(prev => prev.filter(d => d.id !== id))
        setShowUndoToast(true)
        setTimeout(() => setShowUndoToast(false), 5000)
    }, [patients, mortalities, discharges, docs])

    const getDocCount = useCallback((patientId) => {
        return docs.filter(d => d.patientId === patientId).length
    }, [docs])

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


    const savePatient = useCallback(({ team = 'my_team', name, hospitalNumber, ward, bed, note, critical = false, admissionDate }) => {
        const n = name.trim()
        const h = hospitalNumber.trim()
        const w = ward.trim().toUpperCase()
        const b = bed.trim()
        const t = note.trim()
        const c = !!critical

        if (!w && !h && !n) return false

        // Duplicate check: same hospital number OR same ward+bed combo
        const duplicateHosp = h && patients.some((p) => {
            if (editingPatient && p.id === editingPatient.id) return false;
            return p.hospitalNumber === h;
        });
        if (duplicateHosp) return 'duplicate_hosp';

        const duplicateBed = w && b && patients.some((p) => {
            if (editingPatient && p.id === editingPatient.id) return false;
            return p.ward === w && p.bed === b;
        });
        if (duplicateBed) return 'duplicate_bed';

        if (editingPatient) {
            const sid = editingPatient.id
            if (t && t !== (editingPatient.note || '').trim()) {
                addDoc({ id: sid, name: n, hospitalNumber: h, ward: w }, t)
            }
            if (editingPatient.reason === 'mortality') {
                setMortalities(prev => prev.map(p =>
                    p.id === sid
                        ? { ...p, name: n, hospitalNumber: h, ward: w, bed: b, note: t, critical: c, admissionDate }
                        : p
                ))
            } else {
                setPatients((prev) => prev.map(p =>
                    p.id === sid
                        ? { ...p, team, name: n, hospitalNumber: h, ward: w, bed: b, note: t, critical: c, admissionDate, lastUpdated: new Date().toISOString() }
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
        } else {
            const newId = generateId()
            if (t) addDoc({ id: newId, name: n, hospitalNumber: h, ward: w }, t)
            setPatients((prev) => [
                ...prev,
                { id: newId, team, name: n, hospitalNumber: h, ward: w, bed: b, note: t, critical: c, admissionDate, lastUpdated: new Date().toISOString() },
            ])
        }
        return true
    }, [patients, editingPatient])

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
        return true
    }, [patients, mortalities, discharges])

    const startEditing = useCallback((patient) => {
        setEditingPatient(patient)
        setShowAddForm(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    const cancelForm = useCallback(() => {
        setShowAddForm(false)
        setShowMortalityForm(false)
        setEditingPatient(null)
    }, [])

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
            setPatients((prev) => prev.filter((p) => p.id !== removalCandidateId))
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
                setPatients(prev => prev.filter(p => p.id !== removalCandidateId))
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

    const clearAll = useCallback(() => {
        setHistory(prev => [{ patients, mortalities, discharges }, ...prev].slice(0, 5))
        if (activeTab === 'mortalities') {
            setMortalities([])
        } else {
            setPatients(prev => prev.filter(p => (p.team || 'my_team') !== activeTab))
        }
        setShowConfirmClear(false)
        setShowUndoToast(true)
        setTimeout(() => setShowUndoToast(false), 5000)
    }, [activeTab, patients, mortalities, discharges])

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
    const importPatients = useCallback((incoming) => {
        const conflicts = [];
        const newOnes = [];
        const isMortalityTab = activeTab === 'mortalities';
        const defaultTeam = isMortalityTab ? 'my_team' : activeTab;

        incoming.forEach(_p => {
            const isMortalityRecord = !!(
                _p.m ||
                _p.reason === 'mortality' ||
                isMortalityTab
            );
            const p = {
                id: generateId(),
                team: _p.team || defaultTeam,
                name: (_p.n || _p.name || '').trim(),
                hospitalNumber: (_p.h || _p.hospitalNumber || '').trim(),
                ward: (_p.w || _p.ward || '').trim().toUpperCase(),
                bed: (_p.b || _p.bed || '').trim(),
                note: (_p.t || _p.note || '').trim(),
                critical: !!(_p.c || _p.critical),
                reason: isMortalityRecord ? 'mortality' : undefined,
                admissionDate: _p.ad || _p.admissionDate || new Date().toISOString().split('T')[0],
                lastUpdated: _p.u || _p.lastUpdated || (isMortalityRecord ? undefined : new Date().toISOString()),
                removedAt: _p.removedAt || (isMortalityRecord ? new Date().toISOString() : undefined),
                originalTeam: _p.originalTeam || defaultTeam,
            };
            if (!p.name && !p.hospitalNumber && !p.ward) return;

            let existingMatch = null;
            if (p.hospitalNumber) {
                existingMatch = patients.find(ex => ex.hospitalNumber === p.hospitalNumber) ||
                    mortalities.find(ex => ex.hospitalNumber === p.hospitalNumber);
            } else {
                const key = `${p.name}|${p.ward}|${p.bed}`;
                existingMatch = patients.find(ex => `${ex.name}|${ex.ward}|${ex.bed}` === key) ||
                    mortalities.find(ex => `${ex.name}|${ex.ward}|${ex.bed}` === key);
            }

            if (existingMatch) {
                conflicts.push({ imported: p, existing: existingMatch });
            } else {
                newOnes.push(p);
            }
        });

        if (conflicts.length > 0) {
            setPendingImport({ conflicts, newOnes });
        } else {
            const incomingMortalities = newOnes.filter(p => p.reason === 'mortality');
            const incomingActive = newOnes.filter(p => p.reason !== 'mortality');

            if (incomingActive.length > 0) setPatients(prev => [...prev, ...incomingActive]);
            if (incomingMortalities.length > 0) {
                setHistory(prev => [{ patients, mortalities, discharges }, ...prev].slice(0, 5));
                setMortalities(prev => [...prev, ...incomingMortalities]);
            }
        }
        setShowScanner(false);
    }, [activeTab, patients, mortalities, discharges])

    const resolveImport = useCallback((resolvedConflicts, newOnes) => {
        setHistory(prev => [{ patients, mortalities, discharges }, ...prev].slice(0, 5))

        const toAddActive = [...newOnes.filter(p => p.reason !== 'mortality')];
        const toAddMortality = [...newOnes.filter(p => p.reason === 'mortality')];

        let nextPatients = [...patients];
        let nextMortalities = [...mortalities];

        resolvedConflicts.forEach(res => {
            const p = res.imported;
            if (res.action === 'skip') return;

            if (res.action === 'new') {
                if (p.reason === 'mortality') toAddMortality.push(p);
                else toAddActive.push(p);
            } else if (res.action === 'update') {
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
        setPendingImport(null);
    }, [patients, mortalities]);

    const activePatients = activeTab === 'mortalities'
        ? mortalities
        : patients.filter(p => (p.team || 'my_team') === activeTab)

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

    const myTeamCount = patients.filter(p => (p.team || 'my_team') === 'my_team').length
    const otherTeamCount = patients.filter(p => p.team === 'other_team').length
    const mortalitiesCount = mortalities.length
    const dischargeCount = discharges.filter(d => d.team === 'my_team').length
    const otherDischargeCount = discharges.filter(d => d.team === 'other_team').length

    const listName = activeTab === 'my_team' ? 'My Team' : activeTab === 'other_team' ? 'On Call' : 'Mortalities'

    const patientsToExport = selectedPatientIds.size > 0
        ? activePatients.filter(p => selectedPatientIds.has(p.id))
        : activePatients

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
            <Header
                patientCount={patients.length}
                docCount={docs.length}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                onFeedback={() => setShowFeedback(true)}
                activePage={activePage}
                onPageChange={setActivePage}
            />

            {/* Notebook Page */}
            {activePage === 'notebook' && (
                <NotebookPage
                    docs={docs}
                    onUpdateDoc={updateDoc}
                    onDeleteDoc={deleteDoc}
                />
            )}

            {/* Patients Page */}
            {activePage === 'patients' && (
            <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-6 pb-20">
                {!showAddForm && !editingPatient && !showMortalityForm ? (
                    activeTab === 'mortalities' ? (
                        <button
                            className="btn-danger w-full shadow-md mb-6 py-4 text-base"
                            onClick={() => setShowMortalityForm(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                            Add Mortality Record
                        </button>
                    ) : (
                        <button
                            className="btn-primary w-full shadow-md mb-6 py-4 text-base"
                            onClick={() => setShowAddForm(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                            Add New Patient
                        </button>
                    )
                ) : showMortalityForm ? (
                    <AddPatientForm
                        initialData={null}
                        initialTeam="my_team"
                        isMortalityMode
                        onAdd={addMortality}
                        onCancel={cancelForm}
                    />
                ) : (
                    <AddPatientForm
                        initialData={editingPatient}
                        initialTeam={activeTab === 'mortalities' ? 'my_team' : activeTab}
                        onAdd={savePatient}
                        onCancel={cancelForm}
                        isMortalityMode={editingPatient?.reason === 'mortality'}
                    />
                )}

                {/* Tabs */}
                {!showAddForm && !editingPatient && !showMortalityForm && (
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 mt-2">
                        <button
                            onClick={() => setActiveTab('my_team')}
                            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'my_team' ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            My Team
                            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'my_team' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                {myTeamCount}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('other_team')}
                            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'other_team' ? 'border-purple-600 text-purple-700 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            On Call
                            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'other_team' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                {otherTeamCount}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('mortalities')}
                            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'mortalities' ? 'border-red-600 text-red-700 dark:text-red-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            Mortalities
                            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'mortalities' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                {mortalitiesCount}
                            </span>
                        </button>
                    </div>
                )}

                {activeTab === 'mortalities' ? (
                    mortalities.length === 0 ? (
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
                        />
                    )
                ) : activePatients.length === 0 ? (
                    <EmptyState onAddClick={() => setShowAddForm(true)} />
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
                    />
                )}

                {activeTab === 'my_team' && (
                    <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 text-center flex flex-col items-center gap-2">
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
                    <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 text-center flex flex-col items-center gap-2">
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
            )} {/* end activePage === 'patients' */}

            {/* Bottom action bar — Patients page only */}
            {activePage === 'patients' && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t border-gray-200 dark:border-gray-700 shadow-lg z-40 transition-colors duration-300">
                <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2 justify-between items-center">
                    {/* Clear All */}
                    <button
                        id="btn-clear-all"
                        className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-200 p-2 sm:px-3 rounded-xl transition-colors min-w-0"
                        onClick={() => activePatients.length > 0 && setShowConfirmClear(true)}
                        disabled={activePatients.length === 0}
                        aria-label={`Clear ${listName}`}
                        title={`Clear ${listName}`}
                    >
                        <Trash2 size={20} className="flex-shrink-0" />
                        <span className="text-sm font-bold uppercase tracking-tight truncate">
                            {listName}
                        </span>
                    </button>

                    <div className="flex gap-2 flex-shrink-0">
                        {/* Import / Scan */}
                        <button
                            id="btn-import"
                            className="btn-secondary text-sm"
                            onClick={() => setShowScanner(true)}
                            aria-label="Import patient list by scanning QR code"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden sm:inline-block"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /><rect width="3" height="3" x="6" y="6" rx=".5" /><rect width="3" height="3" x="17" y="6" rx=".5" /><rect width="3" height="3" x="6" y="17" rx=".5" /><path d="M21 14h-3v3h3" /><path d="M18 21v-3" /></svg>
                            Import
                        </button>

                        {/* Export */}
                        <button
                            id="btn-export"
                            className="btn-primary text-sm relative"
                            onClick={() => { setShowExport(true) }}
                            disabled={activePatients.length === 0}
                            aria-label="Export patient list as QR code"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden sm:inline-block"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /><rect width="3" height="3" x="6" y="6" rx=".5" /><rect width="3" height="3" x="17" y="6" rx=".5" /><rect width="3" height="3" x="6" y="17" rx=".5" /><path d="M21 14h-3v3h3" /><path d="M18 21v-3" /></svg>
                            Export{selectedPatientIds.size > 0 ? ` (${selectedPatientIds.size})` : ''}
                        </button>
                    </div>
                </div>
            </div>
            )} {/* end activePage === 'patients' (action bar) */}

            {/* Modals */}
            {showExport && (
                <ExportModal
                    patients={patientsToExport}
                    listName={listName}
                    selectionCount={selectedPatientIds.size}
                    onClose={() => { setShowExport(false); clearSelection() }}
                    mortalities={mortalities}
                    discharges={discharges}
                    dischargesResetDate={dischargesResetDate}
                    docs={docs}
                    onRestore={restoreFromBackup}
                />
            )}
            {showScanner && (
                <ScannerComponent
                    listName={listName}
                    onImport={importPatients}
                    onLookup={lookupPatient}
                    onClose={() => setShowScanner(false)}
                />
            )}
            {showConfirmClear && (
                <ConfirmDialog
                    title={`Clear ${listName}?`}
                    message={`This will remove all ${activePatients.length} record${activePatients.length !== 1 ? 's' : ''} from ${listName}. This cannot be undone.`}
                    confirmLabel="Yes, Clear"
                    onConfirm={clearAll}
                    onCancel={() => setShowConfirmClear(false)}
                />
            )}
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
            {pendingImport && (
                <ReviewDuplicatesModal
                    pendingImport={pendingImport}
                    onResolve={resolveImport}
                    onCancel={() => setPendingImport(null)}
                />
            )}
            {showFeedback && (
                <FeedbackModal onClose={() => setShowFeedback(false)} />
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
            )}

            <PrintView
                patients={activePatients}
                listName={listName}
            />

            {/* DocComposer — opens when Document button is tapped on a patient card */}
            {composingFor && (
                <DocComposer
                    patient={composingFor}
                    onSave={({ text, color }) => addDoc(composingFor, text, color)}
                    onClose={() => setComposingFor(null)}
                />
            )}
        </div>
    )
}
