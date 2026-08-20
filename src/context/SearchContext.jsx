import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'

const SearchContext = createContext(null)

export function SearchProvider({ children }) {
    const [query, setQuery] = useState(() => {
        try {
            const params = new URLSearchParams(window.location.search)
            return params.get('q') || ''
        } catch {
            return ''
        }
    })

    // Debounce syncing query to URL & sessionStorage to avoid main thread layout blocks
    const saveTimerRef = useRef(null)
    useEffect(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
            try {
                const url = new URL(window.location.href)
                if (query) {
                    url.searchParams.set('q', query)
                } else {
                    url.searchParams.delete('q')
                }
                window.history.replaceState({}, '', url.toString())
                sessionStorage.setItem('hosnote_search_query', query)
            } catch {
                // ignore
            }
        }, 300)

        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        }
    }, [query])

    const clearQuery = useCallback(() => setQuery(''), [])

    const value = useMemo(() => ({ query, setQuery, clearQuery }), [query, clearQuery])

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    )
}

export function useSearch() {
    const ctx = useContext(SearchContext)
    if (!ctx) {
        throw new Error('useSearch must be used within a SearchProvider')
    }
    return ctx
}

