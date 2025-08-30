import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Notification types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

// UI state interface
interface UIState {
  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Modal states
  isCreateScenarioModalOpen: boolean
  setCreateScenarioModalOpen: (open: boolean) => void
  
  isShareModalOpen: boolean
  setShareModalOpen: (open: boolean) => void
  
  isAuditDrawerOpen: boolean
  setAuditDrawerOpen: (open: boolean) => void
  
  // Loading states
  isLoading: boolean
  setLoading: (loading: boolean) => void
  
  loadingMessage?: string
  setLoadingMessage: (message?: string) => void
  
  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // Sidebar
  isSidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // Active views
  activeScenarioTab: 'setup' | 'rounds' | 'results' | 'charts'
  setActiveScenarioTab: (tab: 'setup' | 'rounds' | 'results' | 'charts') => void
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // Notifications
      notifications: [],
      
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9)
        const newNotification: Notification = {
          ...notification,
          id,
          duration: notification.duration ?? 5000
        }
        
        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }))
        
        // Auto-remove after duration
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id)
          }, newNotification.duration)
        }
      },
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      // Modals
      isCreateScenarioModalOpen: false,
      setCreateScenarioModalOpen: (open) => set({ isCreateScenarioModalOpen: open }),
      
      isShareModalOpen: false,
      setShareModalOpen: (open) => set({ isShareModalOpen: open }),
      
      isAuditDrawerOpen: false,
      setAuditDrawerOpen: (open) => set({ isAuditDrawerOpen: open }),
      
      // Loading
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      
      loadingMessage: undefined,
      setLoadingMessage: (message) => set({ loadingMessage: message }),
      
      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      // Sidebar
      isSidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
      
      // Active views
      activeScenarioTab: 'setup',
      setActiveScenarioTab: (tab) => set({ activeScenarioTab: tab })
    }),
    { name: 'ui-store' }
  )
)

// Convenience hooks for common notification patterns
export const useNotifications = () => {
  const { addNotification, removeNotification, clearNotifications } = useUIStore()
  
  return {
    showSuccess: (title: string, message?: string) => 
      addNotification({ type: 'success', title, message }),
    
    showError: (title: string, message?: string) => 
      addNotification({ type: 'error', title, message, duration: 0 }), // Don't auto-dismiss errors
    
    showWarning: (title: string, message?: string) => 
      addNotification({ type: 'warning', title, message }),
    
    showInfo: (title: string, message?: string) => 
      addNotification({ type: 'info', title, message }),
    
    removeNotification,
    clearNotifications
  }
}
