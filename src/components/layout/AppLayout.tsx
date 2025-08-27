'use client'

import { AppSidebar } from '@/components/layout/AppSidebar'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  className?: string
}

export function AppLayout({ 
  children, 
  showSidebar = true, 
  className 
}: AppLayoutProps) {
  return (
    <div className={cn('flex h-screen bg-background', className)}>
      {showSidebar && <AppSidebar />}
      
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
