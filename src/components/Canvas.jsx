import { useState, useRef, useEffect, useCallback } from 'react'
import { useGestures } from '../hooks/useGestures'

export default function Canvas({
  gridSize,
  gridWidth,
  gridHeight,
  selectedColor,
  tool,
  canvasData,
  onCanvasChange
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hoverCell, setHoverCell] = useState(null)
  const [isPanning, setIsPanning] = useState(false)
  const lastDrawTouchRef = useRef(null)
  const touchStartRef = useRef(null)
  const touchMovedRef = useRef(false)
  const panStartRef = useRef(null)
  const panStartTransformRef = useRef(null)

  const CELL_SIZE = 16
  const cols = gridWidth || gridSize
  const rows = gridHeight || gridSize
  const canvasWidth = cols * CELL_SIZE
  const canvasHeight = rows * CELL_SIZE

  // 计算容器内可用区域（减去左右 padding）
  const containerPadding = 60
  const availableW = containerRef.current
    ? containerRef.current.clientWidth - containerPadding * 2
    : 800
  const availableH = containerRef.current
    ? containerRef.current.clientHeight - containerPadding * 2
    : 600

  // 根据当前 scale 计算并返回钳位后的坐标
  const applyClamp = useCallback((x, y, scale) => {
    const scaledGridW = canvasWidth * scale
    const scaledGridH = canvasHeight * scale
    const maxPanX = Math.max(0, (scaledGridW - availableW) / 2)
    const maxPanY = Math.max(0, (scaledGridH - availableH) / 2)
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, y)),
    }
  }, [canvasWidth, canvasHeight, availableW, availableH])

  const { ref: gestureRef, transform, resetTransform, setTransform } = useGestures({
    minScale: 0.3,
    maxScale: 5,
    friction: 0.88,
    bounceIntensity: 0.2,
    minX: -canvasWidth * 2,
    maxX: canvasWidth * 2,
    minY: -canvasHeight * 2,
    maxY: canvasHeight * 2,
  })

  const setContainerRef = useCallback((element) => {
    containerRef.current = element
    gestureRef.current = element
  }, [gestureRef])

  // 绘制网格
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    if (canvasData) {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (canvasData[y] && canvasData[y][x]) {
            ctx.fillStyle = canvasData[y][x]
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
          }
        }
      }
    }

    ctx.strokeStyle = '#d4d4d4'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= cols; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, canvasHeight)
      ctx.stroke()
    }
    for (let i = 0; i <= rows; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(canvasWidth, i * CELL_SIZE)
      ctx.stroke()
    }

    if (hoverCell && tool === 'pencil') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
      ctx.fillRect(hoverCell.x * CELL_SIZE, hoverCell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.lineWidth = 2
      ctx.strokeRect(hoverCell.x * CELL_SIZE, hoverCell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    }
  }, [canvasData, cols, rows, hoverCell, tool, canvasWidth, canvasHeight])

  const getGridPos = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = Math.floor((clientX - rect.left) * scaleX / CELL_SIZE)
    const y = Math.floor((clientY - rect.top) * scaleY / CELL_SIZE)

    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      return { x, y }
    }
    return null
  }, [cols, rows])

  const isOverCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return false
    const rect = canvas.getBoundingClientRect()
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    )
  }, [])

  const drawCell = useCallback((x, y) => {
    if (!canvasData) return

    const newData = canvasData.map(row => [...row])

    if (tool === 'pencil') {
      newData[y][x] = selectedColor
    } else if (tool === 'eraser') {
      newData[y][x] = null
    } else if (tool === 'fill') {
      const targetColor = canvasData[y][x]
      const fillColor = selectedColor
      if (targetColor === fillColor) return

      const stack = [[x, y]]
      const visited = new Set()

      while (stack.length > 0) {
        const [cx, cy] = stack.pop()
        const key = `${cx},${cy}`

        if (visited.has(key)) continue
        if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) continue
        if (canvasData[cy][cx] !== targetColor) continue

        visited.add(key)
        newData[cy][cx] = fillColor

        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
      }
    }

    onCanvasChange(newData)
  }, [canvasData, selectedColor, tool, cols, rows, onCanvasChange])

  // ==================== PC 端鼠标拖拽平移 ====================
  const handleContainerMouseDown = useCallback((e) => {
    if (e.button !== 0) return

    // 检查是否在 canvas 区域外
    if (!isOverCanvas(e.clientX, e.clientY)) {
      e.preventDefault()
      setIsPanning(true)
      panStartRef.current = { x: e.clientX, y: e.clientY }
      panStartTransformRef.current = { x: transform.x, y: transform.y }
    }
  }, [isOverCanvas, transform])

  const handleContainerMouseMove = useCallback((e) => {
    if (!isPanning || !panStartRef.current) return

    const dx = e.clientX - panStartRef.current.x
    const dy = e.clientY - panStartRef.current.y

    const rawX = panStartTransformRef.current.x + dx
    const rawY = panStartTransformRef.current.y + dy
    const clamped = applyClamp(rawX, rawY, transform.scale)

    setTransform(prev => ({
      ...prev,
      x: clamped.x,
      y: clamped.y,
    }))
  }, [isPanning, setTransform, transform, applyClamp])

  const handleContainerMouseUp = useCallback(() => {
    setIsPanning(false)
    panStartRef.current = null
    panStartTransformRef.current = null
  }, [])

  // ==================== 触控处理 ====================
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      touchStartRef.current = null
      touchMovedRef.current = false
      return
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const pos = getGridPos(touch.clientX, touch.clientY)

      touchStartRef.current = { x: touch.clientX, y: touch.clientY, gridPos: pos }
      touchMovedRef.current = false

      if (!pos) {
        // 触碰在 canvas 外 → 开始平移
        panStartRef.current = { x: touch.clientX, y: touch.clientY }
        panStartTransformRef.current = { x: transform.x, y: transform.y }
      }
    }
  }, [getGridPos, transform])

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      panStartRef.current = null
      panStartTransformRef.current = null
      return
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0]

      // 如果有 panStartRef，说明在 canvas 外，直接平移
      if (panStartRef.current) {
        e.preventDefault()
        const dx = touch.clientX - panStartRef.current.x
        const dy = touch.clientY - panStartRef.current.y

        const rawX = panStartTransformRef.current.x + dx
        const rawY = panStartTransformRef.current.y + dy
        const clamped = applyClamp(rawX, rawY, transform.scale)

        setTransform(prev => ({
          ...prev,
          x: clamped.x,
          y: clamped.y,
        }))
        return
      }

      // 在 canvas 内
      const pos = getGridPos(touch.clientX, touch.clientY)
      setHoverCell(pos)

      if (touchStartRef.current && !touchMovedRef.current) {
        const dx = touch.clientX - touchStartRef.current.x
        const dy = touch.clientY - touchStartRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 10) {
          touchMovedRef.current = true
          // 切换到平移模式
          panStartRef.current = { x: touch.clientX, y: touch.clientY }
          panStartTransformRef.current = { x: transform.x, y: transform.y }
        }
      }

      // 在 canvas 内移动 >10px 后，开始平移
      if (touchMovedRef.current && panStartRef.current) {
        e.preventDefault()
        const dx = touch.clientX - panStartRef.current.x
        const dy = touch.clientY - panStartRef.current.y

        const rawX = panStartTransformRef.current.x + dx
        const rawY = panStartTransformRef.current.y + dy
        const clamped = applyClamp(rawX, rawY, transform.scale)

        setTransform(prev => ({
          ...prev,
          x: clamped.x,
          y: clamped.y,
        }))
      }
    }
  }, [getGridPos, setTransform, transform, applyClamp])

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length === 0) {
      // 如果是点击（在 canvas 内且移动 < 10px），绘制格子
      if (touchStartRef.current && !touchMovedRef.current && touchStartRef.current.gridPos) {
        const { gridPos } = touchStartRef.current
        drawCell(gridPos.x, gridPos.y)
      }

      setIsDrawing(false)
      lastDrawTouchRef.current = null
      touchStartRef.current = null
      touchMovedRef.current = false
      panStartRef.current = null
      panStartTransformRef.current = null
    }
  }, [drawCell])

  const handleTouchCancel = useCallback(() => {
    setIsDrawing(false)
    lastDrawTouchRef.current = null
    touchStartRef.current = null
    touchMovedRef.current = false
    panStartRef.current = null
    panStartTransformRef.current = null
  }, [])

  // ==================== 桌面端鼠标在 canvas 上绘制 ====================
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    const pos = getGridPos(e.clientX, e.clientY)
    if (pos) {
      setIsDrawing(true)
      drawCell(pos.x, pos.y)
    }
  }, [getGridPos, drawCell])

  const handleMouseMove = useCallback((e) => {
    const pos = getGridPos(e.clientX, e.clientY)
    setHoverCell(pos)

    if (isDrawing) {
      drawCell(pos.x, pos.y)
    }
  }, [getGridPos, drawCell, isDrawing])

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoverCell(null)
    setIsDrawing(false)
  }, [])

  // 双击重置
  const handleDoubleClick = useCallback(() => {
    resetTransform()
  }, [resetTransform])

  // 滚轮缩放
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform(prev => {
      const newScale = Math.max(0.3, Math.min(5, prev.scale * delta))
      // 重新计算缩放后的安全范围
      const scaledGridW = canvasWidth * newScale
      const scaledGridH = canvasHeight * newScale
      const maxX = Math.max(0, (scaledGridW - availableW) / 2)
      const maxY = Math.max(0, (scaledGridH - availableH) / 2)
      return {
        ...prev,
        scale: newScale,
        x: Math.max(-maxX, Math.min(maxX, prev.x)),
        y: Math.max(-maxY, Math.min(maxY, prev.y)),
      }
    })
  }, [setTransform, canvasWidth, canvasHeight, availableW, availableH])

  const transformStyle = {
    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
    transformOrigin: 'center center',
    willChange: 'transform',
  }

  return (
    <div className="canvas-wrapper">
      <div className="canvas-info">
        <span>{cols} × {rows}</span>
        <span>|</span>
        <span>{Math.round(transform.scale * 100)}%</span>
        <button
          className="reset-btn"
          onClick={resetTransform}
          title="双击或点击重置"
        >
          重置
        </button>
      </div>

      <div
        className="canvas-container"
        ref={setContainerRef}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onMouseLeave={handleContainerMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      >
        <div className="canvas-inner" style={transformStyle}>
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            style={{
              cursor: isDrawing ? 'grabbing' : 'crosshair',
              imageRendering: 'pixelated',
              touchAction: 'none',
              display: 'block',
            }}
          />
        </div>
      </div>

      <style>{`
        .canvas-wrapper {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          padding: 16px;
        }

        .canvas-info {
          display: flex;
          gap: 12px;
          font-size: 13px;
          color: #6b7280;
          justify-content: center;
          align-items: center;
          background: #f9fafb;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
        }

        .reset-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reset-btn:hover {
          background: #2563eb;
          transform: scale(1.05);
        }

        .canvas-container {
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: visible;
          touch-action: none;
          padding: 60px;
          user-select: none;
          -webkit-user-select: none;
        }

        .canvas-inner {
          background: white;
          border-radius: 12px;
          padding: 12px;
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -2px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.05);
          transition: transform 0.05s ease-out;
        }
      `}</style>
    </div>
  )
}
