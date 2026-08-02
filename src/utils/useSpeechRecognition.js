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
        }

        recognition.onend = () => {
            setIsListening(false)
            isListeningRef.current = false
            setInterimTranscript('')
        }

        recognition.onresult = (event) => {
            let finalTranscript = ''
            let interim = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    finalTranscript += transcript
                } else {
                    interim += transcript
                }
            }

            setInterimTranscript(interim)

            if (finalTranscript && onResultRef.current) {
                onResultRef.current(finalTranscript)
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
