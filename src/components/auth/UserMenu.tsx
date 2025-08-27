'use client'

import { useState } from 'react'
import { UserIcon, LogOutIcon, SettingsIcon, ChevronDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/lib/auth/AuthContext'
import { useNotifications } from '@/lib/stores/uiStore'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const [open, setOpen] = useState(false)

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        showError('Sign Out Failed', error.message)
      } else {
        showSuccess('Signed Out', 'You have been signed out successfully.')
      }
    } catch (err) {
      console.error('Sign out error:', err)
      showError('Error', 'An unexpected error occurred while signing out.')
    }
    setOpen(false)
  }

  const getDisplayName = () => {
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  }

  const getInitials = () => {
    const name = getDisplayName()
    return name
      .split(' ')
      .map((part: string) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 pl-2 pr-2"
        >
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
            {getInitials()}
          </div>
          <span className="hidden sm:block text-sm font-medium">
            {getDisplayName()}
          </span>
          <ChevronDownIcon size={14} className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-sm">
            <div className="font-medium">{getDisplayName()}</div>
            <div className="text-muted-foreground text-xs">{user.email}</div>
          </div>
          
          <div className="border-t my-1"></div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left h-8"
            onClick={() => setOpen(false)}
          >
            <UserIcon size={16} className="mr-2" />
            Profile
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left h-8"
            onClick={() => setOpen(false)}
          >
            <SettingsIcon size={16} className="mr-2" />
            Settings
          </Button>
          
          <div className="border-t my-1"></div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOutIcon size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
