/**
 * Context-Aware Date Formatting
 *
 * Rules (always includes time):
 * - Today:          "Today" + time (e.g., "Today, 4:30 PM")
 * - This week:      3-letter day + time (e.g., "Mon, 4:30 PM")
 * - This year:      date + time (e.g., "Jan 5, 4:30 PM")
 * - Previous year:  date with year + time (e.g., "Jan 5, 2025, 4:30 PM")
 */

export function formatSmartDate(iso) {
    if (!iso) return ''

    const now = new Date()
    const d = new Date(iso)

    // Reset time components for date-only comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())

    const diffMs = today - target
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    // Today: show "Today" + time
    if (diffDays === 0) {
        return 'Today, ' + timeStr
    }

    // This week (within last 7 days, and same week)
    if (diffDays > 0 && diffDays < 7) {
        // Check if same week (Monday-based)
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7)) // Monday

        if (target >= startOfWeek) {
            return d.toLocaleDateString([], { weekday: 'short' }) + ', ' + timeStr
        }
    }

    // Same year: show date without year + time
    if (d.getFullYear() === now.getFullYear()) {
        return d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ', ' + timeStr
    }

    // Previous year: show date with year + time
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + timeStr
}

/**
 * Returns date and time parts separately for layouts that need time below the date
 */
export function formatSmartDateParts(iso) {
    if (!iso) return { date: '', time: '' }

    const now = new Date()
    const d = new Date(iso)

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())

    const diffMs = today - target
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    // Today: show "Today" as date, time below
    if (diffDays === 0) {
        return { date: 'Today', time: timeStr }
    }

    // This week: 3-letter day abbreviation
    if (diffDays > 0 && diffDays < 7) {
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7))

        if (target >= startOfWeek) {
            return { date: d.toLocaleDateString([], { weekday: 'short' }), time: timeStr }
        }
    }

    // Same year
    if (d.getFullYear() === now.getFullYear()) {
        return { date: d.toLocaleDateString([], { day: 'numeric', month: 'short' }), time: timeStr }
    }

    // Previous year
    return { date: d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }), time: timeStr }
}

/**
 * Full date + time formatting (for detail views, exports, etc.)
 */
export function formatFullDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
