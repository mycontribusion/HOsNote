import { useState, useCallback } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { useSpeechRecognition } from '../utils/useSpeechRecognition'

export default function MicrophoneButton({ 
    onTranscript, 
    lang = 'en-US', 
    title = 'Voice input',
    className = '',
    disabled = false 
}) {
    const [showError, setShowError] = useState(false)
    
    const handleResult = useCallback((transcript) => {
        if (onTranscript) {
            onTranscript(transcript)
        }
    }, [onTranscript])

    const handleError = useCallback((errorMessage) => {
        setShowError(true)
        setTimeout(() => setShowError(false), 4000)
    }, [])

    const { isSupported, isListening, interimTranscript, error, toggleListening } = useSpeechRecognition({
        onResult: handleResult,
        onError: handleError,
        lang,
    })

    const handleClick = () => {
        if (!isSupported) {
            alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
            return
        }
        toggleListening()
    }

    if (!isSupported) {
        return (
            <button
                type="button"
                disabled
                className={`p-2 rounded-xl text-gray-300 cursor-not-allowed ${className}`}
                title="Speech recognition not supported"
                aria-label="Speech recognition not supported"
            >
                <MicOff size={18} />
            </button>
        )
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={handleClick}
                disabled={disabled}
                className={`
                        p-2 rounded-xl transition-all duration-200 active:scale-95
                        ${isListening
                            ? 'bg-red-500 text-white shadow-lg shadow-red-200 dark:shadow-red-900/30 recording-pulse'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        ${className}
                    `}
                title={isListening ? 'Stop recording' : title}
                aria-label={isListening ? 'Stop recording' : title}
            >
                {isListening ? <Mic size={18} /> : <Mic size={18} />}
            </button>
            
            {/* Interim transcript tooltip */}
            {isListening && interimTranscript && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap max-w-[200px] truncate z-50">
                    {interimTranscript}
                    <span className="animate-pulse">|</span>
                </div>
            )}

            {/* Error tooltip */}
            {showError && error && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg shadow-lg whitespace-nowrap max-w-[250px] z-50">
                    {error}
                </div>
            )}
        </div>
    )
}
