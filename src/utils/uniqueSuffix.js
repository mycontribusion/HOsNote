/**
 * Generate a unique value with a counter suffix for duplicate fields.
 *
 * @param {Array} existingItems - Array of existing patient objects
 * @param {string} field - The field to check ('hospitalNumber' or 'bed')
 * @param {string} value - The original value
 * @param {string} [ward] - Required when field is 'bed' to scope the search
 * @returns {string} A unique value with counter suffix if needed
 */
export function generateUniqueValue(existingItems, field, value, ward) {
    if (!value) return value

    const trimmed = value.trim()
    if (!trimmed) return trimmed

    // Collect all existing values for this field
    let existingValues = []
    if (field === 'hospitalNumber') {
        existingValues = existingItems
            .map(p => (p.hospitalNumber || '').trim())
            .filter(v => v)
    } else if (field === 'bed') {
        if (!ward) return trimmed
        const w = ward.trim().toUpperCase()
        existingValues = existingItems
            .filter(p => (p.ward || '').trim().toUpperCase() === w)
            .map(p => (p.bed || '').trim())
            .filter(v => v)
    }

    // Check if the original value already exists
    if (!existingValues.includes(trimmed)) {
        return trimmed
    }

    // Find the next available counter
    const suffixPattern = /^(.+)\((\d+)\)$/
    let maxCount = 1

    existingValues.forEach(v => {
        const match = v.match(suffixPattern)
        if (match) {
            const base = match[1]
            const count = parseInt(match[2], 10)
            if (base === trimmed && count > maxCount) {
                maxCount = count
            }
        }
    })

    // Return with incremented counter (start from 2 for first duplicate)
    return `${trimmed}(${maxCount + 1})`
}

/**
 * Update suffixes of remaining patients after patients with smaller suffixes are removed.
 * Only affects patients with larger suffix counts for the same base value.
 *
 * @param {Array} remainingPatients - Array of remaining patient objects
 * @param {Array} removedPatients - Array of removed patient objects
 * @returns {Array} Updated array of remaining patient objects
 */
export function updateSuffixesAfterRemoval(remainingPatients, removedPatients) {
    if (!removedPatients || removedPatients.length === 0) return remainingPatients

    const updatedPatients = remainingPatients.map(p => ({ ...p }))

    // Group removed suffixes by field and base value
    const removedHospSuffixes = {} // { base: [suffix1, suffix2, ...] }
    const removedBedSuffixes = {} // { ward: { base: [suffix1, suffix2, ...] } }

    removedPatients.forEach(p => {
        if (p.hospitalNumber) {
            const match = p.hospitalNumber.match(/^(.+)\((\d+)\)$/)
            if (match) {
                const base = match[1]
                const suffix = parseInt(match[2], 10)
                if (!removedHospSuffixes[base]) removedHospSuffixes[base] = []
                removedHospSuffixes[base].push(suffix)
            }
        }
        if (p.ward && p.bed) {
            const match = p.bed.match(/^(.+)\((\d+)\)$/)
            if (match) {
                const base = match[1]
                const suffix = parseInt(match[2], 10)
                const ward = p.ward.trim().toUpperCase()
                if (!removedBedSuffixes[ward]) removedBedSuffixes[ward] = {}
                if (!removedBedSuffixes[ward][base]) removedBedSuffixes[ward][base] = []
                removedBedSuffixes[ward][base].push(suffix)
            }
        }
    })

    // Update remaining patients' suffixes
    updatedPatients.forEach(p => {
        if (p.hospitalNumber) {
            const match = p.hospitalNumber.match(/^(.+)\((\d+)\)$/)
            if (match) {
                const base = match[1]
                const suffix = parseInt(match[2], 10)
                const removedSuffixes = removedHospSuffixes[base] || []
                const smallerRemovedCount = removedSuffixes.filter(s => s < suffix).length
                if (smallerRemovedCount > 0) {
                    const newSuffix = suffix - smallerRemovedCount
                    p.hospitalNumber = newSuffix === 1 ? base : `${base}(${newSuffix})`
                }
            }
        }
        if (p.ward && p.bed) {
            const match = p.bed.match(/^(.+)\((\d+)\)$/)
            if (match) {
                const base = match[1]
                const suffix = parseInt(match[2], 10)
                const ward = p.ward.trim().toUpperCase()
                const removedSuffixes = (removedBedSuffixes[ward] && removedBedSuffixes[ward][base]) || []
                const smallerRemovedCount = removedSuffixes.filter(s => s < suffix).length
                if (smallerRemovedCount > 0) {
                    const newSuffix = suffix - smallerRemovedCount
                    p.bed = newSuffix === 1 ? base : `${base}(${newSuffix})`
                }
            }
        }
    })

    return updatedPatients
}
