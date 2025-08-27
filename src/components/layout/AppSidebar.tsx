'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  HomeIcon, 
  FolderIcon, 
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BarChart3Icon,
  UsersIcon,
  TrendingUpIcon,
  UserIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { CreateScenarioModal } from '@/components/modals/CreateScenarioModal'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string | number
  disabled?: boolean
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: HomeIcon,
    href: '/dashboard'
  },
  {
    id: 'builder',
    label: 'Scenario Builder',
    icon: BarChart3Icon,
    href: '/builder'
  },
  {
    id: 'scenarios',
    label: 'My Scenarios',
    icon: FolderIcon,
    href: '/scenarios'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: TrendingUpIcon,
    href: '/analytics',
    disabled: true,
    badge: 'Soon'
  },
  {
    id: 'team',
    label: 'Team',
    icon: UsersIcon,
    href: '/team',
    disabled: true,
    badge: 'Pro'
  }
]

const bottomSidebarItems: SidebarItem[] = [
  {
    id: 'profile',
    label: 'Profile & Settings',
    icon: UserIcon,
    href: '/profile'
  }
]

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleNavigation = (item: SidebarItem) => {
    if (item.disabled) return
    router.push(item.href)
  }

  return (
    <div 
      className={cn(
        'flex flex-col h-screen bg-card border-r border-border transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <BarChart3Icon className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">
              CapTable
            </span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Create New Button */}
      <div className="p-4">
        <CreateScenarioModal 
          trigger={
            <Button 
              className={cn(
                'w-full',
                isCollapsed && 'p-2'
              )}
            >
              <PlusIcon className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">New Scenario</span>}
            </Button>
          }
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleNavigation(item)}
                  disabled={item.disabled}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    isActive && 'bg-accent text-accent-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <IconComponent className="h-4 w-4 flex-shrink-0" />
                  
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">
                        {item.label}
                      </span>
                      
                      {item.badge && (
                        <Badge 
                          variant={item.disabled ? 'secondary' : 'default'}
                          className="h-5 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-4">
        {/* Profile & Settings */}
        <nav>
          <ul className="space-y-2">
            {bottomSidebarItems.map((item) => {
              const IconComponent = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleNavigation(item)}
                    disabled={item.disabled}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isActive && 'bg-accent text-accent-foreground',
                      isCollapsed && 'justify-center px-2'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">
                          {item.label}
                        </span>
                        
                        {item.badge && (
                          <Badge 
                            variant={item.disabled ? 'secondary' : 'default'}
                            className="h-5 text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
        
        {/* Theme Toggle */}
        <div className="flex justify-center">
          <ThemeToggle showLabel={!isCollapsed} />
        </div>
        
        {!isCollapsed ? (
          <div className="text-xs text-muted-foreground text-center">
            <div>Startup Value Simulator</div>
            <div>v1.0.0</div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-2 w-2 rounded-full bg-green-500" title="v1.0.0" />
          </div>
        )}
      </div>
    </div>
  )
}

// Hook to use sidebar state
export function useSidebar() {
  const [isOpen, setIsOpen] = useState(true)
  
  return {
    isOpen,
    setIsOpen,
    toggle: () => setIsOpen(!isOpen)
  }
}
