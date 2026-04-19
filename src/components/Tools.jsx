import { useState, useEffect } from 'react'

const STORAGE_KEY = 'bead_studio_auth'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从 localStorage 恢复登录状态
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 简单验证演示
        if (!email || !email.includes('@')) {
          reject(new Error('请输入有效的邮箱地址'))
          return
        }
        if (password.length < 6) {
          reject(new Error('密码至少需要6个字符'))
          return
        }

        const userData = {
          id: Date.now(),
          email,
          name: email.split('@')[0],
          createdAt: new Date().toISOString()
        }
        setUser(userData)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
        resolve(userData)
      }, 500)
    })
  }

  const register = (email, password, confirmPassword) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email || !email.includes('@')) {
          reject(new Error('请输入有效的邮箱地址'))
          return
        }
        if (password.length < 6) {
          reject(new Error('密码至少需要6个字符'))
          return
        }
        if (password !== confirmPassword) {
          reject(new Error('两次输入的密码不一致'))
          return
        }

        const userData = {
          id: Date.now(),
          email,
          name: email.split('@')[0],
          createdAt: new Date().toISOString()
        }
        setUser(userData)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
        resolve(userData)
      }, 500)
    })
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return { user, loading, login, register, logout }
}

export default function Tools({ tool, onToolChange, gridSize, onGridSizeChange, collapsed, onToggleCollapse, onUndo, onClear, canUndo, onOpenQuantizer }) {
  return (
    <div className={`tools-drawer ${collapsed ? 'collapsed' : ''}`}>
      <button
        className="drawer-toggle left-toggle"
        onClick={onToggleCollapse}
        title={collapsed ? '展开工具栏' : '收起工具栏'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {collapsed ? (
            <path d="M9 18l6-6-6-6"/>
          ) : (
            <path d="M15 18l-6-6 6-6"/>
          )}
        </svg>
      </button>

      <div className="tools-content">
        <h3 className="tools-title">工具</h3>

        <div className="tool-group">
          <div className="tool-icons">
            <button
              className={`tool-btn ${tool === 'pencil' ? 'active' : ''}`}
              onClick={() => onToolChange('pencil')}
              title="画笔 (铅笔)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
            </button>
            <button
              className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => onToolChange('eraser')}
              title="橡皮擦"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 20H7L3 16l9-9 8 8-4 4"/>
                <path d="M6.5 12.5l4 4"/>
              </svg>
            </button>
            <button
              className={`tool-btn ${tool === 'fill' ? 'active' : ''}`}
              onClick={() => onToolChange('fill')}
              title="填充"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 11l-8-8-8.5 8.5a5.5 5.5 0 0 0 7.78 7.78L19 11z"/>
                <path d="M20 23a2 2 0 0 0 2-2c0-1.5-2-2.5-2-4s2-2.5 2-4"/>
                <path d="M3 21l3-3"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="tool-group">
          <label className="tool-label">画布尺寸</label>
          <select
            value={gridSize}
            onChange={(e) => onGridSizeChange(Number(e.target.value))}
            className="tool-select"
          >
            <option value={9}>9 x 9 (小图标)</option>
            <option value={29}>29 x 29 (标准)</option>
            <option value={57}>57 x 57 (大图)</option>
            <option value={114}>114 x 114 (超大)</option>
          </select>
        </div>

        <div className="tool-group">
          <label className="tool-label">快捷操作</label>
          <div className="quick-actions">
            <button className="action-btn" onClick={onClear} title="清空画布">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              清空
            </button>
            <button className="action-btn" onClick={onUndo} disabled={!canUndo} title="撤销">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6"/>
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
              </svg>
              撤销
            </button>
          </div>
        </div>

        <div className="tool-group">
          <label className="tool-label">导入</label>
          <button className="action-btn quantizer-btn" onClick={onOpenQuantizer} title="图片转拼豆">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            图片转拼豆
          </button>
        </div>
      </div>

      <style>{`
        .tools-drawer {
          position: relative;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 16px;
          width: 200px;
          transition: width 0.3s ease;
        }
        .tools-drawer.collapsed {
          width: 56px;
          padding: 12px 8px;
        }
        .tools-drawer.collapsed .tools-content {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }
        .tools-content {
          transition: opacity 0.2s ease, visibility 0.2s ease;
        }
        .drawer-toggle {
          position: absolute;
          top: 50%;
          right: -12px;
          transform: translateY(-50%);
          width: 24px;
          height: 48px;
          border-radius: 0 8px 8px 0;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-left: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s ease;
          color: var(--text-secondary);
        }
        .drawer-toggle:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        .drawer-toggle.left-toggle {
          right: -12px;
        }
        .tools-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .collapsed .tools-title {
          display: none;
        }
        .tool-group {
          margin-bottom: 20px;
        }
        .tool-group:last-child {
          margin-bottom: 0;
        }
        .tool-label {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .tool-icons {
          display: flex;
          gap: 4px;
        }
        .tool-btn {
          flex: 1;
          padding: 10px;
          border-radius: 6px;
          border: 2px solid transparent;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .tool-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .tool-btn.active {
          background: var(--accent);
          color: white;
        }
        .tool-select {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid var(--border-color);
          border-radius: 6px;
          font-size: 13px;
          background: white;
          cursor: pointer;
        }
        .tool-select:focus {
          border-color: var(--accent);
        }
        .quick-actions {
          display: flex;
          gap: 8px;
        }
        .action-btn {
          flex: 1;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          background: white;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s;
        }
        .action-btn:hover {
          border-color: var(--accent);
          background: var(--bg-secondary);
        }
        .action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .quantizer-btn {
          width: 100%;
          color: var(--accent);
          border-color: var(--accent);
        }
        .quantizer-btn:hover {
          background: var(--accent);
          color: white;
        }
      `}</style>
    </div>
  )
}