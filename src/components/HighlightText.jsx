import React, { memo } from 'react'

const HighlightText = memo(function HighlightText({ text, query }) {
    if (!query || !text) return <>{text}</>
    const trimmedQuery = String(query).trim()
    if (!trimmedQuery) return <>{text}</>

    const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'))
    const lowerQuery = trimmedQuery.toLowerCase()

    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === lowerQuery ? (
                    <mark key={i} className="bg-yellow-300 dark:bg-yellow-500/60 text-gray-900 dark:text-gray-100 font-semibold rounded px-1 py-0.5 shadow-sm">{part}</mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    )
})

export default HighlightText

