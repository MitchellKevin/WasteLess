import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import nl from './nl.json'

const saved = localStorage.getItem('lang')
const detected = navigator.language.startsWith('nl') ? 'nl' : 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    nl: { translation: nl },
  },
  lng: saved || detected,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
