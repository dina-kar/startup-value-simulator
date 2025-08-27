/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { supabase, handleSupabaseError, handleSupabaseSuccess, getCurrentUser } from './supabase'
import type { Scenario } from '@/types/scenario'

export interface SaveScenarioParams {
  scenario: Scenario
  isPublic?: boolean
}

export interface SaveScenarioResponse {
  success: boolean
  data?: Scenario
  error?: string
}

export interface LoadScenariosResponse {
  success: boolean
  data?: {
    scenarios: Scenario[]
    total: number
  }
  error?: string
}

export interface ShareScenarioResponse {
  success: boolean
  data?: {
    shareUrl: string
    shareToken: string
  }
  error?: string
}

export interface LoadSharedScenarioResponse {
  success: boolean
  data?: Scenario
  error?: string
}

export async function saveScenario({ scenario, isPublic = false }: SaveScenarioParams): Promise<SaveScenarioResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const scenarioData = {
      id: scenario.id,
      name: scenario.name,
      user_id: user.id,
      data: scenario,
      is_public: isPublic,
      updated_at: new Date().toISOString()
    }

    // Check if scenario exists
    const { data: existing } = await (supabase as any)
      .from('scenarios')
      .select('id')
      .eq('id', scenario.id)
      .single()

    if (existing) {
      // Update existing scenario
      const { data, error } = await (supabase as any)
        .from('scenarios')
        .update(scenarioData)
        .eq('id', scenario.id)
        .select()
        .single()

      if (error) {
        return handleSupabaseError(error)
      }
      return handleSupabaseSuccess(data.data as Scenario)
    } else {
      // Insert new scenario
      const { data, error } = await (supabase as any)
        .from('scenarios')
        .insert([{
          ...scenarioData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        return handleSupabaseError(error)
      }
      return handleSupabaseSuccess(data.data as Scenario)
    }
  } catch (error) {
    return handleSupabaseError(error)
  }
}

export async function loadUserScenarios(): Promise<LoadScenariosResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const { data, error } = await (supabase as any)
      .from('scenarios')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      return handleSupabaseError(error)
    }

    const scenarios = data?.map((row: any) => row.data) || []
    
    return handleSupabaseSuccess({
      scenarios,
      total: scenarios.length
    })
  } catch (error) {
    return handleSupabaseError(error)
  }
}

export async function loadScenario(scenarioId: string): Promise<SaveScenarioResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const { data, error } = await (supabase as any)
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return handleSupabaseError(error)
    }

    return handleSupabaseSuccess(data.data as Scenario)
  } catch (error) {
    return handleSupabaseError(error)
  }
}

export async function deleteScenario(scenarioId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const { error } = await (supabase as any)
      .from('scenarios')
      .delete()
      .eq('id', scenarioId)
      .eq('user_id', user.id)

    if (error) {
      return handleSupabaseError(error)
    }

    return { success: true }
  } catch (error) {
    return handleSupabaseError(error)
  }
}

export async function shareScenario(scenarioId: string, options: {
  isPublic?: boolean
  canView?: boolean
  canCopy?: boolean
  expiresAt?: Date
} = {}): Promise<ShareScenarioResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Generate a unique share token
    const shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    const { data, error } = await (supabase as any)
      .from('shared_scenarios')
      .insert([{
        scenario_id: scenarioId,
        share_token: shareToken,
        is_public: options.isPublic || false,
        can_view: options.canView !== false,
        can_copy: options.canCopy || false,
        expires_at: options.expiresAt?.toISOString() || null
      }])
      .select()
      .single()

    if (error) {
      return handleSupabaseError(error)
    }

    const shareUrl = `${window.location.origin}/shared/${shareToken}`
    
    return handleSupabaseSuccess({
      shareUrl,
      shareToken: data.share_token
    })
  } catch (error) {
    return handleSupabaseError(error)
  }
}

export async function loadSharedScenario(shareToken: string): Promise<LoadSharedScenarioResponse> {
  try {
    // Get the shared scenario metadata
    const { data: sharedData, error: sharedError } = await (supabase as any)
      .from('shared_scenarios')
      .select('*')
      .eq('share_token', shareToken)
      .single()

    if (sharedError) {
      return handleSupabaseError(sharedError)
    }

    // Check if the share link is valid and not expired
    if (sharedData.expires_at && new Date(sharedData.expires_at) < new Date()) {
      return {
        success: false,
        error: 'Share link has expired'
      }
    }

    // Get the actual scenario data
    const { data: scenarioData, error: scenarioError } = await (supabase as any)
      .from('scenarios')
      .select('*')
      .eq('id', sharedData.scenario_id)
      .single()

    if (scenarioError) {
      return handleSupabaseError(scenarioError)
    }

    return handleSupabaseSuccess(scenarioData.data as Scenario)
  } catch (error) {
    return handleSupabaseError(error)
  }
}

export async function revokeShare(shareToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const { error } = await (supabase as any)
      .from('shared_scenarios')
      .delete()
      .eq('share_token', shareToken)

    if (error) {
      return handleSupabaseError(error)
    }

    return { success: true }
  } catch (error) {
    return handleSupabaseError(error)
  }
}
