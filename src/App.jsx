import { useState, useEffect, useRef } from 'react'
import AuthModal from './components/AuthModal'
import Header from './components/Header'
import Canvas from './components/Canvas'
import ColorPalette from './components/ColorPalette'
import Tools from './components/Tools'
import ExportPanel from './components/ExportPanel'
import Gallery from './components/Gallery'
import Tutorials from './components/Tutorials'
import ImageQuantizer from './components/ImageQuantizer/ImageQuantizer'
import ColorStatsBar from './components/ColorStatsBar'
import { useAuth } from './hooks/useAuth'
import { useResponsive } from './hooks/useResponsive'
import MobileToolbar from './components/Tools/MobileToolbar'
import MobileColorPalette from './components/ColorPalette/MobileColorPalette'
import { getPalette, PALETTES } from './data/palettes'

export default function App() {
  const { user, loading: authLoading, login, register, logout } = useAuth()
  const { isMobile, isTablet } = useResponsive()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [selectedColor, setSelectedColor] = useState('#E53935')
  const [tool, setTool] = useState('pencil')
  const [gridSize, setGridSize] = useState(29)
  const [gridWidth, setGridWidth] = useState(null)
  const [gridHeight, setGridHeight] = useState(null)
  const [canvasData, setCanvasData] = useState(null)
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)
  const [currentPage, setCurrentPage] = useState('canvas')
  const [savedWorks, setSavedWorks] = useState(() => {
    const saved = localStorage.getItem('saved-works')
    return saved ? JSON.parse(saved) : []
  })
  const [showQuantizer, setShowQuantizer] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [currentPalette, setCurrentPalette] = useState('perler')
  const [designName, setDesignName] = useState('拼豆图案')

  // 撤销历史
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [canUndo, setCanUndo] = useState(false)
  // 防止 useEffect 在 undo/redo 触发 canvasData 变化时错误地写入历史
  const isUndoRedoRef = useRef(false)

  // 初始化空白画布
  useEffect(() => {
    if (!canvasData) {
      const emptyGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null))
      setCanvasData(emptyGrid)
    }
  }, [gridSize, canvasData])

  // 保存历史记录（仅在用户操作触发时，不在 undo/redo 时）
  useEffect(() => {
    if (!canvasData) return
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false
      return
    }
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.stringify(canvasData))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setCanUndo(newHistory.length > 1)
  }, [canvasData])

  // 撤销处理
  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true
      setHistoryIndex(historyIndex - 1)
      setCanvasData(JSON.parse(history[historyIndex - 1]))
      setCanUndo(historyIndex - 1 > 0)
    }
  }

  // 重做处理
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true
      setHistoryIndex(historyIndex + 1)
      setCanvasData(JSON.parse(history[historyIndex + 1]))
      setCanUndo(true)
    }
  }

  // 清空画布（可撤销；尊重矩形网格尺寸）
  const handleClearCanvas = () => {
    const rows = gridHeight || gridSize
    const cols = gridWidth || gridSize
    const emptyGrid = Array(rows).fill(null).map(() => Array(cols).fill(null))
    setCanvasData(emptyGrid)
  }

  // 保存作品到 localStorage
  const handleSaveWork = (works) => {
    setSavedWorks(works)
    localStorage.setItem('saved-works', JSON.stringify(works))
  }

  const openLogin = () => {
    setAuthMode('login')
    setShowAuth(true)
  }

  const openRegister = () => {
    setAuthMode('register')
    setShowAuth(true)
  }

  const handleGridSizeChange = (newSize) => {
    setGridSize(newSize)
    setGridWidth(null)
    setGridHeight(null)
    const emptyGrid = Array(newSize).fill(null).map(() => Array(newSize).fill(null))
    setCanvasData(emptyGrid)
  }

  // 加载模板到画布
  const handleLoadTemplate = (pattern, size) => {
    setGridSize(size)
    setCanvasData(pattern)
    setCurrentPage('canvas')
  }

  // 页面切换
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // 处理图片量化结果应用到画布
  // canvasData 中的颜色值可能是品牌 ID（如 'P18'）或 hex 字符串，
  // 需要解析为 hex 以便 Canvas 的 ctx.fillStyle 正确渲染
  const resolveToHex = (colorVal, palette) => {
    if (!colorVal) return null
    if (typeof colorVal === 'string' && colorVal.startsWith('#')) return colorVal
    const found = palette.colors.find(c => c.id === colorVal)
    if (found) return found.hex
    // 切换色板场景：在所有色板中搜索
    for (const p of Object.values(PALETTES)) {
      const hit = p.colors.find(c => c.id === colorVal)
      if (hit) return hit.hex
    }
    console.warn('resolveToHex: 无法解析颜色值', colorVal)
    return null
  }

  const handleQuantizerApply = (quantizedCanvasData, options) => {
    const w = options.gridWidth || options.gridSize
    const h = options.gridHeight || options.gridSize
    setGridSize(Math.max(w, h))
    setGridWidth(w !== h ? w : null)
    setGridHeight(w !== h ? h : null)

    // 将品牌 ID（如 'P18'）解析为 hex 字符串，以便 Canvas 正确渲染
    const palette = getPalette(options.palette || currentPalette)
    const resolvedData = quantizedCanvasData.map(row =>
      row.map(cell => resolveToHex(cell, palette))
    )
    setCanvasData(resolvedData)
    if (options.palette) setCurrentPalette(options.palette)
    setCurrentPage('canvas')
  }

  // 画布相关属性
  const canvasProps = {
    gridSize,
    gridWidth,
    gridHeight,
    selectedColor,
    tool,
    canvasData,
    onCanvasChange: setCanvasData,
  }

  // 移动端布局
  const renderMobileLayout = () => (
    <div className="app mobile-layout">
      <Header
        user={user}
        onLogin={openLogin}
        onRegister={openRegister}
        onLogout={logout}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        simplified
      />

      <div className="mobile-canvas-area">
        <Canvas {...canvasProps} />
      </div>

      <MobileColorPalette
        selectedColor={selectedColor}
        onColorSelect={setSelectedColor}
        currentPalette={currentPalette}
        onPaletteChange={setCurrentPalette}
      />

      <MobileToolbar
        tool={tool}
        onToolChange={setTool}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={historyIndex < history.length - 1}
        onExport={() => setShowExport(true)}
        onQuantize={() => setShowQuantizer(true)}
      />

      {showExport && (
        <ExportPanel
          canvasData={canvasData}
          gridSize={gridSize}
          designName={designName}
          paletteId={currentPalette}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )

  // 渲染画布页面（桌面端）
  const renderCanvasPage = () => (
    <div className="workspace">
      <aside className={`sidebar left-sidebar${leftSidebarCollapsed ? ' collapsed' : ''}`}>
        <div className="left-sidebar-top">
          <Tools
            tool={tool}
            onToolChange={setTool}
            gridSize={gridSize}
            onGridSizeChange={handleGridSizeChange}
            collapsed={leftSidebarCollapsed}
            onToggleCollapse={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            onUndo={handleUndo}
            onClear={handleClearCanvas}
            canUndo={canUndo}
            onOpenQuantizer={() => setShowQuantizer(true)}
          />
        </div>
        <div className="left-sidebar-bottom">
          <div className="sidebar-divider" />
          <ColorStatsBar
            canvasData={canvasData}
            gridSize={gridSize}
            paletteId={currentPalette}
          />
          <ExportPanel
            canvasData={canvasData}
            gridSize={gridSize}
            designName={designName}
            paletteId={currentPalette}
          />
        </div>
      </aside>

      <div className="canvas-area">
        <Canvas {...canvasProps} />
      </div>

      <aside className="sidebar right-sidebar">
        <ColorPalette
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
          currentPalette={currentPalette}
          onPaletteChange={setCurrentPalette}
          collapsed={rightSidebarCollapsed}
          onToggleCollapse={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
        />
      </aside>
    </div>
  )

  // 渲染当前页面
  const renderPage = () => {
    switch (currentPage) {
      case 'gallery':
        return (
          <Gallery
            onLoadTemplate={handleLoadTemplate}
            onSaveWork={handleSaveWork}
            savedWorks={savedWorks}
          />
        )
      case 'tutorials':
        return <Tutorials />
      default:
        return renderCanvasPage()
    }
  }

  // 桌面端布局
  const renderDesktopLayout = () => (
    <div className="app desktop-layout">
      <Header
        user={user}
        onLogin={openLogin}
        onRegister={openRegister}
        onLogout={logout}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <main className="main-content">
        {renderPage()}
      </main>

      {showAuth && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuth(false)}
          onLogin={login}
          onRegister={register}
          onSwitchMode={(mode) => setAuthMode(mode)}
        />
      )}

      {showQuantizer && (
        <ImageQuantizer
          onApply={handleQuantizerApply}
          onClose={() => setShowQuantizer(false)}
        />
      )}

      <style>{`
        .left-sidebar {
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
          flex-shrink: 0;
          height: calc(100vh - 60px);
        }
        .left-sidebar-top {
          flex-shrink: 0;
        }
        .left-sidebar-bottom {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .sidebar-divider {
          height: 1px;
          background: var(--border-color);
          margin: 8px 0;
          flex-shrink: 0;
        }
        .right-sidebar .palette-drawer {
          height: 100%;
        }
        .left-sidebar.collapsed {
          width: 56px;
          transition: width 0.2s ease;
        }
        .left-sidebar.collapsed .left-sidebar-bottom {
          display: none;
        }
        .left-sidebar.collapsed .left-sidebar-top {
          width: 56px;
        }
      `}</style>
    </div>
  )

  // 根据设备类型渲染不同布局
  if (isMobile || isTablet) {
    return renderMobileLayout()
  }

  return renderDesktopLayout()
}