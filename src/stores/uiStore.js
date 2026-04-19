import { create } from 'zustand'

export const useUIStore = create((set) => ({
  currentPage: 'canvas', // 'canvas' | 'gallery' | 'tutorials'
  leftSidebarCollapsed: false,
  rightSidebarCollapsed: false,
  showAuthModal: false,
  authMode: 'login',

  setCurrentPage: (page) => set({ currentPage: page }),
  toggleLeftSidebar: () => set((s) => ({ leftSidebarCollapsed: !s.leftSidebarCollapsed })),
  toggleRightSidebar: () => set((s) => ({ rightSidebarCollapsed: !s.rightSidebarCollapsed })),
  openAuthModal: (mode) => set({ showAuthModal: true, authMode: mode }),
  closeAuthModal: () => set({ showAuthModal: false }),
}))
