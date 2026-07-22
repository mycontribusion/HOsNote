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
