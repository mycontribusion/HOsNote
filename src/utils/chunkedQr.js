// Chunked QR transfer utility
// ---------------------------------------------------------------------------
// A single QR code can only hold a few KB. To transfer a "large" payload (e.g.
// a full patient list WITH notes) we split the data into many small QR frames
// and stream them as an animation. The receiver scans each frame and reassembles
// the original payload once every chunk has arrived.
//
// Frame format (each QR value is a single string):
//   HN1|<sessionId>|<total>|<index>|<payload>
//     HN1      -> protocol tag (HOsNote v1) so we can detect our frames
//     sessionId-> random id so two simultaneous transfers don't interleave
//     total    -> number of chunks in this transfer
//     index    -> 0-based position of this chunk
//     payload  -> a slice of the Base64-encoded JSON
//
// The very first frame (index 0) additionally carries a trailing "|<crc32>"
// checksum of the FULL decoded payload so the receiver can verify integrity.
// ---------------------------------------------------------------------------

export const PROTOCOL_TAG = 'HN1'

// Keep each frame comfortably under the safe QR capacity at error-correction
// level M. At ~700 bytes total QR payload (level M, version ~8) this is very
// reliably scannable by phone cameras even in mediocre lighting.
// 120 Base64 chars ≈ 90 bytes of raw data, leaving plenty of room for the
// frame header (tag|sid|total|index|).
const CHUNK_SIZE = 120

// Small, dependency-free CRC32 (used only for integrity verification).
function crc32(str) {
    let crc = 0xffffffff
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i)
        for (let j = 0; j < 8; j++) {
            crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
        }
    }
    return (crc ^ 0xffffffff) >>> 0
}

function toBase64Unicode(str) {
    // Encode UTF-8 safely (notes may contain emoji / special chars).
    return btoa(unescape(encodeURIComponent(str)))
}

function fromBase64Unicode(b64) {
    return decodeURIComponent(escape(atob(b64)))
}

// Build the full list of frame strings for a payload object.
export function buildFrames(payloadObject) {
    const json = JSON.stringify(payloadObject)
    const encoded = toBase64Unicode(json)
    const checksum = crc32(json)
    const total = Math.max(1, Math.ceil(encoded.length / CHUNK_SIZE))

    const frames = []
    for (let i = 0; i < total; i++) {
        const slice = encoded.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
        const sessionId = payloadObject.__sid || 'X'
        // First frame carries the checksum for verification.
        const tail = i === 0 ? `|${checksum}` : ''
        frames.push(
            [PROTOCOL_TAG, sessionId, total, i, slice].join('|') + tail
        )
    }
    return { frames, total, bytes: encoded.length }
}

// Parse a single scanned frame. Returns null if it's not one of our frames.
export function parseFrame(value) {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    const parts = trimmed.split('|')
    if (parts[0] !== PROTOCOL_TAG) return null
    if (parts.length < 5) return null

    const [tag, sessionId, totalStr, indexStr, ...rest] = parts
    const total = parseInt(totalStr, 10)
    const index = parseInt(indexStr, 10)
    if (!Number.isFinite(total) || !Number.isFinite(index)) return null

    // The payload is everything after index; the first frame may have a
    // trailing checksum segment which we strip off.
    let payload = rest.join('|')
    let checksum = null
    if (index === 0) {
        const lastSep = payload.lastIndexOf('|')
        if (lastSep !== -1) {
            checksum = payload.slice(lastSep + 1)
            payload = payload.slice(0, lastSep)
        }
    }

    return { sessionId, total, index, payload, checksum }
}

// Accumulator that collects frames for one or more sessions and emits the
// reassembled payload once a session is complete.
// Resilience design:
//   - Sessions are NEVER wiped on stall — the camera just needs to keep
//     scanning and previously-received chunks stay in memory.
//   - A session is only discarded on successful completion or on 'corrupt'.
//   - reset() is an explicit operation called only when the user taps
//     "restart" or a new paste is submitted.
export function createReceiver() {
    const sessions = new Map() // sessionId -> { total, chunks[], checksum, received }

    function addFrame(frame) {
        if (!frame) return { status: 'ignored' }

        let sess = sessions.get(frame.sessionId)
        if (!sess) {
            sess = { total: frame.total, chunks: new Array(frame.total), checksum: frame.checksum, received: 0 }
            sessions.set(frame.sessionId, sess)
        }

        if (frame.index < sess.total && sess.chunks[frame.index] === undefined) {
            sess.chunks[frame.index] = frame.payload
            sess.received++
            // Update checksum if this is frame 0 and we didn't have it yet
            if (frame.index === 0 && frame.checksum !== null && sess.checksum === null) {
                sess.checksum = frame.checksum
            }
        }

        if (sess.received === sess.total && sess.chunks.every(c => c !== undefined)) {
            const joined = sess.chunks.join('')
            try {
                const json = fromBase64Unicode(joined)
                if (sess.checksum !== null) {
                    const actual = crc32(json)
                    if (actual !== parseInt(sess.checksum, 10)) {
                        // Corrupt — discard this session so it can restart cleanly
                        sessions.delete(frame.sessionId)
                        return { status: 'corrupt' }
                    }
                }
                sessions.delete(frame.sessionId)
                return { status: 'complete', payload: JSON.parse(json) }
            } catch {
                sessions.delete(frame.sessionId)
                return { status: 'corrupt' }
            }
        }

        return {
            status: 'progress',
            sessionId: frame.sessionId,
            received: sess.received,
            total: sess.total,
        }
    }

    function reset() {
        sessions.clear()
    }

    return { addFrame, reset }
}
