import type { Scenario } from './scenario'

export interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    marketing: boolean
  }
  privacy: {
    publicProfile: boolean
    shareAnalytics: boolean
    allowCookies: boolean
  }
  preferences: {
    currency: string
    dateFormat: string
    timezone: string
    autoSave: boolean
  }
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          company: string | null
          role: string | null
          avatar_url: string | null
          settings: UserSettings
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          company?: string | null
          role?: string | null
          avatar_url?: string | null
          settings?: UserSettings
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          company?: string | null
          role?: string | null
          avatar_url?: string | null
          settings?: UserSettings
          created_at?: string
          updated_at?: string
        }
      }
      scenarios: {
        Row: {
          id: string
          name: string
          user_id: string | null
          data: Scenario // JSONB type for complete scenario data
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id?: string | null
          data: Scenario
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string | null
          data?: Scenario
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shared_scenarios: {
        Row: {
          id: string
          scenario_id: string
          share_token: string
          is_public: boolean
          can_view: boolean
          can_copy: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          scenario_id: string
          share_token: string
          is_public?: boolean
          can_view?: boolean
          can_copy?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          scenario_id?: string
          share_token?: string
          is_public?: boolean
          can_view?: boolean
          can_copy?: boolean
          expires_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
