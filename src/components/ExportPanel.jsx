import { useState } from 'react'
import { PERLER_COLORS } from './ColorPalette'
import { getPalette } from '../data/palettes'
import { exportAsPNG, exportAsSVG } from '../services/BeadPatternExporter'

// 将品牌 ID（如 'P18'）解析为 hex 字符串，以便 Canvas/SVG 正确渲染
const resolveToHex = (colorVal, palette) => {
  if (!colorVal) return null
  if (typeof colorVal === 'string' && colorVal.startsWith('#')) return colorVal
  const found = palette.colors.find(c => c.id === colorVal)
  return found ? found.hex : colorVal
}

export default function ExportPanel({ canvasData, gridSize, gridWidth, gridHeight, designName = '拼豆图案', paletteId = 'perler' }) {
  const [showExport, setShowExport] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const palette = getPalette(paletteId)

  // 统计每种颜色的数量（以品牌 ID 为 key，兼容 hex 字符串）
  const getColorCount = () => {
    if (!canvasData) return {}

    const counts = {}
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const color = canvasData[y]?.[x]
        if (color) {
          counts[color] = (counts[color] || 0) + 1
        }
      }
    }
    return counts
  }

  const colorCounts = getColorCount()
  const totalBeads = Object.values(colorCounts).reduce((a, b) => a + b, 0)

  const handleExportImage = () => {
    if (!canvasData) return

    const CELL_SIZE = 20
    const BEAD_RADIUS = CELL_SIZE / 2 - 1

    const canvas = document.createElement('canvas')
    canvas.width = gridSize * CELL_SIZE
    canvas.height = gridSize * CELL_SIZE
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const color = canvasData[y]?.[x]
        const hex = resolveToHex(color, palette)
        if (hex) {
          ctx.fillStyle = hex
          ctx.beginPath()
          ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            BEAD_RADIUS,
            0, Math.PI * 2
          )
          ctx.fill()
        }
      }
    }

    const link = document.createElement('a')
    link.download = `bead-pattern-${gridSize}x${gridSize}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleExportText = () => {
    // 生成带颜色编号的文本图纸
    const today = new Date().toISOString().split('T')[0]

    let text = `拼豆图纸\n`
    text += `${gridSize} x ${gridSize} 格子\n`
    text += `日期：${today}\n`
    text += `${'═'.repeat(gridSize * 3 + 10)}\n\n`

    // 颜色对照表（按使用频率排序）
    const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])
    text += `【颜色对照表】\n`
    sortedColors.forEach(([color, count], idx) => {
      const idxInPalette = PERLER_COLORS.indexOf(color)
      const code = idxInPalette >= 0 ? String(idxInPalette).padStart(2, '0') : '--'
      text += `  [${code}] ${color} - ${count}颗\n`
    })
    text += '\n'

    // 带编号的图纸
    text += `【图纸】每格一个数字，00表示空\n`
    text += `${'─'.repeat(gridSize * 3 + 3)}\n`

    // 列编号
    text += '   '
    for (let x = 0; x < gridSize; x++) {
      text += String.fromCharCode(65 + (x % 26))  // A, B, C... 循环
    }
    text += '\n'

    for (let y = 0; y < gridSize; y++) {
      text += String(y + 1).padStart(3, ' ') + ' '
      for (let x = 0; x < gridSize; x++) {
        const color = canvasData[y]?.[x]
        if (color) {
          const idx = PERLER_COLORS.indexOf(color)
          text += idx >= 0 ? String(idx).padStart(2, '0') : '??'
        } else {
          text += '  '
        }
        text += ' '
      }
      text += '\n'
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.download = `bead-pattern-${gridSize}x${gridSize}.txt`
    link.href = URL.createObjectURL(blob)
    link.click()
  }

  const handleExportSVG = () => {
    if (!canvasData) return

    const CELL_SIZE = 20
    const BEAD_RADIUS = CELL_SIZE / 2 - 1

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gridSize * CELL_SIZE} ${gridSize * CELL_SIZE}">\n`
    svg += `  <rect width="${gridSize * CELL_SIZE}" height="${gridSize * CELL_SIZE}" fill="white"/>\n`

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const color = canvasData[y]?.[x]
        const hex = resolveToHex(color, palette)
        if (hex) {
          const cx = x * CELL_SIZE + CELL_SIZE / 2
          const cy = y * CELL_SIZE + CELL_SIZE / 2
          svg += `  <circle cx="${cx}" cy="${cy}" r="${BEAD_RADIUS}" fill="${hex}"/>\n`
        }
      }
    }
    svg += '</svg>'

    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const link = document.createElement('a')
    link.download = `bead-pattern-${gridSize}x${gridSize}.svg`
    link.href = URL.createObjectURL(blob)
    link.click()
  }

  const handleExportPatternSheet = async () => {
    if (!canvasData || isExporting) return
    setIsExporting(true)
    setExportProgress(0)
    await exportAsPNG(canvasData, gridSize, paletteId, designName, palette, {
      gridWidth,
      gridHeight,
      onProgress: (_phase, pct) => setExportProgress(Math.round(pct * 100))
    })
    setIsExporting(false)
    setExportProgress(0)
  }

  const handleExportPatternSheetSVG = () => {
    if (!canvasData) return
    exportAsSVG(canvasData, gridSize, paletteId, designName, palette, gridWidth, gridHeight)
  }

  return (
    <div className="export-panel">
      <button
        className="export-toggle"
        onClick={() => setShowExport(!showExport)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        导出图纸
        <span className={`arrow ${showExport ? 'up' : ''}`}>▼</span>
      </button>

      {showExport && (
        <div className="export-content">
          <div className="export-buttons">
            <button onClick={handleExportImage} className="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
              PNG 图片
            </button>
            <button onClick={handleExportSVG} className="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12,2 2,7 12,12 22,7 12,2"/>
                <polyline points="2,17 12,22 22,17"/>
                <polyline points="2,12 12,17 22,12"/>
              </svg>
              SVG 矢量
            </button>
            <button onClick={handleExportText} className="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              图纸文本
            </button>
            <div className="export-divider" />
            <button onClick={handleExportPatternSheet} className="btn btn-primary btn-pattern" disabled={isExporting}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="15" y1="3" x2="15" y2="21"/>
              </svg>
              {isExporting ? `生成中 ${exportProgress}%` : '拼豆图纸 PNG'}
            </button>
            {isExporting && (
              <div style={{ height: 4, background: '#e0e0e0', borderRadius: 2, margin: '4px 0' }}>
                <div style={{ height: '100%', width: `${exportProgress}%`, background: '#4a90d9', borderRadius: 2, transition: 'width 0.1s' }} />
              </div>
            )}
            <button onClick={handleExportPatternSheetSVG} className="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="15" y1="3" x2="15" y2="21"/>
              </svg>
              拼豆图纸 SVG
            </button>
          </div>
        </div>
      )}

      <style>{`
        .export-panel {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          overflow: hidden;
          width: 200px;
        }
        .export-toggle {
          width: 100%;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .export-toggle:hover {
          background: var(--bg-secondary);
        }
        .arrow {
          margin-left: auto;
          font-size: 10px;
          transition: transform 0.2s;
        }
        .arrow.up {
          transform: rotate(180deg);
        }
        .export-content {
          padding: 0 12px 12px;
        }
        .export-stats {
          display: flex;
          gap: 16px;
          padding: 12px;
          background: var(--bg-secondary);
          border-radius: 8px;
          margin-bottom: 12px;
        }
        .stat {
          display: flex;
          flex-direction: column;
        }
        .stat-value {
          font-size: 18px;
          font-weight: 600;
        }
        .stat-label {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .color-legend {
          margin-bottom: 12px;
        }
        .color-legend h4 {
          font-size: 11px;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
        .legend-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          background: var(--bg-secondary);
          border-radius: 4px;
        }
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          border: 1px solid rgba(0,0,0,0.1);
        }
        .legend-count {
          font-size: 11px;
          font-weight: 600;
        }
        .export-buttons {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .export-buttons .btn {
          justify-content: flex-start;
          padding: 10px 12px;
          font-size: 12px;
        }
        .export-divider {
          height: 1px;
          background: var(--border-color);
          margin: 8px 0;
        }
        .btn-pattern {
          background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
          color: white;
          border: none;
          font-weight: 600;
        }
        .btn-pattern:hover {
          background: linear-gradient(135deg, #C62828 0%, #B71C1C 100%);
        }
      `}</style>
    </div>
  )
}
