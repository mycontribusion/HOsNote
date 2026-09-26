import crypto from 'node:crypto'

/**
 * Derives a 32-byte key from GOOGLE_TOKEN_ENCRYPTION_KEY using SHA-256.
 */
function getEncryptionKey() {
    const secret = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
    if (!secret) {
        throw new Error('Server configuration error: GOOGLE_TOKEN_ENCRYPTION_KEY is not configured.')
    }
    return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Encrypts a plaintext string (e.g. Google refresh token) using AES-256-GCM.
 * Stored format: `${ivHex}:${authTagHex}:${encryptedHex}`
 */
export function encryptToken(text) {
    if (!text) return ''
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypts an AES-256-GCM encrypted token.
 */
export function decryptToken(cipherText) {
    if (!cipherText) return ''
    const parts = cipherText.split(':')
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted token format')
    }
    const [ivHex, authTagHex, encryptedHex] = parts
    const key = getEncryptionKey()
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
}

/**
 * Computes a SHA-256 hash of the client's raw browser authorization key.
 * Only the hash is stored in the database.
 */
export function hashClientKey(key) {
    if (!key) return ''
    return crypto.createHash('sha256').update(String(key)).digest('hex')
}

/**
 * Generates a cryptographically secure random token (e.g. for OAuth state).
 */
export function randomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('base64url')
}
