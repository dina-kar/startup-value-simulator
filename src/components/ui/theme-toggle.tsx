'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/ui/theme-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size={showLabel ? 'default' : 'icon'}
        className={cn(
          'relative overflow-hidden transition-all',
          showLabel && 'gap-2',
          className
        )}
        disabled
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        {showLabel && <span className="text-sm">Theme</span>}
      </Button>
    )
  }

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('light')
    } else {
      // If system, toggle to opposite of current appearance
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(isDark ? 'light' : 'dark')
    }
  }

  const currentTheme = theme === 'system' 
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme

  return (
    <Button
      variant="outline"
      size={showLabel ? 'default' : 'icon'}
      onClick={toggleTheme}
      className={cn(
        'relative overflow-hidden transition-all',
        showLabel && 'gap-2',
        className
      )}
      aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`}
    >
      {currentTheme === 'light' ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      {showLabel && (
        <span className="text-sm">
          {currentTheme === 'light' ? 'Light' : 'Dark'}
        </span>
      )}
    </Button>
  )
}
