import { useState, useRef, useEffect, useCallback } from 'react'
import { useGestures } from '../hooks/useGestures'

export default function Canvas({ gridSize, gridWidth, gridHeight, selectedColor, tool, canvasData, onCanvasChange }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hoverCell, setHoverCell] = useState(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const CELL_SIZE = 16
  const cols = gridWidth || gridSize
  const rows = gridHeight || gridSize
  const canvasWidth = cols * CELL_SIZE
  const canvasHeight = rows * CELL_SIZE

  // 手势处理
  const { ref: gestureRef } = useGestures({
    onPinch: useCallback(({ scale: newScale }) => {
      setScale(prev => Math.max(0.5, Math.min(3, prev * newScale)))
    }, []),
    onPan: useCallback((delta) => {
      setOffset(prev => ({
        x: prev.x + delta.x,
        y: prev.y + delta.y,
      }))
    }, []),
    onLongPress: useCallback((pos) => {
      // 长按弹出颜色选择
    }, []),
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

    // 清空画布
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 绘制每个格子
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

    // 绘制网格线
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
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

    // 绘制 hover 高亮
    if (hoverCell && tool === 'pencil') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(hoverCell.x * CELL_SIZE, hoverCell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    }
  }, [canvasData, cols, rows, hoverCell, tool, canvasWidth, canvasHeight])

  const getGridPos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE)
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE)

    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      return { x, y }
    }
    return null
  }

  const drawCell = useCallback((x, y) => {
    if (!canvasData) return

    const newData = canvasData.map(row => [...row])

    if (tool === 'pencil') {
      newData[y][x] = selectedColor
    } else if (tool === 'eraser') {
      newData[y][x] = null
    } else if (tool === 'fill') {
      // 洪水填充
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

  const handleMouseDown = (e) => {
    const pos = getGridPos(e)
    if (pos) {
      setIsDrawing(true)
      drawCell(pos.x, pos.y)
    }
  }

  const handleMouseMove = (e) => {
    const pos = getGridPos(e)
    setHoverCell(pos)

    if (isDrawing && pos) {
      drawCell(pos.x, pos.y)
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const handleMouseLeave = () => {
    setHoverCell(null)
    setIsDrawing(false)
  }

  const handleWheel = (e) => {
    e.stopPropagation()
  }

  // 触控事件处理
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const pos = getGridPos(touch)
      if (pos) {
        setIsDrawing(true)
        drawCell(pos.x, pos.y)
      }
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const pos = getGridPos(touch)
      setHoverCell(pos)

      if (isDrawing && pos) {
        drawCell(pos.x, pos.y)
      }
    }
  }

  const handleTouchEnd = () => {
    setIsDrawing(false)
  }

  return (
    <div className="canvas-wrapper">
      <div className="canvas-info">
        <span>{cols} x {rows} 格子</span>
        <span>|</span>
        <span>当前颜色: <span className="color-dot" style={{ backgroundColor: selectedColor }} /></span>
      </div>
      <div className="canvas-container" onWheel={handleWheel}>
        <div
          className="canvas-border"
          ref={setContainerRef}
          style={{
            transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: 'center center',
          }}
        >
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
            style={{
              cursor: tool === 'eraser' ? 'crosshair' : 'pointer',
              imageRendering: 'pixelated',
              touchAction: 'none',
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
        }
        .canvas-info {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: var(--text-muted);
          justify-content: center;
          align-items: center;
          position: sticky;
          top: 0;
          background: var(--bg-primary);
          padding: 8px 12px;
          z-index: 10;
          border-radius: 8px;
        }
        .color-dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          vertical-align: middle;
          margin-left: 4px;
          border: 1px solid rgba(0,0,0,0.15);
        }
        .canvas-container {
          display: inline-block;
          overflow: hidden;
        }
        .canvas-border {
          background: white;
          border-radius: 12px;
          padding: 12px;
          box-shadow:
            0 2px 8px var(--shadow-md),
            0 4px 24px var(--shadow-lg),
            inset 0 0 0 1px rgba(0, 0, 0, 0.05);
          transition: transform 0.1s ease-out;
        }
        canvas {
          display: block;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}