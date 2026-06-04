// Source: GST Council official state listing
export const GST_STATE_CODES = [
    { code: '01', name: 'Jammu and Kashmir', isUT: true },
    { code: '02', name: 'Himachal Pradesh', isUT: false },
    { code: '03', name: 'Punjab', isUT: false },
    { code: '04', name: 'Chandigarh', isUT: true },
    { code: '05', name: 'Uttarakhand', isUT: false },
    { code: '06', name: 'Haryana', isUT: false },
    { code: '07', name: 'Delhi', isUT: true },
    { code: '08', name: 'Rajasthan', isUT: false },
    { code: '09', name: 'Uttar Pradesh', isUT: false },
    { code: '10', name: 'Bihar', isUT: false },
    { code: '11', name: 'Sikkim', isUT: false },
    { code: '12', name: 'Arunachal Pradesh', isUT: false },
    { code: '13', name: 'Nagaland', isUT: false },
    { code: '14', name: 'Manipur', isUT: false },
    { code: '15', name: 'Mizoram', isUT: false },
    { code: '16', name: 'Tripura', isUT: false },
    { code: '17', name: 'Meghalaya', isUT: false },
    { code: '18', name: 'Assam', isUT: false },
    { code: '19', name: 'West Bengal', isUT: false },
    { code: '20', name: 'Jharkhand', isUT: false },
    { code: '21', name: 'Odisha', isUT: false },
    { code: '22', name: 'Chhattisgarh', isUT: false },
    { code: '23', name: 'Madhya Pradesh', isUT: false },
    { code: '24', name: 'Gujarat', isUT: false },
    { code: '25', name: 'Daman and Diu', isUT: true }, // Legacy code, now merged with 26
    { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu', isUT: true },
    { code: '27', name: 'Maharashtra', isUT: false },
    { code: '28', name: 'Andhra Pradesh (Old)', isUT: false }, // Legacy before division
    { code: '29', name: 'Karnataka', isUT: false },
    { code: '30', name: 'Goa', isUT: false },
    { code: '31', name: 'Lakshadweep', isUT: true },
    { code: '32', name: 'Kerala', isUT: false },
    { code: '33', name: 'Tamil Nadu', isUT: false },
    { code: '34', name: 'Puducherry', isUT: true },
    { code: '35', name: 'Andaman and Nicobar Islands', isUT: true },
    { code: '36', name: 'Telangana', isUT: false },
    { code: '37', name: 'Andhra Pradesh', isUT: false },
    { code: '38', name: 'Ladakh', isUT: true },
]

export function isUnionTerritory(code: string): boolean {
    const state = GST_STATE_CODES.find(s => s.code === code)
    return state ? state.isUT : false
}

export function getStateName(code: string): string | undefined {
    return GST_STATE_CODES.find(s => s.code === code)?.name
}
