import { useTranslation } from 'react-i18next'
import './MobileToolbar.css'

export default function MobileToolbar({
  tool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  onQuantize,
}) {
  const { t } = useTranslation()

  const tools = [
    { id: 'pencil', icon: '✏️', label: t('canvas.tool.pencil') },
    { id: 'eraser', icon: '🧹', label: t('canvas.tool.eraser') },
    { id: 'fill', icon: '🪣', label: t('canvas.tool.fill') },
  ]

  return (
    <div className="mobile-toolbar">
      <div className="toolbar-tools">
        {tools.map((t_item) => (
          <button
            key={t_item.id}
            className={`tool-btn ${tool === t_item.id ? 'active' : ''}`}
            onClick={() => onToolChange(t_item.id)}
          >
            <span className="tool-icon">{t_item.icon}</span>
            <span className="tool-label">{t_item.label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-actions">
        <button
          className="action-btn"
          onClick={onUndo}
          disabled={!canUndo}
        >
          ↩️
        </button>
        <button
          className="action-btn"
          onClick={onRedo}
          disabled={!canRedo}
        >
          ↪️
        </button>
        <button className="action-btn" onClick={onQuantize}>
          📷
        </button>
        <button className="action-btn primary" onClick={onExport}>
          📤
        </button>
      </div>
    </div>
  )
}