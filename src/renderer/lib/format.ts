/**
 * format.ts
 * Formatting utilities for LedgerX
 */

// Convert integer paise to Indian Rupee string formatting (e.g., 10000000 -> ₹1,00,000.00)
export function formatPaise(paise: number | undefined | null): string {
    if (paise === undefined || paise === null) return '₹0.00'

    // Ensure it's an integer
    const val = Math.round(paise)
    const isNegative = val < 0
    const absValStr = Math.abs(val).toString().padStart(3, '0') // handle case like '5' -> '005'

    const decimalPart = absValStr.slice(-2)
    const integerPart = absValStr.slice(0, -2) || '0'

    // Apply Indian numbering system (xx,xx,xxx) to integer part
    let lastThree = integerPart.substring(integerPart.length - 3)
    const otherNumbers = integerPart.substring(0, integerPart.length - 3)
    if (otherNumbers != '') {
        lastThree = ',' + lastThree
    }
    const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree

    const sign = isNegative ? '-' : ''

    return `${sign}₹${formattedInteger}.${decimalPart}`
}

// Convert INR string back to paise integer
export function parsePaise(valueStr: string): number {
    if (!valueStr) return 0

    // Strip everything except numbers, dec point, and minus
    const cleanStr = valueStr.replace(/[^0-9.-]/g, '')
    if (!cleanStr) return 0

    const floatVal = parseFloat(cleanStr)
    if (isNaN(floatVal)) return 0

    return Math.round(floatVal * 100)
}

// Format YYYY-MM-DD to DD-MM-YYYY
export function formatDate(isoDate: string | undefined | null): string {
    if (!isoDate) return ''
    const parts = isoDate.split('-')
    if (parts.length !== 3) return isoDate
    return `${parts[2]}-${parts[1]}-${parts[0]}`
}

// Format DD-MM-YYYY to YYYY-MM-DD
export function parseDate(displayDate: string): string {
    if (!displayDate) return ''
    const parts = displayDate.split('-')
    if (parts.length !== 3) return displayDate
    return `${parts[2]}-${parts[1]}-${parts[0]}`
}
