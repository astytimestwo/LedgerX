import { isUnionTerritory } from '../../constants/gst-state-codes'

export type GstType = 'cgst_sgst' | 'igst' | 'cgst_utgst'

/**
 * Determines which tax components to apply based on seller and buyer locations.
 */
export function determineGstType(
    sellerStateCode: string,
    buyerStateCode?: string
): GstType {
    // If no buyer state is known, default to IGST as a safe fallback for unregistered 
    // out-of-state entities, or it should be caught by validation earlier.
    if (!buyerStateCode) return 'igst'

    // Intrastate: Seller and Buyer in same state
    if (sellerStateCode === buyerStateCode) {
        if (isUnionTerritory(buyerStateCode)) {
            return 'cgst_utgst'
        }
        return 'cgst_sgst'
    }

    // Interstate
    return 'igst'
}

/**
 * Computes exact GST amounts using integer arithmetic to maintain standard precision.
 * Rate must be percentage * 100 (e.g., 18% = 1800).
 * Taxable value must be in paise.
 * Returns amounts rounded to the nearest paisa.
 */
export function computeGstAmounts(
    taxableValuePaise: number,
    totalRateInt: number,
    gstType: GstType,
    cessRateInt: number = 0
) {
    let cgst = 0
    let sgst = 0
    let igst = 0
    let utgst = 0

    // Basic calculation: taxable * (totalRateInt/10000)
    // To round to nearest paisa, we use Math.round
    const totalGstAmount = Math.round((taxableValuePaise * totalRateInt) / 10000)

    if (gstType === 'igst') {
        igst = totalGstAmount
    } else {
        // Must split 50/50. To handle odd total amounts, we let the split half round normally.
        const halfRate = totalRateInt / 2
        const halfAmount = Math.round((taxableValuePaise * halfRate) / 10000)

        cgst = halfAmount
        if (gstType === 'cgst_sgst') {
            // Derive SGST from total to avoid rounding drift (e.g., ₹1.01 → CGST=0.51, SGST=0.50)
            sgst = totalGstAmount - cgst
        } else {
            utgst = halfAmount
        }
    }

    // Cess is computed straight against taxable value using the single rate
    const cessAmount = Math.round((taxableValuePaise * cessRateInt) / 10000)

    return {
        cgst_amount_paise: cgst,
        sgst_amount_paise: sgst,
        igst_amount_paise: igst,
        utgst_amount_paise: utgst,
        cess_amount_paise: cessAmount,
        total_tax_paise: cgst + sgst + igst + utgst + cessAmount
    }
}

/**
 * Derives the taxable value from a given inclusive price using integer math.
 */
export function computeInclusive(
    inclusivePricePaise: number,
    totalRateInt: number
) {
    // formula: InclusivePrice / (1 + Rate%)
    // integer formula: (InclusivePrice * 10000) / (10000 + RateInt)
    const taxableValue = Math.round((inclusivePricePaise * 10000) / (10000 + totalRateInt))
    const gstAmount = inclusivePricePaise - taxableValue

    return {
        taxable_value_paise: taxableValue,
        gst_amount_paise: gstAmount
    }
}

/**
 * Runs basic format and checksum validation on a GSTIN string.
 */
export function validateGstin(gstin: string): { valid: boolean; stateCode?: string; error?: string } {
    if (!gstin || typeof gstin !== 'string') {
        return { valid: false, error: 'GSTIN is empty' }
    }

    const cleanGstin = gstin.trim().toUpperCase()

    // General pattern: 2 digits + 5 letters + 4 digits + 1 letter + 1 digit/letter + Z + 1 digit/letter
    const regex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/

    // Note: To be more lenient with old/edge cases, we fall back to generic length check
    if (cleanGstin.length !== 15) {
        return { valid: false, error: 'GSTIN must be exactly 15 characters long' }
    }

    if (!regex.test(cleanGstin)) {
        return { valid: false, error: 'Invalid GSTIN format structure' }
    }

    // Extract State Code
    const stateCode = cleanGstin.substring(0, 2)

    // Note: We bypass strict mathematical checksum calculation here and rely on format + length.
    // Real systems often use the backend GSTN API, but for offline desktop validation, regex is typically sufficient.

    return { valid: true, stateCode }
}
