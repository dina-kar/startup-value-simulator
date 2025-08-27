import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

type ActiveTab = 'setup' | 'rounds' | 'results'

interface UIState {
  // Navigation
  activeTab: ActiveTab
  sidebarOpen: boolean
  
  // Modals and overlays
  auditDrawerOpen: boolean
  shareModalOpen: boolean
  
  // Form states
  isAddingFounder: boolean
  isAddingRound: boolean
  editingRoundId: string | null
  
  // Loading states
  isLoading: boolean
  
  // Error handling
  notifications: Notification[]
  
  // Actions
  setActiveTab: (tab: ActiveTab) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  toggleAuditDrawer: () => void
  setAuditDrawerOpen: (open: boolean) => void
  
  toggleShareModal: () => void
  setShareModalOpen: (open: boolean) => void
  
  setIsAddingFounder: (adding: boolean) => void
  setIsAddingRound: (adding: boolean) => void
  setEditingRoundId: (id: string | null) => void
  
  setIsLoading: (loading: boolean) => void
  
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  timestamp: Date
  duration?: number // ms, undefined = permanent
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // Initial state
      activeTab: 'setup',
      sidebarOpen: false,
      auditDrawerOpen: false,
      shareModalOpen: false,
      isAddingFounder: false,
      isAddingRound: false,
      editingRoundId: null,
      isLoading: false,
      notifications: [],

      // Navigation
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Sidebar
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Audit drawer
      toggleAuditDrawer: () => set((state) => ({ auditDrawerOpen: !state.auditDrawerOpen })),
      setAuditDrawerOpen: (open) => set({ auditDrawerOpen: open }),

      // Share modal
      toggleShareModal: () => set((state) => ({ shareModalOpen: !state.shareModalOpen })),
      setShareModalOpen: (open) => set({ shareModalOpen: open }),

      // Form states
      setIsAddingFounder: (adding) => set({ isAddingFounder: adding }),
      setIsAddingRound: (adding) => set({ isAddingRound: adding }),
      setEditingRoundId: (id) => set({ editingRoundId: id }),

      // Loading
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Notifications
      addNotification: (notificationData) => {
        const notification: Notification = {
          ...notificationData,
          id: crypto.randomUUID(),
          timestamp: new Date()
        }

        set((state) => ({
          notifications: [...state.notifications, notification]
        }))

        // Auto-remove after duration if specified
        if (notification.duration) {
          setTimeout(() => {
            get().removeNotification(notification.id)
          }, notification.duration)
        }
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }))
      },

      clearNotifications: () => set({ notifications: [] })
    }),
    {
      name: 'ui-store'
    }
  )
)

// Helper hook for notifications
export const useNotifications = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useUIStore()

  const showSuccess = (title: string, message?: string, duration = 5000) => {
    addNotification({ type: 'success', title, message, duration })
  }

  const showError = (title: string, message?: string, duration?: number) => {
    addNotification({ type: 'error', title, message, duration })
  }

  const showWarning = (title: string, message?: string, duration = 7000) => {
    addNotification({ type: 'warning', title, message, duration })
  }

  const showInfo = (title: string, message?: string, duration = 5000) => {
    addNotification({ type: 'info', title, message, duration })
  }

  return {
    notifications,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}
