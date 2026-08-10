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
