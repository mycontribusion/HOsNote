import { useState, useEffect, useCallback, useRef } from 'react'

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
    // Tracks cumulative confirmed text for this mic session.
    // ONLY reset when the user explicitly taps Start — NOT on onend/onstart,
    // because Android WebView fires onend+onstart between every word while
    // keeping the same growing results array, causing the entire accumulated
    // transcript to be re-emitted on every auto-restart.
    const confirmedRef = useRef('')

    useEffect(() => { onResultRef.current = onResult }, [onResult])
    useEffect(() => { onErrorRef.current = onError }, [onError])

    useEffect(() => {
        if (!SpeechRecognition) { setIsSupported(false); return }
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
            // Do NOT reset confirmedRef here — onstart fires on every
            // auto-restart and the results array persists across restarts.
        }

        recognition.onend = () => {
            setIsListening(false)
            isListeningRef.current = false
            setInterimTranscript('')
            // Do NOT reset confirmedRef here either — same reason as onstart.
        }

        recognition.onresult = (event) => {
            // Always iterate from 0 — resultIndex is unreliable on Android WebView.
            let fullFinalSoFar = ''
            let interim = ''
            for (let i = 0; i < event.results.length; i++) {
                const text = event.results[i][0].transcript
                if (event.results[i].isFinal) fullFinalSoFar += text
                else interim += text
            }
            setInterimTranscript(interim)

            if (!fullFinalSoFar || fullFinalSoFar === confirmedRef.current) return

            if (fullFinalSoFar.startsWith(confirmedRef.current)) {
                // Cumulative session — emit only the genuinely new suffix
                const newChunk = fullFinalSoFar.slice(confirmedRef.current.length).trim()
                confirmedRef.current = fullFinalSoFar
                if (newChunk) onResultRef.current?.(newChunk)
            } else {
                // Browser reset its results array (new recognition session)
                // Emit the whole new text cleanly
                confirmedRef.current = fullFinalSoFar
                const chunk = fullFinalSoFar.trim()
                if (chunk) onResultRef.current?.(chunk)
            }
        }

        recognition.onerror = (event) => {
            const msg = event.error === 'not-allowed'
                ? 'Microphone access denied. Please allow microphone permissions.'
                : event.error === 'no-speech'
                ? 'No speech detected. Please try again.'
                : event.error === 'network'
                ? 'Network error. Speech recognition requires an internet connection.'
                : `Speech recognition error: ${event.error}`
            setError(msg)
            setIsListening(false)
            isListeningRef.current = false
            setInterimTranscript('')
            confirmedRef.current = ''
            onErrorRef.current?.(msg)
        }

        recognitionRef.current = recognition
        return () => { try { recognitionRef.current?.abort() } catch { /* ignore */ } }
    }, [lang, continuous])

    const startListening = useCallback(() => {
        if (!recognitionRef.current || isListeningRef.current) return
        confirmedRef.current = '' // ← ONLY reset here: user explicitly started a new session
        try { recognitionRef.current.start() }
        catch (err) { console.warn('Speech recognition start error:', err) }
    }, [])

    const stopListening = useCallback(() => {
        if (!recognitionRef.current || !isListeningRef.current) return
        try { recognitionRef.current.stop() }
        catch (err) { console.warn('Speech recognition stop error:', err) }
    }, [])

    const toggleListening = useCallback(() => {
        if (isListeningRef.current) stopListening()
        else startListening()
    }, [startListening, stopListening])

    return { isSupported, isListening, interimTranscript, error, startListening, stopListening, toggleListening }
}

