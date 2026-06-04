import crypto from 'crypto'
import { app } from 'electron'
import fs from 'fs'
import { join } from 'path'

const ALGORITHM = 'aes-256-gcm'
const SALT_LENGTH = 16
const IV_LENGTH = 12
const KEY_LENGTH = 32
// OWASP 2023 minimum for PBKDF2-SHA256 is 310,000 iterations
const ITERATIONS = 310000

export function deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256')
}

export function generateSalt(): Buffer {
    return crypto.randomBytes(SALT_LENGTH)
}

export function encrypt(text: string, key: Buffer): string {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedData: string, key: Buffer): string {
    const parts = encryptedData.split(':')
    if (parts.length !== 3) throw new Error('Invalid encrypted data format')

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encryptedText = parts[2]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}

export function getSystemKey(companyName: string): Buffer {
    const metaPath = join(app.getPath('userData'), `${companyName}.meta`)
    if (!fs.existsSync(metaPath)) {
        throw new Error(`Company meta file not found for ${companyName}`)
    }
    const saltHex = fs.readFileSync(metaPath, 'utf8')
    const salt = Buffer.from(saltHex, 'hex')

    // SECURITY NOTE: The passphrase below is hardcoded and provides no true secret.
    // The security of data encrypted with this key depends entirely on the uniqueness of
    // the per-company salt. For production, this passphrase should be derived from a
    // build-time secret injected via environment variable (e.g., process.env.SYSTEM_KEY_PASSPHRASE).
    const passphrase = process.env.SYSTEM_KEY_PASSPHRASE || 'ledgerx-internal-system-v1'
    return deriveKey(passphrase, salt)
}
