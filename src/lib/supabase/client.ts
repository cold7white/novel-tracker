import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
}) : null;

// Database types (will be generated with Supabase CLI later)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      novels: {
        Row: {
          id: string
          user_id: string
          title: string
          author: string | null
          status: 'reading' | 'read' | 'want' | null
          rating: number | null
          tags: string[]
          details: string | null
          reading_date: string | null
          cover_color: string
          cover_image: string | null
          created_at: string
          updated_at: string
          category_id: string | null
          excerpts: any[] | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          author?: string | null
          status?: 'reading' | 'read' | 'want' | null
          rating?: number | null
          tags?: string[]
          details?: string | null
          reading_date?: string | null
          cover_color?: string
          cover_image?: string | null
          created_at?: string
          updated_at?: string
          category_id?: string | null
          excerpts?: any[] | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          author?: string | null
          status?: 'reading' | 'read' | 'want' | null
          rating?: number | null
          tags?: string[]
          details?: string | null
          reading_date?: string | null
          cover_color?: string
          cover_image?: string | null
          created_at?: string
          updated_at?: string
          category_id?: string | null
          excerpts?: any[] | null
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
      }
    }
  }
}
