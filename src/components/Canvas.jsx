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
  const [mode, setMode] = useState('draw') // 'draw' | 'gesture'
  const lastDrawTouchRef = useRef(null)

  const CELL_SIZE = 16
  const cols = gridWidth || gridSize
  const rows = gridHeight || gridSize
  const canvasWidth = cols * CELL_SIZE
  const canvasHeight = rows * CELL_SIZE

  const { ref: gestureRef, transform, resetTransform, setTransform, isGestureActive } = useGestures({
    minScale: 0.3,
    maxScale: 5,
    friction: 0.88,
    bounceIntensity: 0.2,
    minX: -canvasWidth,
    maxX: canvasWidth,
    minY: -canvasHeight,
    maxY: canvasHeight,
  })

  // 合并 refs
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

  // 触控处理 - 区分绘制和手势
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      setMode('gesture')
      setIsDrawing(false)
      return
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const pos = getGridPos(touch.clientX, touch.clientY)

      if (pos) {
        setMode('draw')
        setIsDrawing(true)
        lastDrawTouchRef.current = touch
        drawCell(pos.x, pos.y)
      }
    }
  }, [getGridPos, drawCell])

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      return
    }

    if (e.touches.length === 1 && isDrawing && mode === 'draw') {
      e.preventDefault()
      const touch = e.touches[0]
      const pos = getGridPos(touch.clientX, touch.clientY)
      setHoverCell(pos)

      if (pos) {
        drawCell(pos.x, pos.y)
      }
    }
  }, [isDrawing, mode, getGridPos, drawCell])

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length === 0) {
      setIsDrawing(false)
      setMode('draw')
      lastDrawTouchRef.current = null
    }
  }, [])

  const handleTouchCancel = useCallback(() => {
    setIsDrawing(false)
    setMode('draw')
    lastDrawTouchRef.current = null
  }, [])

  // 双击重置缩放
  const handleDoubleClick = useCallback(() => {
    resetTransform()
  }, [resetTransform])

  // 滚轮缩放（桌面端）
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.3, Math.min(5, prev.scale * delta))
    }))
  }, [setTransform])

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

  // 构建 transform 样式
  const transformStyle = {
    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
    transformOrigin: 'center center',
    willChange: 'transform',
  }

  if (transform.originX !== undefined) {
    transformStyle.transformOrigin = `${transform.originX}px ${transform.originY}px`
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
          title="双击或点击重置缩放"
        >
          重置
        </button>
      </div>

      <div
        className="canvas-container"
        ref={setContainerRef}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
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
              cursor: isDrawing ? 'grabbing' : tool === 'eraser' ? 'crosshair' : 'crosshair',
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
          padding: 40px;
        }

        .canvas-inner {
          background: white;
          border-radius: 12px;
          padding: 12px;
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -2px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.05);
          transition: transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        .canvas-inner.settling {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  )
}
