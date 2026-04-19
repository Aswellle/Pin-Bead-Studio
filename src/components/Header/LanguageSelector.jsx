import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../../i18n'
import './LanguageSelector.css'

export default function LanguageSelector() {
  const { i18n } = useTranslation()

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  const handleChange = (e) => {
    i18n.changeLanguage(e.target.value)
  }

  return (
    <div className="language-selector">
      <select
        value={i18n.language}
        onChange={handleChange}
        className="language-select"
        title={currentLang.name}
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  )
}