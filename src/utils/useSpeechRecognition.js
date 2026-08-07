import { useState, useEffect, useCallback, useRef } from 'react'

// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export function useSpeechRecognition({ onResult, onError, lang = 'en-US', continuous = true } = {}) {
    const [isSupported, setIsSupported] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [interimTranscript, setInterimTranscript] = useState('')
    const [error, setError] = useState('')
    const recognitionRef = useRef(null)
    const isListeningRef = useRef(false)
    const onResultRef = useRef(onResult)
    const onErrorRef = useRef(onError)
    // Tracks the cumulative confirmed text already emitted this session
    // so we never re-emit text that was already sent to onResult.
    const confirmedRef = useRef('')

    // Keep refs in sync with callbacks
    useEffect(() => {
        onResultRef.current = onResult
    }, [onResult])

    useEffect(() => {
        onErrorRef.current = onError
    }, [onError])

    useEffect(() => {
        if (!SpeechRecognition) {
            setIsSupported(false)
            return
        }
        setIsSupported(true)

        const recognition = new SpeechRecognition()
        recognition.continuous = continuous
        recognition.interimResults = true
        recognition.lang = lang
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
            setIsListening(true)
            isListeningRef.current = true
            setError('')
            confirmedRef.current = ''  // reset accumulator for new session
        }

        recognition.onend = () => {
            setIsListening(false)
            isListeningRef.current = false
            setInterimTranscript('')
            confirmedRef.current = ''
        }

        recognition.onresult = (event) => {
            // Rebuild the full confirmed transcript from ALL results.
            // We cannot rely on event.resultIndex being correct on all
            // Android WebView builds — some always send 0.
            let fullFinalSoFar = ''
            let interim = ''

            for (let i = 0; i < event.results.length; i++) {
                const text = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    fullFinalSoFar += text
                } else {
                    interim += text
                }
            }

            setInterimTranscript(interim)

            // Only emit the portion that is genuinely new
            if (fullFinalSoFar && fullFinalSoFar !== confirmedRef.current) {
                const newChunk = fullFinalSoFar.slice(confirmedRef.current.length).trim()
                confirmedRef.current = fullFinalSoFar
                if (newChunk && onResultRef.current) {
                    onResultRef.current(newChunk)
                }
            }
        }

        recognition.onerror = (event) => {
            const errorMessage = event.error === 'not-allowed'
                ? 'Microphone access denied. Please allow microphone permissions.'
                : event.error === 'no-speech'
                ? 'No speech detected. Please try again.'
                : event.error === 'network'
                ? 'Network error. Speech recognition requires an internet connection.'
                : `Speech recognition error: ${event.error}`
            
            setError(errorMessage)
            setIsListening(false)
            isListeningRef.current = false
            setInterimTranscript('')
            confirmedRef.current = ''
            
            if (onErrorRef.current) {
                onErrorRef.current(errorMessage)
            }
        }

        recognitionRef.current = recognition

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort()
                } catch {
                    // ignore cleanup errors
                }
            }
        }
    }, [lang, continuous])

    const startListening = useCallback(() => {
        if (!recognitionRef.current || isListeningRef.current) return
        
        try {
            recognitionRef.current.start()
        } catch (err) {
            // Already started or other error
            console.warn('Speech recognition start error:', err)
        }
    }, [])

    const stopListening = useCallback(() => {
        if (!recognitionRef.current || !isListeningRef.current) return
        
        try {
            recognitionRef.current.stop()
        } catch (err) {
            console.warn('Speech recognition stop error:', err)
        }
    }, [])

    const toggleListening = useCallback(() => {
        if (isListeningRef.current) {
            stopListening()
        } else {
            startListening()
        }
    }, [startListening, stopListening])

    return {
        isSupported,
        isListening,
        interimTranscript,
        error,
        startListening,
        stopListening,
        toggleListening,
    }
}
