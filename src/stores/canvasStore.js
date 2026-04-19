import { create } from 'zustand'

export const useCanvasStore = create((set, get) => ({
  // State
  gridSize: 29,
  canvasData: null,
  selectedColor: '#E53935',
  currentPalette: 'perler',
  tool: 'pencil',
  history: [],
  historyIndex: -1,

  // Actions
  setGridSize: (size) => set({ gridSize: size }),
  setCanvasData: (data) => set({ canvasData: data }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  setCurrentPalette: (palette) => set({ currentPalette: palette }),
  setTool: (tool) => set({ tool }),

  // History management
  saveToHistory: (data) => {
    const { history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.stringify(data))
    if (newHistory.length > 50) newHistory.shift()
    set({ history: newHistory, historyIndex: newHistory.length - 1 })
  },

  undo: () => {
    const { history, historyIndex, canvasData } = get()
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      set({
        historyIndex: newIndex,
        canvasData: JSON.parse(history[newIndex])
      })
    }
  },

  canUndo: () => get().historyIndex > 0,
}))
