import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { useUIStore } from '../stores/ui.store'

import enTranslations from '../locales/en.json'
import hiTranslations from '../locales/hi.json'

const resources = {
    en: { translation: enTranslations },
    hi: { translation: hiTranslations }
}

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: useUIStore.getState().language, // initial language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // React already escapes values
        }
    })

// Subscribe to store changes to update i18n language dynamically
useUIStore.subscribe((state, prevState) => {
    if (state.language !== prevState.language) {
        i18n.changeLanguage(state.language)
    }
})

export default i18n
