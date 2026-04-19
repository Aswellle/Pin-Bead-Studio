import { create } from 'zustand'
import { getLanguageByCode } from '../i18n'

const defaultSettings = {
  language: 'zh-CN',
  defaultPalette: 'perler',
  defaultGridSize: 29,
  theme: 'light',
  autoSave: true,
  autoSaveInterval: 30000,
  showGridLines: true,
  beadRender: 'circle',
  defaultTool: 'pencil',
}

export const useSettingsStore = create((set, get) => ({
  settings: defaultSettings,

  updateSettings: (updates) => set((state) => ({
    settings: { ...state.settings, ...updates }
  })),

  setLanguage: (langCode) => {
    const lang = getLanguageByCode(langCode)
    set((state) => ({
      settings: { ...state.settings, language: langCode }
    }))
  },

  resetSettings: () => set({ settings: defaultSettings }),

  // Persistence to localStorage
  loadSettings: () => {
    try {
      const saved = localStorage.getItem('bead_studio_settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        set({ settings: { ...defaultSettings, ...parsed } })
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  },

  saveSettings: () => {
    const { settings } = get()
    localStorage.setItem('bead_studio_settings', JSON.stringify(settings))
  },
}))