/**
 * Displays a value with an optional counter suffix in a smaller "exponent" style.
 * Example: "WARD(2)" renders "WARD" in normal size and "(2)" in smaller size.
 */
export default function SuffixedValue({ value, className = '' }) {
    if (!value) return null

    const match = value.match(/^(.+?)\((\d+)\)$/)
    if (match) {
        const [, base, count] = match
        return (
            <span className={className}>
                {base}<sup className="text-[0.6em] font-semibold align-top relative top-1.5 ml-0.5">{count}</sup>
            </span>
        )
    }

    return <span className={className}>{value}</span>
}
