import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * 优化的移动端手势 Hook
 * 支持：双指缩放（以 pinch 中心为原点）、双指拖动、惯性滚动、边界回弹
 */
export function useGestures({
  onPinch,
  onPan,
  onDoubleTap,
  minScale = 0.5,
  maxScale = 3,
  minX = -500,
  maxX = 500,
  minY = -500,
  maxY = 500,
  friction = 0.92,
  bounceIntensity = 0.15,
}) {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 })
  const [isGestureActive, setIsGestureActive] = useState(false)

  const touchesRef = useRef([])
  const lastTouchesRef = useRef([])
  const initialDistanceRef = useRef(0)
  const initialScaleRef = useRef(1)
  const initialXRef = useRef(0)
  const initialYRef = useRef(0)
  const velocityRef = useRef({ x: 0, y: 0 })
  const lastMoveTimeRef = useRef(0)
  const animationFrameRef = useRef(null)
  const elementRef = useRef(null)

  const getDistance = useCallback((touches) => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const getCenter = useCallback((touches) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY }
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    }
  }, [])

  const clampScale = useCallback((scale) => {
    if (scale < minScale) return minScale - (minScale - scale) * bounceIntensity
    if (scale > maxScale) return maxScale + (scale - maxScale) * bounceIntensity
    return scale
  }, [minScale, maxScale, bounceIntensity])

  const clampPosition = useCallback((x, y) => {
    const scaledMinX = minX * transform.scale
    const scaledMaxX = maxX * transform.scale
    const scaledMinY = minY * transform.scale
    const scaledMaxY = maxY * transform.scale

    if (x < scaledMinX) return scaledMinX + (x - scaledMinX) * bounceIntensity
    if (x > scaledMaxX) return scaledMaxX + (x - scaledMaxX) * bounceIntensity
    return x
  }, [minX, maxX, minY, maxY, transform.scale, bounceIntensity])

  const startMomentum = useCallback(() => {
    const applyMomentum = () => {
      const { x, y } = velocityRef.current
      const speed = Math.sqrt(x * x + y * y)

      if (speed < 0.5) {
        velocityRef.current = { x: 0, y: 0 }
        return
      }

      setTransform(prev => {
        const newX = clampPosition(prev.x + x, prev.y)
        const newY = clampPosition(prev.x, prev.y + y)
        return { ...prev, x: newX, y: newY }
      })

      velocityRef.current = {
        x: velocityRef.current.x * friction,
        y: velocityRef.current.y * friction,
      }

      animationFrameRef.current = requestAnimationFrame(applyMomentum)
    }

    animationFrameRef.current = requestAnimationFrame(applyMomentum)
  }, [friction, clampPosition])

  const stopMomentum = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    velocityRef.current = { x: 0, y: 0 }
  }, [])

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault()
    }

    stopMomentum()

    const touches = Array.from(e.touches)
    touchesRef.current = touches
    lastTouchesRef.current = touches

    if (touches.length === 2) {
      initialDistanceRef.current = getDistance(touches)
      initialScaleRef.current = transform.scale
      initialXRef.current = transform.x
      initialYRef.current = transform.y
      setIsGestureActive(true)
    }

    lastMoveTimeRef.current = Date.now()
  }, [getDistance, transform, stopMomentum])

  const handleTouchMove = useCallback((e) => {
    const touches = Array.from(e.touches)
    const now = Date.now()
    const dt = now - lastMoveTimeRef.current

    touchesRef.current = touches
    lastTouchesRef.current = touches

    if (touches.length === 2) {
      e.preventDefault()

      const currentDistance = getDistance(touches)
      const scaleDelta = currentDistance / initialDistanceRef.current
      const newScale = clampScale(initialScaleRef.current * scaleDelta)

      const center = getCenter(touches)
      const rect = elementRef.current?.getBoundingClientRect()
      const elementCenterX = rect ? rect.width / 2 : 0
      const elementCenterY = rect ? rect.height / 2 : 0

      const pinchCenterX = center.x - (elementRef.current?.getBoundingClientRect().left || 0)
      const pinchCenterY = center.y - (elementRef.current?.getBoundingClientRect().top || 0)

      setTransform(prev => ({
        scale: newScale,
        x: prev.x,
        y: prev.y,
        originX: pinchCenterX,
        originY: pinchCenterY,
      }))

      if (onPinch) {
        onPinch({ scale: newScale, center })
      }
    } else if (touches.length === 1 && isGestureActive) {
      e.preventDefault()

      const lastTouch = lastTouchesRef.current[0]
      if (lastTouch) {
        const dx = touches[0].clientX - lastTouch.clientX
        const dy = touches[0].clientY - lastTouch.clientY

        if (dt > 0) {
          velocityRef.current = {
            x: dx / dt * 16,
            y: dy / dt * 16,
          }
        }

        setTransform(prev => ({
          ...prev,
          x: clampPosition(prev.x + dx, prev.y + dy),
          y: clampPosition(prev.x, prev.y + dy),
        }))

        if (onPan) {
          onPan({ x: dx, y: dy })
        }
      }
    }

    lastMoveTimeRef.current = now
  }, [getDistance, getCenter, clampScale, clampPosition, onPinch, onPan, isGestureActive])

  const handleTouchEnd = useCallback((e) => {
    const remainingTouches = e.touches.length

    if (remainingTouches === 0) {
      setIsGestureActive(false)

      setTransform(prev => ({
        ...prev,
        scale: clampScale(prev.scale),
        x: clampPosition(prev.x, prev.y),
        originX: undefined,
        originY: undefined,
      }))

      if (Math.abs(velocityRef.current.x) > 1 || Math.abs(velocityRef.current.y) > 1) {
        startMomentum()
      }

      touchesRef.current = []
      lastTouchesRef.current = []
    } else if (remainingTouches === 1) {
      const touch = e.touches[0]
      touchesRef.current = [touch]
      lastTouchesRef.current = [touch]
      initialXRef.current = transform.x
      initialYRef.current = transform.y
    }
  }, [clampScale, clampPosition, startMomentum, transform])

  const resetTransform = useCallback(() => {
    stopMomentum()
    setTransform({ scale: 1, x: 0, y: 0 })
  }, [stopMomentum])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
      stopMomentum()
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, stopMomentum])

  return {
    ref: elementRef,
    transform,
    isGestureActive,
    resetTransform,
    setTransform,
  }
}
