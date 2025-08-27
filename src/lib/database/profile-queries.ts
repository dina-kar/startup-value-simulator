/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase, handleSupabaseError, handleSupabaseSuccess, getCurrentUser } from './supabase'
import type { UserSettings } from '@/types/database'

export interface UserProfile {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  company: string | null
  role: string | null
  avatarUrl: string | null
  settings: UserSettings
  createdAt: string
  updatedAt: string
  scenarioCount: number
  lastLogin: string
  plan: 'free' | 'pro' | 'enterprise' | 'open-source'
}

export interface UpdateProfileParams {
  firstName?: string | null
  lastName?: string | null
  company?: string | null
  role?: string | null
  avatarUrl?: string | null
}

export interface UpdateSettingsParams {
  settings: UserSettings
}

const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    email: true,
    push: false,
    marketing: false
  },
  privacy: {
    publicProfile: false,
    shareAnalytics: true,
    allowCookies: true
  },
  preferences: {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'America/New_York',
    autoSave: true
  }
}

export async function getUserProfile(): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Get user profile from database
    const { data: profileData, error: profileError } = await (supabase as any)
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    let profile = profileData
    
    // If profile doesn't exist, create it
    if (profileError && profileError.code === 'PGRST116') {
      const fullName = user.user_metadata?.full_name || ''
      const nameParts = fullName.split(' ')
      
      const { data: newProfile, error: createError } = await (supabase as any)
        .from('user_profiles')
        .insert({
          id: user.id,
          first_name: nameParts[0] || null,
          last_name: nameParts.slice(1).join(' ') || null,
          settings: DEFAULT_SETTINGS
        })
        .select()
        .single()

      if (createError) {
        return handleSupabaseError(createError)
      }
      profile = newProfile
    } else if (profileError) {
      return handleSupabaseError(profileError)
    }

    if (!profile) {
      return {
        success: false,
        error: 'Failed to load or create profile'
      }
    }

    // Get scenario count
    const { count: scenarioCount } = await (supabase as any)
      .from('scenarios')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const userProfile: UserProfile = {
      id: user.id,
      email: user.email || '',
      firstName: profile.first_name,
      lastName: profile.last_name,
      company: profile.company,
      role: profile.role,
      avatarUrl: profile.avatar_url,
      settings: profile.settings || DEFAULT_SETTINGS,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      scenarioCount: scenarioCount || 0,
      lastLogin: user.last_sign_in_at || user.created_at || '',
      plan: 'open-source' // For this open-source version
    }

    return handleSupabaseSuccess(userProfile)
  } catch (error) {
    return handleSupabaseError(error)
  }
}

export async function updateUserProfile(params: UpdateProfileParams): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({
        first_name: params.firstName,
        last_name: params.lastName,
        company: params.company,
        role: params.role,
        avatar_url: params.avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      return handleSupabaseError(error)
    }

    // Return updated profile
    return getUserProfile()
  } catch (error) {
    return handleSupabaseError(error)
  }
}

export async function updateUserSettings(params: UpdateSettingsParams): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({
        settings: params.settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      return handleSupabaseError(error)
    }

    // Return updated profile
    return getUserProfile()
  } catch (error) {
    return handleSupabaseError(error)
  }
}

export async function exportUserData(): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Get user profile
    const profileResult = await getUserProfile()
    if (!profileResult.success || !profileResult.data) {
      return {
        success: false,
        error: 'Failed to load user profile'
      }
    }

    // Get user scenarios
    const { data: scenarios, error: scenariosError } = await (supabase as any)
      .from('scenarios')
      .select('*')
      .eq('user_id', user.id)

    if (scenariosError) {
      return handleSupabaseError(scenariosError)
    }

    const exportData = {
      profile: profileResult.data,
      scenarios: scenarios || [],
      exportedAt: new Date().toISOString()
    }

    return handleSupabaseSuccess(JSON.stringify(exportData, null, 2))
  } catch (error) {
    return handleSupabaseError(error)
  }
}

export async function deleteUserAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Delete user profile (scenarios will be deleted via CASCADE)
    const { error: profileError } = await (supabase as any)
      .from('user_profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      return handleSupabaseError(profileError)
    }

    // Sign out the user
    await supabase.auth.signOut()

    return { success: true }
  } catch (error) {
    return handleSupabaseError(error)
  }
}
