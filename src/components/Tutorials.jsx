import { useState, useEffect } from 'react'
import { TUTORIALS, getAllTutorials } from '../data/tutorials'

export default function Tutorials() {
  const [expandedSections, setExpandedSections] = useState(['getting-started'])
  const [selectedTutorial, setSelectedTutorial] = useState(TUTORIALS[0].children[0])
  const [readProgress, setReadProgress] = useState(() => {
    const saved = localStorage.getItem('tutorial-progress')
    return saved ? JSON.parse(saved) : []
  })

  // 初始化选中第一个教程
  useEffect(() => {
    if (!selectedTutorial) {
      setSelectedTutorial(TUTORIALS[0].children[0])
    }
  }, [])

  // 保存阅读进度
  useEffect(() => {
    localStorage.setItem('tutorial-progress', JSON.stringify(readProgress))
  }, [readProgress])

  // 切换章节展开/收起
  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  // 选中教程
  const selectTutorial = (tutorial) => {
    setSelectedTutorial(tutorial)
    // 标记为已读
    if (!readProgress.includes(tutorial.id)) {
      setReadProgress(prev => [...prev, tutorial.id])
    }
  }

  // 标记全部已读
  const markAllRead = () => {
    const allIds = getAllTutorials().map(t => t.id)
    setReadProgress(allIds)
  }

  // 重置进度
  const resetProgress = () => {
    setReadProgress([])
  }

  // 计算进度百分比
  const totalTutorials = getAllTutorials().length
  const progressPercent = Math.round((readProgress.length / totalTutorials) * 100)

  return (
    <div className="tutorials-page">
      <div className="tutorials-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">教程目录</h2>
          <div className="progress-info">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="progress-text">{readProgress.length}/{totalTutorials}</span>
          </div>
          <div className="progress-actions">
            <button className="progress-btn" onClick={markAllRead}>全部标为已读</button>
            <button className="progress-btn reset" onClick={resetProgress}>重置</button>
          </div>
        </div>

        <nav className="tutorial-nav">
          {TUTORIALS.map(section => (
            <div key={section.id} className="nav-section">
              <button
                className={`section-header ${expandedSections.includes(section.id) ? 'expanded' : ''}`}
                onClick={() => toggleSection(section.id)}
              >
                <span className="section-icon">{section.icon}</span>
                <span className="section-title">{section.title}</span>
                <svg
                  className="chevron"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {expandedSections.includes(section.id) && (
                <div className="section-content">
                  {section.children.map(tutorial => (
                    <button
                      key={tutorial.id}
                      className={`tutorial-link ${selectedTutorial?.id === tutorial.id ? 'active' : ''}`}
                      onClick={() => selectTutorial(tutorial)}
                    >
                      <span className="tutorial-title">{tutorial.title}</span>
                      {readProgress.includes(tutorial.id) && (
                        <svg
                          className="check-icon"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#4CAF50"
                          strokeWidth="2"
                        >
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="tutorials-content">
        {selectedTutorial ? (
          <>
            <div className="content-header">
              <div className="breadcrumb">
                <span>{TUTORIALS.find(s => s.children.some(c => c.id === selectedTutorial.id))?.title}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
                <span className="current">{selectedTutorial.title}</span>
              </div>
              <h1 className="content-title">{selectedTutorial.title}</h1>
            </div>

            <div className="content-body">
              {/* 教程正文 */}
              <div className="tutorial-content">
                {selectedTutorial.content.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {/* 步骤列表 */}
              {selectedTutorial.steps && (
                <div className="steps-section">
                  <h3 className="steps-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <line x1="10" y1="9" x2="8" y2="9"/>
                    </svg>
                    操作步骤
                  </h3>
                  <ol className="steps-list">
                    {selectedTutorial.steps.map((step, index) => (
                      <li key={index} className="step-item">
                        <span className="step-number">{index + 1}</span>
                        <span className="step-text">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* 提示框 */}
              {selectedTutorial.tips && (
                <div className="tips-box">
                  <div className="tips-header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>小贴士</span>
                  </div>
                  <p className="tips-content">{selectedTutorial.tips}</p>
                </div>
              )}

              {/* 图片占位 */}
              <div className="image-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>示意图</span>
              </div>
            </div>

            {/* 导航按钮 */}
            <div className="content-footer">
              <NavigationButtons
                currentTutorial={selectedTutorial}
                onSelect={selectTutorial}
              />
            </div>
          </>
        ) : (
          <div className="no-selection">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <p>选择一个教程开始学习</p>
          </div>
        )}
      </div>

      <style>{`
        .tutorials-page {
          display: flex;
          height: calc(100vh - 80px);
          max-width: 1400px;
          margin: 0 auto;
        }
        .tutorials-sidebar {
          width: 280px;
          flex-shrink: 0;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid var(--border-color);
        }
        .sidebar-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .progress-info {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .progress-bar {
          flex: 1;
          height: 6px;
          background: var(--bg-tertiary);
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: var(--success);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        .progress-text {
          font-size: 12px;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .progress-actions {
          display: flex;
          gap: 8px;
        }
        .progress-btn {
          padding: 6px 10px;
          font-size: 11px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--bg-primary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .progress-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .progress-btn.reset {
          color: var(--error);
        }
        .progress-btn.reset:hover {
          border-color: var(--error);
          background: var(--error);
          color: white;
        }
        .tutorial-nav {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        .nav-section {
          margin-bottom: 8px;
        }
        .section-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border: none;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
        }
        .section-header:hover {
          background: var(--bg-tertiary);
        }
        .section-icon {
          font-size: 16px;
        }
        .section-title {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
        }
        .chevron {
          color: var(--text-muted);
          transition: transform 0.2s;
        }
        .section-header.expanded .chevron {
          transform: rotate(180deg);
        }
        .section-content {
          padding-left: 12px;
        }
        .tutorial-link {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }
        .tutorial-link:hover {
          background: var(--bg-tertiary);
        }
        .tutorial-link.active {
          background: var(--accent);
          color: white;
        }
        .tutorial-link.active .check-icon {
          stroke: white;
        }
        .tutorial-title {
          font-size: 13px;
        }
        .check-icon {
          flex-shrink: 0;
        }
        .tutorials-content {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
          padding: 32px 40px;
        }
        .content-header {
          margin-bottom: 32px;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 12px;
        }
        .breadcrumb .current {
          color: var(--text-secondary);
        }
        .content-title {
          font-size: 28px;
          font-weight: 600;
        }
        .content-body {
          max-width: 800px;
        }
        .tutorial-content {
          margin-bottom: 32px;
        }
        .tutorial-content p {
          font-size: 15px;
          line-height: 1.8;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }
        .tutorial-content p:last-child {
          margin-bottom: 0;
        }
        .steps-section {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .steps-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--text-primary);
        }
        .steps-list {
          list-style: none;
          counter-reset: step;
        }
        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
          counter-increment: step;
        }
        .step-item:last-child {
          margin-bottom: 0;
        }
        .step-number {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent);
          color: white;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 600;
        }
        .step-text {
          font-size: 14px;
          line-height: 1.6;
          padding-top: 2px;
          color: var(--text-secondary);
        }
        .tips-box {
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          border-left: 4px solid #1976D2;
          border-radius: 0 8px 8px 0;
          padding: 16px 20px;
          margin-bottom: 24px;
        }
        .tips-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #1976D2;
          margin-bottom: 8px;
        }
        .tips-content {
          font-size: 14px;
          line-height: 1.6;
          color: #1565C0;
        }
        .image-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 48px;
          background: var(--bg-secondary);
          border: 2px dashed var(--border-color);
          border-radius: 12px;
          color: var(--text-muted);
          margin-bottom: 24px;
        }
        .image-placeholder span {
          font-size: 13px;
        }
        .content-footer {
          max-width: 800px;
          padding-top: 24px;
          border-top: 1px solid var(--border-color);
          margin-top: 32px;
        }
        .no-selection {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-muted);
        }
        .no-selection svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: 2px solid var(--border-color);
          border-radius: 6px;
          background: transparent;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-btn:hover:not(:disabled) {
          border-color: var(--accent);
          color: var(--accent);
        }
        .nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .nav-btn-group {
          display: flex;
          justify-content: space-between;
        }
      `}</style>
    </div>
  )
}

// 导航按钮组件
function NavigationButtons({ currentTutorial, onSelect }) {
  const allTutorials = getAllTutorials()
  const currentIndex = allTutorials.findIndex(t => t.id === currentTutorial?.id)

  const prevTutorial = currentIndex > 0 ? allTutorials[currentIndex - 1] : null
  const nextTutorial = currentIndex < allTutorials.length - 1 ? allTutorials[currentIndex + 1] : null

  return (
    <div className="nav-btn-group">
      <button
        className="nav-btn"
        disabled={!prevTutorial}
        onClick={() => prevTutorial && onSelect(prevTutorial)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5"/>
          <path d="M12 19l-7-7 7-7"/>
        </svg>
        上一篇：{prevTutorial?.title || '没有了'}
      </button>
      <button
        className="nav-btn"
        disabled={!nextTutorial}
        onClick={() => nextTutorial && onSelect(nextTutorial)}
      >
        下一篇：{nextTutorial?.title || '没有了'}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14"/>
          <path d="M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  )
}
