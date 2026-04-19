import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * 移动端手势支持 Hook
 * 支持：双指缩放、双指拖动、长按
 */
export function useGestures({
  onPinch,
  onPan,
  onLongPress,
  onTap,
  threshold = 10,
  longPressDelay = 500,
}) {
  const [isGestureActive, setIsGestureActive] = useState(false)
  const [gestureType, setGestureType] = useState(null)

  const touchesRef = useRef([])
  const initialDistanceRef = useRef(0)
  const initialScaleRef = useRef(1)
  const initialCenterRef = useRef({ x: 0, y: 0 })
  const longPressTimerRef = useRef(null)
  const elementRef = useRef(null)

  const getDistance = useCallback((touches) => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const getCenter = useCallback((touches) => {
    if (touches.length < 2) return { x: touches[0].clientX, y: touches[0].clientY }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    }
  }, [])

  const handleTouchStart = useCallback((e) => {
    const touches = Array.from(e.touches)
    touchesRef.current = touches

    if (touches.length === 1) {
      // 单指：启动长按计时器
      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          setIsGestureActive(true)
          setGestureType('longPress')
          onLongPress({ x: touches[0].clientX, y: touches[0].clientY })
        }, longPressDelay)
      }
    } else if (touches.length === 2) {
      // 双指：初始化缩放
      clearTimeout(longPressTimerRef.current)
      initialDistanceRef.current = getDistance(touches)
      initialCenterRef.current = getCenter(touches)
      setIsGestureActive(true)
      setGestureType('pinch')
    }
  }, [getDistance, getCenter, onLongPress, longPressDelay])

  const handleTouchMove = useCallback((e) => {
    const touches = Array.from(e.touches)
    touchesRef.current = touches

    clearTimeout(longPressTimerRef.current)

    if (touches.length === 2 && gestureType === 'pinch') {
      // 双指缩放
      const currentDistance = getDistance(touches)
      const scale = currentDistance / initialDistanceRef.current
      const center = getCenter(touches)
      const deltaCenter = {
        x: center.x - initialCenterRef.current.x,
        y: center.y - initialCenterRef.current.y,
      }

      if (onPinch) {
        onPinch({
          scale,
          center,
          deltaCenter,
          initialScale: initialScaleRef.current,
        })
      }
    } else if (touches.length === 1 && gestureType === 'pan') {
      // 单指拖动
      const delta = {
        x: touches[0].clientX - touchesRef.current[0].clientX,
        y: touches[0].clientY - touchesRef.current[0].clientY,
      }

      if (onPan) {
        onPan(delta)
      }
    }
  }, [getDistance, getCenter, gestureType, onPinch, onPan])

  const handleTouchEnd = useCallback((e) => {
    clearTimeout(longPressTimerRef.current)

    if (e.touches.length === 0) {
      // 所有手指离开
      if (gestureType === 'longPress' && onTap) {
        // 长按后的点击
      }

      setIsGestureActive(false)
      setGestureType(null)
      touchesRef.current = []
    }
  }, [gestureType, onTap])

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
      clearTimeout(longPressTimerRef.current)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    ref: elementRef,
    isGestureActive,
    gestureType,
  }
}