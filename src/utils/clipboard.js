// Robust clipboard copy utility with multi-method fallback.
// The standard navigator.clipboard.writeText() has size limits on many
// platforms (especially mobile). This helper tries several approaches
// in order of preference so large payloads still get copied.

export async function copyToClipboard(text) {
    // Method 1: Standard writeText — fastest, works for small/medium data.
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text)
            return true
        } catch {
            // Fall through to next method
        }
    }

    // Method 2: ClipboardItem + write() with Blob — bypasses string size
    // limits because the data is streamed as binary. Supported in Chrome,
    // Edge, and other Chromium-based browsers.
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
            const blob = new Blob([text], { type: 'text/plain' })
            const item = new ClipboardItem({ 'text/plain': blob })
            await navigator.clipboard.write([item])
            return true
        } catch {
            // Fall through to next method
        }
    }

    // Method 3: Legacy execCommand('copy') with a hidden textarea.
    // Works in older browsers and some mobile contexts where the
    // async Clipboard API is restricted.
    try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        textarea.style.pointerEvents = 'none'
        document.body.appendChild(textarea)
        textarea.select()
        textarea.setSelectionRange(0, text.length)
        const successful = document.execCommand('copy')
        document.body.removeChild(textarea)
        if (successful) return true
    } catch {
        // All methods failed
    }

    return false
}

// Cleans raw clipboard text: strips HTML tags, hidden inline styles (e.g., width: 500px),
// tabs (\t), non-breaking space characters (\u00A0), zero-width characters, and normalizes line breaks.
export function cleanPastedText(rawText) {
    if (!rawText) return ''
    // 1. Strip HTML tags / markup if HTML source code or markup was pasted
    let cleaned = rawText.replace(/<[^>]*>?/gm, '')
    // 2. Convert tab characters (\t) to double spaces so tabular EHR pastes render cleanly without line blowout
    cleaned = cleaned.replace(/\t/g, '  ')
    // 3. Convert non-breaking spaces (\u00A0, \u202F, &nbsp;) and unusual whitespace to standard space
    cleaned = cleaned.replace(/[\u00A0\u202F\u1680\u2000-\u200A\u2028\u2029\u205F\u3000]/g, ' ').replace(/&nbsp;/g, ' ')
    // 4. Normalize line breaks (CRLF or CR to LF)
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    // 5. Remove zero-width spaces/joiners and hidden control chars (except standard whitespace and newlines)
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '')
    return cleaned
}

