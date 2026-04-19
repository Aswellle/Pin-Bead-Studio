import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'
import jaJP from './locales/ja-JP.json'
import koKR from './locales/ko-KR.json'

const resources = {
  'zh-CN': { translation: zhCN },
  'en-US': { translation: enUS },
  'ja-JP': { translation: jaJP },
  'ko-KR': { translation: koKR },
}

export const LANGUAGES = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
]

export function getLanguageByCode(code) {
  return LANGUAGES.find(l => l.code === code) || LANGUAGES[0]
}

export function detectBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage

  // Exact match
  if (LANGUAGES.some(l => l.code === browserLang)) {
    return browserLang
  }

  // Partial match
  const langCode = browserLang.split('-')[0]
  const match = LANGUAGES.find(l => l.code.startsWith(langCode))
  return match?.code || 'zh-CN'
}

// Load saved language from localStorage
function loadSavedLanguage() {
  try {
    const settings = localStorage.getItem('bead_studio_settings')
    if (settings) {
      const { language } = JSON.parse(settings)
      if (language && LANGUAGES.some(l => l.code === language)) {
        return language
      }
    }
  } catch (e) {
    // ignore
  }
  return detectBrowserLanguage()
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: loadSavedLanguage(),
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  })

// Listen for language changes and save to settings
i18n.on('languageChanged', (lng) => {
  try {
    const settings = JSON.parse(localStorage.getItem('bead_studio_settings') || '{}')
    settings.language = lng
    localStorage.setItem('bead_studio_settings', JSON.stringify(settings))
  } catch (e) {
    // ignore
  }
})

export default i18n