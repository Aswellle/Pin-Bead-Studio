import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PALETTE_LIST } from '../../data/palettes'
import './MobileColorPalette.css'

export default function MobileColorPalette({
  selectedColor,
  onColorSelect,
  currentPalette,
  onPaletteChange,
}) {
  const { t } = useTranslation()
  const [showPalette, setShowPalette] = useState(false)

  const palette = PALETTE_LIST.find(p => p.id === currentPalette) || PALETTE_LIST[0]
  const recentColors = JSON.parse(localStorage.getItem('bead_studio_recent_colors') || '[]')

  const handleColorSelect = (color) => {
    onColorSelect(color)

    // 保存最近使用的颜色
    const recent = [color, ...recentColors.filter(c => c !== color)].slice(0, 8)
    localStorage.setItem('bead_studio_recent_colors', JSON.stringify(recent))
  }

  return (
    <div className="mobile-color-palette">
      {/* 当前颜色预览 */}
      <button
        className="current-color-btn"
        onClick={() => setShowPalette(!showPalette)}
      >
        <div
          className="color-preview"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="color-hex">{selectedColor}</span>
        <span className="toggle-icon">{showPalette ? '▲' : '▼'}</span>
      </button>

      {/* 展开的色卡 */}
      {showPalette && (
        <div className="palette-expanded">
          {/* 品牌选择 */}
          <div className="palette-brands">
            {PALETTE_LIST.map(brand => (
              <button
                key={brand.id}
                className={`brand-tab ${currentPalette === brand.id ? 'active' : ''}`}
                onClick={() => onPaletteChange(brand.id)}
              >
                {brand.name}
              </button>
            ))}
          </div>

          {/* 最近使用 */}
          {recentColors.length > 0 && (
            <div className="recent-colors">
              <span className="section-label">{t('palette.recent')}</span>
              <div className="color-row">
                {recentColors.map((color, idx) => (
                  <button
                    key={`recent-${idx}`}
                    className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 色卡网格 */}
          <div className="color-grid">
            {palette.colors.map((color) => (
              <button
                key={color.id}
                className={`color-swatch ${selectedColor === color.hex ? 'selected' : ''}`}
                style={{ backgroundColor: color.hex }}
                onClick={() => handleColorSelect(color.hex)}
                title={color.nameZh || color.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}