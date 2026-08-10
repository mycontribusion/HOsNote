const fs = require('fs');

const filePath = 'src/components/AddPatientForm.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldFunction = `    const handleAddAsNew = () => {
        if (!duplicateInfo) return
        const { field, value, ward } = duplicateInfo
        let newValue = value
        if (field === 'hospitalNumber') {
            newValue = generateUniqueValue(patients, 'hospitalNumber', value)
        } else if (field === 'bed') {
            newValue = generateUniqueValue(patients, 'bed', value, ward)
        }
        setFields(prev => ({ ...prev, [field]: newValue }))
        setDuplicateInfo(null)
        setError('')
        hasSavedRef.current = true
        // Re-submit with the new unique value
        const { name: n, hospitalNumber: h, ward: w, bed: b, note: t, admissionDate: ad, diagnosis: d } = { ...fields, [field]: newValue }
        const result = onAdd({ team, name: n, hospitalNumber: h, ward: w, bed: b, note: t, critical, admissionDate: ad, diagnosis: d })
        if (result && result.type === 'duplicate_hosp') {
            setDuplicateInfo({ ...result, fieldLabel: 'Hospital Number' })
            return
        }
        if (result && result.type === 'duplicate_bed') {
            setDuplicateInfo({ ...result, fieldLabel: 'Ward/Bed' })
            return
        }
        if (result) {
            if (!initialData) clearDraft()
            else clearEditDraft()
            const newBlank = { name: '', hospitalNumber: '', ward: '', bed: '', admissionDate: today(), diagnosis: '', note: '' }
            setFields(newBlank)
            setHistory({ stack: [newBlank], index: 0 })
            isUndoRedo.current = true
            setCritical(false)
            setError('')
        }
    }`;

const newFunction = `    const handleAddAsNew = () => {
        if (!duplicateInfo) return

        let currentFields = { ...fields }
        let currentDuplicate = duplicateInfo
        let attempts = 0
        const maxAttempts = 5

        while (currentDuplicate && attempts < maxAttempts) {
            const { field, value, ward } = currentDuplicate
            let newValue = value
            if (field === 'hospitalNumber') {
                newValue = generateUniqueValue(patients, 'hospitalNumber', value)
            } else if (field === 'bed') {
                newValue = generateUniqueValue(patients, 'bed', value, ward)
            }

            currentFields = { ...currentFields, [field]: newValue }

            const { name: n, hospitalNumber: h, ward: w, bed: b, note: t, admissionDate: ad, diagnosis: d } = currentFields
            const result = onAdd({ team, name: n, hospitalNumber: h, ward: w, bed: b, note: t, critical, admissionDate: ad, diagnosis: d })

            if (result && result.type === 'duplicate_hosp') {
                currentDuplicate = { ...result, fieldLabel: 'Hospital Number' }
            } else if (result && result.type === 'duplicate_bed') {
                currentDuplicate = { ...result, fieldLabel: 'Ward/Bed' }
            } else {
                currentDuplicate = null
            }
            attempts++
        }

        setFields(currentFields)

        if (currentDuplicate) {
            setDuplicateInfo(currentDuplicate)
            return
        }

        setDuplicateInfo(null)
        setError('')
        hasSavedRef.current = true

        if (!initialData) clearDraft()
        else clearEditDraft()
        const newBlank = { name: '', hospitalNumber: '', ward: '', bed: '', admissionDate: today(), diagnosis: '', note: '' }
        setFields(newBlank)
        setHistory({ stack: [newBlank], index: 0 })
        isUndoRedo.current = true
        setCritical(false)
        setError('')
    }`;

if (content.includes(oldFunction)) {
    content = content.replace(oldFunction, newFunction);
    fs.writeFileSync(filePath, content);
    console.log('Successfully replaced handleAddAsNew function');
} else {
    console.log('Could not find the exact function to replace');
}
