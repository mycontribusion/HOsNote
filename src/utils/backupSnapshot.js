const BACKUP_TYPE = 'hosnote-cloud-backup'
const BACKUP_VERSION = 1

function compactValue(value) {
    if (Array.isArray(value)) return value.map(compactValue)
    if (value && typeof value === 'object') {
        return Object.keys(value)
            .sort()
            .reduce((result, key) => {
                if (value[key] !== undefined) result[key] = compactValue(value[key])
                return result
            }, {})
    }
    return value
}

export function stableStringify(value) {
    return JSON.stringify(compactValue(value))
}

export async function hashPayload(value) {
    const payload = stableStringify(value)
    try {
        const bytes = new TextEncoder().encode(payload)
        const digest = await crypto.subtle.digest('SHA-256', bytes)
        return Array.from(new Uint8Array(digest))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('')
    } catch {
        let hash = 2166136261
        for (let index = 0; index < payload.length; index += 1) {
            hash ^= payload.charCodeAt(index)
            hash = Math.imul(hash, 16777619)
        }
        return (hash >>> 0).toString(16).padStart(8, '0')
    }
}

export function buildCloudSnapshot({
    patients = [],
    mortalities = [],
    discharges = [],
    dischargesResetDate = '',
    docs = [],
    discardedDrafts = [],
    deviceId = '',
}) {
    const exportedAt = new Date().toISOString()
    const snapshot = {
        __type: BACKUP_TYPE,
        __v: BACKUP_VERSION,
        exportedAt,
        schemaVersion: BACKUP_VERSION,
        deviceId,
        patients: patients.filter(patient => !patient.isDemoData),
        mortalities: mortalities.filter(patient => !patient.isDemoData),
        discharges: discharges.filter(record => !record.isDemoData),
        dischargesResetDate,
        docs: docs.filter(doc => !doc.isDemoData),
        discardedDrafts: discardedDrafts.filter(draft => !draft.isDemoData),
    }

    return {
        ...snapshot,
        recordCount: snapshot.patients.length + snapshot.mortalities.length + snapshot.docs.length,
        hash: '',
    }
}

export async function prepareCloudSnapshot(data) {
    const snapshot = buildCloudSnapshot(data)
    snapshot.hash = await hashPayload({
        patients: snapshot.patients,
        mortalities: snapshot.mortalities,
        discharges: snapshot.discharges,
        dischargesResetDate: snapshot.dischargesResetDate,
        docs: snapshot.docs,
        discardedDrafts: snapshot.discardedDrafts,
        schemaVersion: snapshot.schemaVersion,
    })
    return snapshot
}

let memoryDeviceId = null

export function getOrCreateDeviceId() {
    if (typeof localStorage === 'undefined') {
        if (!memoryDeviceId) {
            memoryDeviceId = 'device_' + ((typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : Math.random().toString(36).slice(2))
        }
        return memoryDeviceId
    }
    let deviceId = localStorage.getItem('hosnote_device_id')
    if (!deviceId) {
        deviceId = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2)
        localStorage.setItem('hosnote_device_id', deviceId)
    }
    return deviceId
}

export function validateCloudBackup(data) {
    if (!data || (data.__type !== BACKUP_TYPE && data.__type !== 'hosnote-backup')) {
        throw new Error('Unsupported backup format. Expected HOsNote backup file.')
    }

    if (!Array.isArray(data.patients) && !Array.isArray(data.docs)) {
        throw new Error('Invalid backup file: no patient or clinical records found.')
    }

    return {
        ...data,
        patients: Array.isArray(data.patients) ? data.patients : [],
        mortalities: Array.isArray(data.mortalities) ? data.mortalities : [],
        discharges: Array.isArray(data.discharges) ? data.discharges : [],
        dischargesResetDate: typeof data.dischargesResetDate === 'string' ? data.dischargesResetDate : '',
        docs: Array.isArray(data.docs) ? data.docs : [],
        discardedDrafts: Array.isArray(data.discardedDrafts) ? data.discardedDrafts : [],
    }
}

