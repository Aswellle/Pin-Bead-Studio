import { useState, useEffect, useCallback } from 'react'

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
}

export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  })

  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      setWindowSize({ width, height })
      setIsMobile(width < BREAKPOINTS.mobile)
      setIsTablet(width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet)
      setIsDesktop(width >= BREAKPOINTS.tablet)
      setIsTouchDevice(touch)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  }
}