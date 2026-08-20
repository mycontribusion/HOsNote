import { createContext, useContext, useState, useEffect, useCallback } from 'react'

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

    // Sync query to URL search params
    useEffect(() => {
        const url = new URL(window.location.href)
        if (query) {
            url.searchParams.set('q', query)
        } else {
            url.searchParams.delete('q')
        }
        window.history.replaceState({}, '', url.toString())
    }, [query])

    // Persist query to sessionStorage
    useEffect(() => {
        try {
            sessionStorage.setItem('hosnote_search_query', query)
        } catch {
            // ignore
        }
    }, [query])

    const clearQuery = useCallback(() => setQuery(''), [])

    return (
        <SearchContext.Provider value={{ query, setQuery, clearQuery }}>
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
