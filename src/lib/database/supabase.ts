import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('getCurrentUser error:', error)
    throw error
  }
  return user
}

// Helper to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session?.user
}

// Helper for error handling
export const handleSupabaseError = (error: unknown): { success: false; error: string } => {
  // Only log non-empty errors to avoid spam
  if (error && typeof error === 'object' && Object.keys(error).length > 0) {
    console.error('Supabase error:', error)
  } else if (error && typeof error === 'string' && error.trim()) {
    console.error('Supabase error:', error)
  } else if (error instanceof Error) {
    console.error('Supabase error:', error)
  }
  
  // Handle different types of errors
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message
    }
  }
  
  // Handle Supabase-specific errors
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message
    if (message && typeof message === 'string' && message.trim()) {
      return {
        success: false,
        error: message
      }
    }
  }
  
  // Handle case where error is empty object or null
  if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
    return { success: false, error: 'Unknown database error' }
  }
  
  // Try to stringify the error for debugging
  try {
    const errorString = JSON.stringify(error)
    if (errorString && errorString !== '{}') {
      return {
        success: false,
        error: `Database error: ${errorString}`
      }
    }
  } catch {
    // JSON.stringify failed, fall through to default
  }
  
  return {
    success: false,
    error: 'An unexpected error occurred'
  }
}

// Helper for success responses
export const handleSupabaseSuccess = <T>(data: T): { success: true; data: T } => {
  return {
    success: true,
    data
  }
}
