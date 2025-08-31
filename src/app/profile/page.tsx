'use client'

import { useState, useEffect, useRef } from 'react'
import { UserIcon, EditIcon, SaveIcon, LogOutIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { useNotifications } from '@/lib/stores/uiStore'
import { useAuth } from '@/lib/auth/AuthContext'
import { 
  getUserProfile, 
  updateUserSettings,
  updateUserProfile,
  type UserProfile,
  type UpdateSettingsParams
} from '@/lib/database/profile-queries'
import { usePreferencesStore, supportedCurrencies } from '@/lib/stores/preferencesStore'

export default function ProfilePage() {
  const { showSuccess, showError } = useNotifications()
  const { user, signOut } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingCurrency, setEditingCurrency] = useState(false)
  const [currency, setCurrency] = useState('USD')
  const [saving, setSaving] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const setPrefCurrency = usePreferencesStore(s => s.setCurrency)
  const initialized = usePreferencesStore(s => s.initialized)
  const setInitialized = usePreferencesStore(s => s.setInitialized)

  const initialLoadedRef = useRef(false)

  useEffect(() => {
    const load = async () => {
      if (!user) { setIsLoading(false); return }
      try {
        const res = await getUserProfile()
        if (res.success && res.data) {
          setProfile(res.data)
          const userCurrency = res.data.settings.preferences.currency || 'USD'
          // Only populate local edit buffers on initial load or if not actively editing
          if (!initialLoadedRef.current || !editingName) {
            setFirstName(res.data.firstName || '')
            setLastName(res.data.lastName || '')
          }
            if (!initialLoadedRef.current || !editingCurrency) {
            setCurrency(userCurrency)
          }
          if (!initialized) {
            setPrefCurrency(userCurrency)
            setInitialized()
          }
          if (!initialLoadedRef.current) initialLoadedRef.current = true
        } else {
          showError('Error', res.error || 'Failed to load profile')
        }
  } catch {
        showError('Error', 'Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [user, editingName, editingCurrency, initialized, setPrefCurrency, setInitialized, showError])

  const saveCurrency = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const newSettings: UpdateSettingsParams['settings'] = {
        ...profile.settings,
        preferences: {
          ...profile.settings.preferences,
          currency
        }
      }
      const res = await updateUserSettings({ settings: newSettings })
      if (res.success && res.data) {
        setProfile(res.data)
        setEditingCurrency(false)
        setPrefCurrency(currency)
        showSuccess('Saved', 'Currency updated.')
      } else {
        showError('Error', res.error || 'Failed to save currency')
      }
  } catch {
      showError('Error', 'Failed to save currency')
    } finally {
      setSaving(false)
    }
  }

  const saveName = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const res = await updateUserProfile({ firstName, lastName })
      if (res.success && res.data) {
        setProfile(res.data)
        setEditingName(false)
        showSuccess('Saved', 'Name updated.')
      } else {
        showError('Error', res.error || 'Failed to save name')
      }
    } catch {
      showError('Error', 'Failed to save name')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        showError('Error', error.message)
      } else {
        showSuccess('Signed Out', 'You have been signed out.')
        router.push('/')
      }
    } catch {
      showError('Error', 'Sign out failed')
    }
  }

  // Removed other settings per simplification request

  const formatDate = (d: string) => new Date(d).toLocaleDateString()

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
        <div className="flex items-center justify-center h-[50vh] text-muted-foreground">Profile unavailable</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <UserIcon className="h-7 w-7" /> Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Manage your profile details & preferences.</p>
          <p className="text-xs text-muted-foreground mt-1">Member since {formatDate(profile.createdAt)}</p>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Name</h2>
                <p className="text-xs text-muted-foreground mt-1">Displayed across the app.</p>
              </div>
              {!editingName ? (
                <Button size="sm" variant="outline" onClick={() => setEditingName(true)}>
                  <EditIcon className="h-4 w-4 mr-1" /> Edit
                </Button>
              ) : (
                <Button size="sm" onClick={saveName} disabled={saving}>
                  <SaveIcon className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
            {!editingName ? (
              <div className="text-2xl font-semibold tracking-tight">{[firstName, lastName].filter(Boolean).join(' ') || '—'}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                />
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Preferred Currency</h2>
                <p className="text-xs text-muted-foreground mt-1">Used for valuations & exits.</p>
              </div>
              {!editingCurrency ? (
                <Button size="sm" variant="outline" onClick={() => setEditingCurrency(true)}>
                  <EditIcon className="h-4 w-4 mr-1" /> Edit
                </Button>
              ) : (
                <Button size="sm" onClick={saveCurrency} disabled={saving}>
                  <SaveIcon className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
            <div>
              {editingCurrency ? (
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {supportedCurrencies.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              ) : (
                <div className="text-2xl font-semibold tracking-tight">{currency}</div>
              )}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight mb-4">Account</h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{profile.email}</span>
              </div>
              <Button variant="destructive" onClick={handleSignOut} size="sm">
                <LogOutIcon className="h-4 w-4 mr-1" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
