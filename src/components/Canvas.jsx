import { useState, useRef, useEffect, useCallback } from 'react'

const CELL_SIZE = 16
const MIN_SCALE = 0.3
const MAX_SCALE = 5
const MOMENTUM_FRICTION = 0.88
const MOMENTUM_THRESHOLD = 0.5

export default function Canvas({
  gridSize,
  gridWidth,
  gridHeight,
  selectedColor,
  tool,
  canvasData,
  onCanvasChange,
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  const [hoverCell, setHoverCell] = useState(null)

  // 变换状态：scale + canvas画布中心在container中的位置
  const [transform, setTransform] = useState({ scale: 1, cx: 0, cy: 0 })

  // PC 拖拽平移
  const isPanningRef = useRef(false)
  const panCursorStartRef = useRef({ x: 0, y: 0 }) // 拖拽开始时，光标相对container的初始偏移(canvas中心-Cursor)
  const panStartRef = useRef({ x: 0, y: 0 }) // 拖拽开始时的canvas中心cx,cy

  // PC 绘制
  const isDrawingRef = useRef(false)

  // 触控状态
  const touchStartRef = useRef(null) // { x, y, gridPos, touchId }
  const touchMovedRef = useRef(false)
  const touchPanCursorStartRef = useRef({ x: 0, y: 0 })
  const touchPanCanvasStartRef = useRef({ x: 0, y: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const lastTouchTimeRef = useRef(0)
  const lastTouchPosRef = useRef({ x: 0, y: 0 })
  const momentumRef = useRef(null)

  // 双指触控状态
  const pinchRef = useRef(null) // { startDist, startScale, startCX, startCY }

  const cols = gridWidth || gridSize
  const rows = gridHeight || gridSize
  const canvasWidth = cols * CELL_SIZE
  const canvasHeight = rows * CELL_SIZE

  // ─────────────────────────────────────────────────────────────────
  // _bounds: 依据当前scale计算canvas中心的合法范围
  // ─────────────────────────────────────────────────────────────────
  const getBounds = useCallback((scale) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    const { width: cW, height: cH } = rect
    // canvas缩放后的尺寸
    const scaledW = canvasWidth * scale
    const scaledH = canvasHeight * scale
    // canvas中心可移动范围：使canvas不要完全偏离viewport
    const halfW = Math.max(0, (scaledW - cW) / 2)
    const halfH = Math.max(0, (scaledH - cH) / 2)
    return {
      minX: -halfW,
      maxX: halfW,
      minY: -halfH,
      maxY: halfH,
    }
  }, [canvasWidth, canvasHeight])

  const clampCanvasCenter = useCallback((cx, cy, scale) => {
    const { minX, maxX, minY, maxY } = getBounds(scale)
    return {
      x: Math.max(minX, Math.min(maxX, cx)),
      y: Math.max(minY, Math.min(maxY, cy)),
    }
  }, [getBounds])

  // ─────────────────────────────────────────────────────────────────
  // 绘制网格
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    if (canvasData) {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (canvasData[y]?.[x]) {
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

  // ─────────────────────────────────────────────────────────────────
  // 坐标转换
  // ─────────────────────────────────────────────────────────────────
  const getGridPos = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = Math.floor((clientX - rect.left) * scaleX / CELL_SIZE)
    const y = Math.floor((clientY - rect.top) * scaleY / CELL_SIZE)
    if (x >= 0 && x < cols && y >= 0 && y < rows) return { x, y }
    return null
  }, [cols, rows])

  // 检测鼠标/触控是否在canvas区域内（考虑缩放和变换）
  const isOverCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas || !containerRef.current) return false
    const rect = canvas.getBoundingClientRect()
    return (
      clientX >= rect.left && clientX <= rect.right &&
      clientY >= rect.top && clientY <= rect.bottom
    )
  }, [])

  // ─────────────────────────────────────────────────────────────────
  // 填色逻辑
  // ─────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────
  // 重置
  // ─────────────────────────────────────────────────────────────────
  const resetTransform = useCallback(() => {
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current)
      momentumRef.current = null
    }
    velocityRef.current = { x: 0, y: 0 }
    isPanningRef.current = false
    setTransform({ scale: 1, cx: 0, cy: 0 })
  }, [])

  // ─────────────────────────────────────────────────────────────────
  // PC: 鼠标滚轮缩放（以光标为中心）
  // ─────────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const cursorX = e.clientX - rect.left - rect.width / 2
    const cursorY = e.clientY - rect.top - rect.height / 2

    const oldScale = transform.scale
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, oldScale * delta))

    if (Math.abs(newScale - oldScale) < 0.001) return

    // 保持光标下的canvas坐标位置不变
    const dtx = cursorX * (1 - newScale / oldScale)
    const dty = cursorY * (1 - newScale / oldScale)

    const rawCX = transform.cx + dtx
    const rawCY = transform.cy + dty
    const clamped = clampCanvasCenter(rawCX, rawCY, newScale)

    setTransform({ scale: newScale, cx: clamped.x, cy: clamped.y })
  }, [transform, clampCanvasCenter])

  // ─────────────────────────────────────────────────────────────────
  // PC: 鼠标拖拽平移（仅在canvas外白板区域可拖）
  // ─────────────────────────────────────────────────────────────────
  const handleContainerMouseDown = useCallback((e) => {
    if (e.button !== 0) return

    if (isOverCanvas(e.clientX, e.clientY)) {
      // 在canvas内 → 绘制
      const pos = getGridPos(e.clientX, e.clientY)
      if (pos) {
        isDrawingRef.current = true
        drawCell(pos.x, pos.y)
      }
      return
    }

    // 在canvas外 → 拖拽平移
    e.preventDefault()
    isPanningRef.current = true

    const rect = containerRef.current.getBoundingClientRect()
    const cursorX = e.clientX - rect.left - rect.width / 2
    const cursorY = e.clientY - rect.top - rect.height / 2

    panCursorStartRef.current = { x: cursorX, y: cursorY }
    panStartRef.current = { x: transform.cx, y: transform.cy }
  }, [isOverCanvas, getGridPos, drawCell, transform])

  const handleContainerMouseMove = useCallback((e) => {
    // 绘制
    if (isDrawingRef.current) {
      const pos = getGridPos(e.clientX, e.clientY)
      setHoverCell(pos)
      if (pos) drawCell(pos.x, pos.y)
      return
    }

    // 拖拽平移
    if (!isPanningRef.current) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const cursorX = e.clientX - rect.left - rect.width / 2
    const cursorY = e.clientY - rect.top - rect.height / 2
    const deltaX = cursorX - panCursorStartRef.current.x
    const deltaY = cursorY - panCursorStartRef.current.y

    const rawCX = panStartRef.current.x + deltaX
    const rawCY = panStartRef.current.y + deltaY
    const clamped = clampCanvasCenter(rawCX, rawCY, transform.scale)

    setTransform(prev => ({ ...prev, cx: clamped.x, cy: clamped.y }))
  }, [getGridPos, drawCell, transform, clampCanvasCenter])

  const handleContainerMouseUp = useCallback(() => {
    isDrawingRef.current = false
    isPanningRef.current = false
  }, [])

  const handleContainerMouseLeave = useCallback(() => {
    isDrawingRef.current = false
    isPanningRef.current = false
    setHoverCell(null)
  }, [])

  // PC hover
  const handleMouseMove = useCallback((e) => {
    const pos = getGridPos(e.clientX, e.clientY)
    setHoverCell(pos)
  }, [getGridPos])

  const handleMouseLeave = useCallback(() => {
    setHoverCell(null)
  }, [])

  // ─────────────────────────────────────────────────────────────────
  // 移动端触控
  // ─────────────────────────────────────────────────────────────────
  const stopMomentum = useCallback(() => {
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current)
      momentumRef.current = null
    }
    velocityRef.current = { x: 0, y: 0 }
  }, [])

  const startMomentum = useCallback(() => {
    stopMomentum()
    const applyMomentum = () => {
      const { x: vx, y: vy } = velocityRef.current
      const speed = Math.sqrt(vx * vx + vy * vy)
      if (speed < MOMENTUM_THRESHOLD) {
        velocityRef.current = { x: 0, y: 0 }
        return
      }
      setTransform(prev => {
        const rawCX = prev.cx + vx
        const rawCY = prev.cy + vy
        const clamped = clampCanvasCenter(rawCX, rawCY, prev.scale)
        return { ...prev, cx: clamped.x, cy: clamped.y }
      })
      velocityRef.current = {
        x: vx * MOMENTUM_FRICTION,
        y: vy * MOMENTUM_FRICTION,
      }
      momentumRef.current = requestAnimationFrame(applyMomentum)
    }
    momentumRef.current = requestAnimationFrame(applyMomentum)
  }, [stopMomentum, clampCanvasCenter])

  const handleTouchStart = useCallback((e) => {
    e.preventDefault()
    stopMomentum()

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    if (e.touches.length === 2) {
      // 双指 → 开始pinch
      pinchRef.current = {
        startDist: Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        ),
        startScale: transform.scale,
        startCX: transform.cx,
        startCY: transform.cy,
      }
      touchStartRef.current = null
      touchMovedRef.current = false
      return
    }

    if (e.touches.length === 1) {
      const t = e.touches[0]
      const cursorX = t.clientX - rect.left - rect.width / 2
      const cursorY = t.clientY - rect.top - rect.height / 2
      const gridPos = getGridPos(t.clientX, t.clientY)

      touchStartRef.current = { x: t.clientX, y: t.clientY, gridPos }
      touchMovedRef.current = false
      velocityRef.current = { x: 0, y: 0 }
      lastTouchTimeRef.current = Date.now()
      lastTouchPosRef.current = { x: t.clientX, y: t.clientY }

      // 不在grid上 → 开始单指平移
      if (!gridPos) {
        touchPanCursorStartRef.current = { x: cursorX, y: cursorY }
        touchPanCanvasStartRef.current = { x: transform.cx, y: transform.cy }
      }
    }
  }, [stopMomentum, getGridPos, transform])

  const handleTouchMove = useCallback((e) => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    if (e.touches.length === 2 && pinchRef.current) {
      // 双指 → pinch缩放
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const { startDist, startScale, startCX, startCY } = pinchRef.current
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE,
        startScale * (dist / startDist)
      ))

      // pinch中心
      const pcx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left - rect.width / 2
      const pcy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top - rect.height / 2

      // 保持pinch中心canvas坐标不变
      const rawCX = startCX + pcx * (1 - newScale / startScale)
      const rawCY = startCY + pcy * (1 - newScale / startScale)
      const clamped = clampCanvasCenter(rawCX, rawCY, newScale)

      setTransform({ scale: newScale, cx: clamped.x, cy: clamped.y })
      return
    }

    if (e.touches.length === 1) {
      const t = e.touches[0]
      const now = Date.now()
      const dt = now - lastTouchTimeRef.current
      const dx = t.clientX - lastTouchPosRef.current.x
      const dy = t.clientY - lastTouchPosRef.current.y

      if (dt > 0) {
        velocityRef.current = {
          x: dx / dt * 16,
          y: dy / dt * 16,
        }
      }
      lastTouchTimeRef.current = now
      lastTouchPosRef.current = { x: t.clientX, y: t.clientY }

      const cursorX = t.clientX - rect.left - rect.width / 2
      const cursorY = t.clientY - rect.top - rect.height / 2

      // 不在grid上 → 单指平移
      if (!touchStartRef.current?.gridPos && touchStartRef.current) {
        touchMovedRef.current = true
        const rawCX = touchPanCanvasStartRef.current.x + cursorX - touchPanCursorStartRef.current.x
        const rawCY = touchPanCanvasStartRef.current.y + cursorY - touchPanCursorStartRef.current.y
        const clamped = clampCanvasCenter(rawCX, rawCY, transform.scale)
        setTransform(prev => ({ ...prev, cx: clamped.x, cy: clamped.y }))
        return
      }

      // 在grid上但有移动
      if (touchStartRef.current?.gridPos) {
        const gridPos = getGridPos(t.clientX, t.clientY)
        setHoverCell(gridPos)

        const startX = touchStartRef.current.x
        const startY = touchStartRef.current.y
        const moved = Math.hypot(t.clientX - startX, t.clientY - startY)

        if (moved > 10 && !touchMovedRef.current) {
          touchMovedRef.current = true
          // 切换为平移模式：记住此刻的平移基准
          touchPanCanvasStartRef.current = { x: transform.cx, y: transform.cy }
          touchPanCursorStartRef.current = { x: cursorX, y: cursorY }
        }

        if (touchMovedRef.current) {
          // 切换为平移模式
          const rawCX = touchPanCanvasStartRef.current.x + cursorX - touchPanCursorStartRef.current.x
          const rawCY = touchPanCanvasStartRef.current.y + cursorY - touchPanCursorStartRef.current.y
          const clamped = clampCanvasCenter(rawCX, rawCY, transform.scale)
          setTransform(prev => ({ ...prev, cx: clamped.x, cy: clamped.y }))
        }
      }
    }
  }, [getGridPos, transform, clampCanvasCenter])

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault()

    if (e.touches.length === 0) {
      pinchRef.current = null

      // 单指点击(未移动)且在grid上 → 填色
      if (touchStartRef.current?.gridPos && !touchMovedRef.current) {
        drawCell(touchStartRef.current.gridPos.x, touchStartRef.current.gridPos.y)
      }

      // 惯性
      const { x: vx, y: vy } = velocityRef.current
      if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
        startMomentum()
      }

      touchStartRef.current = null
      touchMovedRef.current = false
      setHoverCell(null)
    } else if (e.touches.length === 1) {
      // 从双指切回单指
      pinchRef.current = null
      const t = e.touches[0]
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const gridPos = getGridPos(t.clientX, t.clientY)
        touchStartRef.current = { x: t.clientX, y: t.clientY, gridPos }
        touchMovedRef.current = false
        lastTouchTimeRef.current = Date.now()
        lastTouchPosRef.current = { x: t.clientX, y: t.clientY }

        if (!gridPos) {
          const cursorX = t.clientX - rect.left - rect.width / 2
          const cursorY = t.clientY - rect.top - rect.height / 2
          touchPanCanvasStartRef.current = { x: transform.cx, y: transform.cy }
          touchPanCursorStartRef.current = { x: cursorX, y: cursorY }
        }
      }
    }
  }, [drawCell, getGridPos, transform, startMomentum])

  const handleTouchCancel = useCallback(() => {
    stopMomentum()
    touchStartRef.current = null
    touchMovedRef.current = false
    pinchRef.current = null
    setHoverCell(null)
  }, [stopMomentum])

  // 双击重置
  const handleDoubleClick = useCallback(() => {
    resetTransform()
  }, [resetTransform])

  // ─────────────────────────────────────────────────────────────────
  // Transform style: left:50%/top:50% center canvas-inner on canvas-container,
  // transformTranslate applies the pan offset (cx/cy) + centering (-50%) + scale
  // ─────────────────────────────────────────────────────────────────
  const transformStyle = {
    transform: `translate(calc(-50% + ${transform.cx}px), calc(-50% + ${transform.cy}px)) scale(${transform.scale})`,
    willChange: 'transform',
  }

  return (
    <div className="canvas-wrapper">
      <div className="canvas-info">
        <span>{cols} × {rows}</span>
        <span>|</span>
        <span>{Math.round(transform.scale * 100)}%</span>
        <button className="reset-btn" onClick={resetTransform} title="双击重置">
          重置
        </button>
      </div>

      <div
        className="canvas-container"
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onMouseLeave={handleContainerMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: isPanningRef.current ? 'grabbing' : 'default' }}
      >
        <div className="canvas-inner" style={transformStyle}>
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              imageRendering: 'pixelated',
              touchAction: 'none',
              display: 'block',
              cursor: isDrawingRef.current ? 'grabbing' : 'crosshair',
            }}
          />
        </div>
      </div>

      <style>{`
        .canvas-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          flex: 1;
          width: 100%;
          height: 100%;
          min-height: 0;
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
          flex-shrink: 0;
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
          position: relative;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }
        .canvas-inner {
          position: absolute;
          left: 50%;
          top: 50%;
          transform-origin: 0 0;
          background: white;
          border-radius: 12px;
          padding: 12px;
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -2px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  )
}
