import { parseBaseAndSuffix } from '../utils/uniqueSuffix'

/**
 * Displays a value with an optional counter suffix in a smaller "exponent" style.
 * Example: "WARD(2)" or "WARD(2)(2)" renders "WARD" in normal size and "2" in exponent size.
 */
export default function SuffixedValue({ value, className = '' }) {
    if (!value) return null

    const parsed = parseBaseAndSuffix(value)
    if (parsed && parsed.suffix > 1) {
        return (
            <span className={className}>
                {parsed.base}<sup className="text-[0.6em] font-semibold align-top relative top-1.5 ml-0.5">{parsed.suffix}</sup>
            </span>
        )
    }

    return <span className={className}>{value}</span>
}
