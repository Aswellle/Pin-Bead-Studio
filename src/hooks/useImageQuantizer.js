import { useState, useCallback, useRef } from 'react'
import { getPalette } from '../data/palettes'

export function useImageQuantizer() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const workerRef = useRef(null)

  const quantize = useCallback(async (imageFile, options) => {
    const {
      gridSize = 29,        // 向后兼容：正方形
      gridWidth,            // Phase 3: 非正方形宽
      gridHeight,           // Phase 3: 非正方形高
      maxColors = 29,
      paletteId = 'perler',
      dithering = 'none',   // 'none' | 'floyd-steinberg' | 'ordered'
      brightness = 0,
      contrast = 0,
      highQuality = true,   // Phase 2: 质量开关
      removeBackground = true  // Phase 4: 背景移除开关
    } = options

    const outW = gridWidth || gridSize
    const outH = gridHeight || gridSize

    setIsProcessing(true)
    setProgress(0)
    setResult(null)
    setError(null)

    try {
      const img = await loadImage(imageFile)

      // Phase 6.3: 源分辨率提升 25→49 (7×7 per cell)，与专业站对齐
      // 上限 3000px 防止大图内存爆炸
      const minSourcePerCell = 49
      const maxSourceSize = 3000
      const targetSourceSize = Math.min(
        Math.max(outW, outH) * minSourcePerCell,
        maxSourceSize,
        Math.max(img.width, img.height)
      )
      const scale = targetSourceSize / Math.max(img.width, img.height)
      const scaledWidth = Math.round(img.width * scale)
      const scaledHeight = Math.round(img.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = scaledWidth
      canvas.height = scaledHeight
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight)

      const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight)

      // Phase 2: 使用 Transferable ArrayBuffer 传输（零拷贝）
      const pixelBuffer = imageData.data.buffer.slice(0)

      const palette = getPalette(paletteId)
      const paletteColors = palette.colors

      workerRef.current = new Worker(
        new URL('../workers/imageQuantizer.worker.js', import.meta.url),
        { type: 'module' }
      )

      return new Promise((resolve, reject) => {
        workerRef.current.onmessage = (e) => {
          const { type, progress: prog, payload, error: err } = e.data

          if (type === 'PROGRESS') {
            setProgress(prog)
          } else if (type === 'COMPLETE') {
            // 将 Transferable 索引格式还原为 canvasData 二维数组，保持上游 API 不变
            const { indexBuffer, width, height, quantizedColors, colorStats, BLANK_MARKER } = payload
            const indices = new Uint16Array(indexBuffer)
            const BLANK = BLANK_MARKER ?? 0xffff

            const canvasData = new Array(height)
            for (let y = 0; y < height; y++) {
              const row = new Array(width)
              for (let x = 0; x < width; x++) {
                const idx = indices[y * width + x]
                row[x] = idx === BLANK ? null : quantizedColors[idx].id
              }
              canvasData[y] = row
            }

            const compatPayload = { canvasData, colorStats, quantizedColors, width, height }
            setResult(compatPayload)
            setIsProcessing(false)
            workerRef.current.terminate()
            resolve(compatPayload)
          } else if (type === 'ERROR') {
            setError(err)
            setIsProcessing(false)
            workerRef.current.terminate()
            reject(new Error(err))
          }
        }

        workerRef.current.onerror = (err) => {
          setError(err.message)
          setIsProcessing(false)
          workerRef.current.terminate()
          reject(err)
        }

        // Phase 2: Transferable 传输 — pixelBuffer 所有权转移给 worker
        workerRef.current.postMessage(
          {
            type: 'QUANTIZE',
            payload: {
              imageData: {
                width: scaledWidth,
                height: scaledHeight,
                data: pixelBuffer   // ArrayBuffer（Transferable）
              },
              gridSize,             // 向后兼容
              gridWidth: outW,
              gridHeight: outH,
              maxColors,
              paletteColors,
              dithering,
              brightness,
              contrast,
              highQuality,
              removeBackground
            }
          },
          [pixelBuffer]             // Transferable list — 零拷贝
        )
      })
    } catch (err) {
      setError(err.message)
      setIsProcessing(false)
      throw err
    }
  }, [])

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    setIsProcessing(false)
    setProgress(0)
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setProgress(0)
  }, [])

  return {
    isProcessing,
    progress,
    result,
    error,
    quantize,
    cancel,
    reset
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
