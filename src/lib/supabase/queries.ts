import { supabase } from './client'
import type { Database } from './client'

type NovelInsert = Database['public']['Tables']['novels']['Insert']
type NovelUpdate = Database['public']['Tables']['novels']['Update']

type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

// type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert']
// type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update']

// Helper function to ensure supabase is available
const getSupabase = () => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

// Novels queries
export const novelQueries = {
  // Get all novels for current user
  getAll: async () => {
    const { data, error } = await getSupabase()
      .from('novels')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get novel by ID
  getById: async (id: string) => {
    const { data, error } = await getSupabase()
      .from('novels')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create new novel
  create: async (novel: NovelInsert) => {
    const { data, error } = await getSupabase()
      .from('novels')
      .insert(novel)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update novel
  update: async (id: string, updates: NovelUpdate) => {
    const { data, error } = await getSupabase()
      .from('novels')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ [Supabase] Update failed:', error)
      console.error('❌ [Supabase] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }
    return data
  },

  // Delete novel
  delete: async (id: string) => {
    const { error } = await getSupabase()
      .from('novels')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get novels by category
  getByCategory: async (categoryId: string) => {
    const { data, error } = await getSupabase()
      .from('novels')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },
}

// Categories queries
export const categoryQueries = {
  // Get all categories for current user
  getAll: async () => {
    const { data, error } = await getSupabase()
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  },

  // Create new category
  create: async (category: CategoryInsert) => {
    const { data, error } = await getSupabase()
      .from('categories')
      .insert(category)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update category
  update: async (id: string, updates: CategoryUpdate) => {
    const { data, error } = await getSupabase()
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete category
  delete: async (id: string) => {
    const { error } = await getSupabase()
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// User settings queries
export const userSettingsQueries = {
  // Get user settings
  get: async (userId: string) => {
    const { data, error } = await getSupabase()
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  // Upsert user settings
  upsert: async (userId: string, aiSettings: Record<string, unknown>) => {
    const { data, error } = await getSupabase()
      .from('user_settings')
      .upsert({
        user_id: userId,
        ai_settings: aiSettings,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error
    return data
  },
}

// Auth queries
export const authQueries = {
  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await getSupabase().auth.getUser()
    if (error) throw error
    return user
  },

  // Sign up
  signUp: async (email: string, password: string) => {
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  // Sign in
  signIn: async (email: string, password: string) => {
    const { data, error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  // Sign out
  signOut: async () => {
    const { error } = await getSupabase().auth.signOut()
    if (error) throw error
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email)
    if (error) throw error
  },
}

// Real-time subscriptions
export const subscribeToNovels = (callback: (payload: any) => void) => {
  return getSupabase()
    .channel('novels-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'novels',
      },
      callback
    )
    .subscribe()
}

export const subscribeToCategories = (callback: (payload: any) => void) => {
  return getSupabase()
    .channel('categories-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'categories',
      },
      callback
    )
    .subscribe()
}
