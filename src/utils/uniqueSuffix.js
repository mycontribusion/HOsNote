/**
 * Helper function to parse a value into its base string and numeric suffix.
 * Handles patterns like "12345", "12345(2)", "12345^2", "12345^(2)", "12345(2)(2)".
 *
 * @param {string} val
 * @returns {{ base: string, suffix: number } | null}
 */
export function parseBaseAndSuffix(val) {
    if (!val) return null
    const str = String(val).trim()
    if (!str) return null

    // Match base followed by one or more suffix patterns like (2), ^2, ^(2)
    const suffixRegex = /^(.*?)(?:\s*(?:\((\d+)\)|\^(\d+)|\^\((\d+)\)))+$/
    const match = str.match(suffixRegex)
    if (match) {
        const base = match[1].trim()
        const count = parseInt(match[2] || match[3] || match[4], 10)
        return { base: base || str, suffix: isNaN(count) ? 1 : count }
    }

    return { base: str, suffix: 1 }
}

/**
 * Generate a unique value with a counter suffix for duplicate fields.
 * Always extracts the true base value first so that imported items with suffixes
 * (e.g. "a(2)") get assigned clean incrementing suffixes ("a(4)") rather than "a(2)(2)".
 *
 * @param {Array} existingItems - Array of existing patient objects
 * @param {string} field - The field to check ('hospitalNumber' or 'bed')
 * @param {string} value - The original value (may already contain a suffix)
 * @param {string} [ward] - Required when field is 'bed' to scope the search
 * @returns {string} A unique value with counter suffix if needed
 */
export function generateUniqueValue(existingItems, field, value, ward) {
    if (!value) return value

    const parsedInput = parseBaseAndSuffix(value)
    if (!parsedInput || !parsedInput.base) return value

    const baseValue = parsedInput.base

    // Collect target existing items for this field
    let targetItems = existingItems || []
    if (field === 'bed') {
        if (!ward) return baseValue
        const w = ward.trim().toUpperCase()
        targetItems = targetItems.filter(p => (p.ward || '').trim().toUpperCase() === w)
    }

    // Extract all suffixes for items that share the same base value
    const existingSuffixes = []
    targetItems.forEach(p => {
        const val = field === 'hospitalNumber' ? p.hospitalNumber : p.bed
        const parsed = parseBaseAndSuffix(val)
        if (parsed && parsed.base.toLowerCase() === baseValue.toLowerCase()) {
            existingSuffixes.push(parsed.suffix)
        }
    })

    // If no existing item shares this base value, return the clean baseValue
    if (existingSuffixes.length === 0) {
        return baseValue
    }

    // Find highest suffix count among existing items (at least 1 since baseValue exists)
    const maxSuffix = Math.max(...existingSuffixes, 1)

    // Return baseValue with incremented counter
    return `${baseValue}(${maxSuffix + 1})`
}

/**
 * Update suffixes of remaining patients after patients with smaller suffixes (including base patients) are removed.
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
    const removedHospSuffixes = {} // { baseKey: [suffix1, suffix2, ...] }
    const removedBedSuffixes = {} // { ward: { baseKey: [suffix1, suffix2, ...] } }

    removedPatients.forEach(p => {
        if (p.hospitalNumber) {
            const parsed = parseBaseAndSuffix(p.hospitalNumber)
            if (parsed) {
                const baseKey = parsed.base.toLowerCase()
                if (!removedHospSuffixes[baseKey]) removedHospSuffixes[baseKey] = []
                removedHospSuffixes[baseKey].push(parsed.suffix)
            }
        }
        if (p.ward && p.bed) {
            const parsed = parseBaseAndSuffix(p.bed)
            if (parsed) {
                const baseKey = parsed.base.toLowerCase()
                const ward = p.ward.trim().toUpperCase()
                if (!removedBedSuffixes[ward]) removedBedSuffixes[ward] = {}
                if (!removedBedSuffixes[ward][baseKey]) removedBedSuffixes[ward][baseKey] = []
                removedBedSuffixes[ward][baseKey].push(parsed.suffix)
            }
        }
    })

    // Update remaining patients' suffixes
    updatedPatients.forEach(p => {
        if (p.hospitalNumber) {
            const parsed = parseBaseAndSuffix(p.hospitalNumber)
            if (parsed) {
                const baseKey = parsed.base.toLowerCase()
                const removedSuffixes = removedHospSuffixes[baseKey] || []
                const smallerRemovedCount = removedSuffixes.filter(s => s < parsed.suffix).length
                if (smallerRemovedCount > 0) {
                    const newSuffix = parsed.suffix - smallerRemovedCount
                    p.hospitalNumber = newSuffix === 1 ? parsed.base : `${parsed.base}(${newSuffix})`
                }
            }
        }
        if (p.ward && p.bed) {
            const parsed = parseBaseAndSuffix(p.bed)
            if (parsed) {
                const baseKey = parsed.base.toLowerCase()
                const ward = p.ward.trim().toUpperCase()
                const removedSuffixes = (removedBedSuffixes[ward] && removedBedSuffixes[ward][baseKey]) || []
                const smallerRemovedCount = removedSuffixes.filter(s => s < parsed.suffix).length
                if (smallerRemovedCount > 0) {
                    const newSuffix = parsed.suffix - smallerRemovedCount
                    p.bed = newSuffix === 1 ? parsed.base : `${parsed.base}(${newSuffix})`
                }
            }
        }
    })

    return updatedPatients
}
