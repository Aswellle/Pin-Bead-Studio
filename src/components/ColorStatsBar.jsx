/**
 * ColorStatsBar — displays bead count + color count in the left sidebar.
 * Always visible, compact, above the "导出图纸" area.
 *
 * Props:
 *   canvasData: 2D array of hex colors or null
 *   gridSize: current canvas dimension
 *   paletteId: current palette id (for brand color resolution)
 */
import { getPalette } from '../data/palettes'

const resolveToHex = (colorVal, palette) => {
  if (!colorVal) return null
  if (typeof colorVal === 'string' && colorVal.startsWith('#')) return colorVal
  const found = palette.colors.find(c => c.id === colorVal)
  return found ? found.hex : colorVal
}

export default function ColorStatsBar({ canvasData, gridSize, paletteId }) {
  if (!canvasData) {
    return (
      <div className="color-stats-bar empty">
        <div className="stats-empty-text">暂无数据</div>
      </div>
    )
  }

  const palette = getPalette(paletteId || 'perler')
  const counts = {}
  let total = 0

  // Determine actual grid dimensions
  const rows = canvasData.length
  const cols = rows > 0 ? canvasData[0].length : 0

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const raw = canvasData[y]?.[x]
      const hex = resolveToHex(raw, palette)
      if (hex) {
        // Use the hex as the key (works for both old hex-format and new ID-format data)
        counts[hex] = (counts[hex] || 0) + 1
        total++
      }
    }
  }

  const colorCount = Object.keys(counts).length
  const colorList = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <div className="color-stats-bar">
      {/* Summary row */}
      <div className="stats-summary">
        <div className="stats-chip">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
          </svg>
          <span className="stats-chip-value">{total}</span>
          <span className="stats-chip-label">颗珠子</span>
        </div>
        <div className="stats-chip">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <span className="stats-chip-value">{colorCount}</span>
          <span className="stats-chip-label">种颜色</span>
        </div>
      </div>

      {/* Color swatches */}
      {colorList.length > 0 && (
        <div className="stats-swatches">
          {colorList.map(([hex, count]) => (
            <div key={hex} className="stats-swatch-item" title={`${hex} — ${count}颗`}>
              <span
                className="stats-swatch-dot"
                style={{ backgroundColor: hex }}
              />
              <span className="stats-swatch-count">{count}</span>
            </div>
          ))}
          {colorCount > 6 && (
            <span className="stats-more">+{colorCount - 6}</span>
          )}
        </div>
      )}

      <style>{`
        .color-stats-bar {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 12px 14px;
          flex-shrink: 0;
        }
        .color-stats-bar.empty {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stats-empty-text {
          font-size: 12px;
          color: var(--text-muted);
        }
        .stats-summary {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .stats-chip {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: 6px 10px;
        }
        .stats-chip svg {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .stats-chip-value {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }
        .stats-chip-label {
          font-size: 11px;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .stats-swatches {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }
        .stats-swatch-item {
          display: flex;
          align-items: center;
          gap: 3px;
          background: var(--bg-secondary);
          border-radius: 6px;
          padding: 3px 6px;
        }
        .stats-swatch-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.1);
          flex-shrink: 0;
        }
        .stats-swatch-count {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          min-width: 16px;
          text-align: right;
        }
        .stats-more {
          font-size: 11px;
          color: var(--text-muted);
          padding: 3px 4px;
        }
      `}</style>
    </div>
  )
}
