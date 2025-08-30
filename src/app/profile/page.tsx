'use client'

import { useState, useEffect } from 'react'
import { 
  UserIcon, 
  MailIcon, 
  CalendarIcon, 
  EditIcon, 
  SaveIcon, 
  XIcon,
  SettingsIcon,
  PaletteIcon,
  DatabaseIcon,
  DownloadIcon,
  TrashIcon,
  BellIcon,
  ShieldIcon,
  SlidersIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AppLayout } from '@/components/layout/AppLayout'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useNotifications } from '@/lib/stores/uiStore'
import { useAuth } from '@/lib/auth/AuthContext'
import { 
  getUserProfile, 
  updateUserProfile, 
  updateUserSettings,
  exportUserData,
  deleteUserAccount,
  type UserProfile,
  type UpdateProfileParams,
  type UpdateSettingsParams
} from '@/lib/database/profile-queries'
import { Tabs } from '@/components/ui/tabs'

export default function ProfilePage() {
  const { showSuccess, showError } = useNotifications()
  const { user } = useAuth()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    company: '',
    role: ''
  })

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const result = await getUserProfile()
        if (result.success && result.data) {
          setProfile(result.data)
          setEditForm({
            firstName: result.data.firstName || '',
            lastName: result.data.lastName || '',
            company: result.data.company || '',
            role: result.data.role || ''
          })
        } else {
          console.error('Error loading profile:', result.error)
          showError('Error', result.error || 'Failed to load profile')
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        showError('Error', 'Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user, showError])

  const handleSaveProfile = async () => {
    if (!profile) return
    
    setIsSaving(true)
    try {
      const params: UpdateProfileParams = {
        firstName: editForm.firstName || null,
        lastName: editForm.lastName || null,
        company: editForm.company || null,
        role: editForm.role || null
      }
      
      const result = await updateUserProfile(params)
      if (result.success && result.data) {
        setProfile(result.data)
        setIsEditing(false)
        showSuccess('Profile updated', 'Your profile has been updated successfully.')
      } else {
        showError('Error', result.error || 'Failed to save profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      showError('Error', 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        company: profile.company || '',
        role: profile.role || ''
      })
    }
    setIsEditing(false)
  }

  const handleSettingsChange = async (newSettings: UpdateSettingsParams['settings']) => {
    if (!profile) return
    
    try {
      const result = await updateUserSettings({ settings: newSettings })
      if (result.success && result.data) {
        setProfile(result.data)
        showSuccess('Settings updated', 'Your settings have been saved.')
      } else {
        showError('Error', result.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      showError('Error', 'Failed to update settings')
    }
  }

  const handleExportData = async () => {
    try {
      const result = await exportUserData()
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `startup-simulator-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        showSuccess('Data exported', 'Your data has been downloaded.')
      } else {
        showError('Error', result.error || 'Failed to export data')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      showError('Error', 'Failed to export data')
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const result = await deleteUserAccount()
      if (result.success) {
        showSuccess('Account deleted', 'Your account has been deleted.')
        setShowDeleteConfirm(false)
        // User will be redirected by auth state change
      } else {
        showError('Error', result.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      showError('Error', 'Failed to delete account')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'default'
      case 'enterprise':
        return 'destructive'
      case 'open-source':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please sign in to view your profile</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading profile</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <UserIcon className="h-8 w-8" />
              Profile & Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your account information and preferences
            </p>
          </div>
          
          {activeTab === 'profile' && !isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <EditIcon size={16} className="mr-2" />
              Edit Profile
            </Button>
          ) : activeTab === 'profile' && isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <XIcon size={16} className="mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                <SaveIcon size={16} className="mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          ) : null}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserIcon className="w-4 h-4 inline mr-2" />
              Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <SettingsIcon className="w-4 h-4 inline mr-2" />
              Settings
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="py-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Information */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        {isEditing ? (
                          <Input
                            id="firstName"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{profile.firstName || 'Not specified'}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        {isEditing ? (
                          <Input
                            id="lastName"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{profile.lastName || 'Not specified'}</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="email">Email Address</Label>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <MailIcon size={16} />
                          {profile.email}
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="company">Company</Label>
                        {isEditing ? (
                          <Input
                            id="company"
                            value={editForm.company}
                            onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{profile.company || 'Not specified'}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="role">Role</Label>
                        {isEditing ? (
                          <Input
                            id="role"
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{profile.role || 'Not specified'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Summary */}
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Account Summary</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Plan</Label>
                        <div className="mt-1">
                          <Badge variant={getPlanBadgeVariant(profile.plan)}>
                            {profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Scenarios Created</Label>
                        <p className="text-sm text-muted-foreground mt-1">{profile.scenarioCount}</p>
                      </div>
                      
                      <div>
                        <Label>Member Since</Label>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <CalendarIcon size={16} />
                          {formatDate(profile.createdAt)}
                        </p>
                      </div>
                      
                      <div>
                        <Label>Last Login</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(profile.lastLogin)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                      Open Source Project
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                      This is a free, open-source cap table simulator. Contribute on GitHub or support the project!
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        ⭐ Star on GitHub
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        💝 Support Project
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="py-6 space-y-8">
              {/* Theme & Appearance */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <PaletteIcon className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Theme & Appearance</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Color Theme</Label>
                      <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                    </div>
                    <ThemeToggle showLabel={true} />
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BellIcon className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Notifications</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email updates about your scenarios</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.settings.notifications.email}
                      onChange={(e) => handleSettingsChange({
                        ...profile.settings,
                        notifications: {
                          ...profile.settings.notifications,
                          email: e.target.checked
                        }
                      })}
                      className="toggle"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.settings.notifications.push}
                      onChange={(e) => handleSettingsChange({
                        ...profile.settings,
                        notifications: {
                          ...profile.settings.notifications,
                          push: e.target.checked
                        }
                      })}
                      className="toggle"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Marketing Communications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates about new features and improvements</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.settings.notifications.marketing}
                      onChange={(e) => handleSettingsChange({
                        ...profile.settings,
                        notifications: {
                          ...profile.settings.notifications,
                          marketing: e.target.checked
                        }
                      })}
                      className="toggle"
                    />
                  </div>
                </div>
              </div>

              {/* Privacy */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldIcon className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Privacy</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Public Profile</Label>
                      <p className="text-sm text-muted-foreground">Allow others to see your public profile</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.settings.privacy.publicProfile}
                      onChange={(e) => handleSettingsChange({
                        ...profile.settings,
                        privacy: {
                          ...profile.settings.privacy,
                          publicProfile: e.target.checked
                        }
                      })}
                      className="toggle"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Share Analytics</Label>
                      <p className="text-sm text-muted-foreground">Help improve the app by sharing anonymous usage data</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.settings.privacy.shareAnalytics}
                      onChange={(e) => handleSettingsChange({
                        ...profile.settings,
                        privacy: {
                          ...profile.settings.privacy,
                          shareAnalytics: e.target.checked
                        }
                      })}
                      className="toggle"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Cookies</Label>
                      <p className="text-sm text-muted-foreground">Allow cookies for better experience</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.settings.privacy.allowCookies}
                      onChange={(e) => handleSettingsChange({
                        ...profile.settings,
                        privacy: {
                          ...profile.settings.privacy,
                          allowCookies: e.target.checked
                        }
                      })}
                      className="toggle"
                    />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersIcon className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Preferences</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Save</Label>
                      <p className="text-sm text-muted-foreground">Automatically save changes to scenarios</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.settings.preferences.autoSave}
                      onChange={(e) => handleSettingsChange({
                        ...profile.settings,
                        preferences: {
                          ...profile.settings.preferences,
                          autoSave: e.target.checked
                        }
                      })}
                      className="toggle"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <select
                        id="currency"
                        value={profile.settings.preferences.currency}
                        onChange={(e) => handleSettingsChange({
                          ...profile.settings,
                          preferences: {
                            ...profile.settings.preferences,
                            currency: e.target.value
                          }
                        })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD (C$)</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <select
                        id="dateFormat"
                        value={profile.settings.preferences.dateFormat}
                        onChange={(e) => handleSettingsChange({
                          ...profile.settings,
                          preferences: {
                            ...profile.settings.preferences,
                            dateFormat: e.target.value
                          }
                        })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        value={profile.settings.preferences.timezone}
                        onChange={(e) => handleSettingsChange({
                          ...profile.settings,
                          preferences: {
                            ...profile.settings.preferences,
                            timezone: e.target.value
                          }
                        })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data & Storage */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DatabaseIcon className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Data & Storage</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Export Data</Label>
                      <p className="text-sm text-muted-foreground">Download all your profile and scenario data</p>
                    </div>
                    <Button variant="outline" onClick={handleExportData}>
                      <DownloadIcon size={16} className="mr-2" />
                      Export
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Delete Account</Label>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <TrashIcon size={16} className="mr-2" />
                      Delete
                    </Button>
                  </div>
                  
                  {showDeleteConfirm && (
                    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                        Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your profile data and scenarios.
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={handleDeleteAccount}
                        >
                          Yes, Delete Account
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Tabs>
      </div>
    </AppLayout>
  )
}
