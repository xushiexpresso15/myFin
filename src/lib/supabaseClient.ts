import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Create a dummy client if credentials are missing to prevent crashes
let supabase: SupabaseClient

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
    console.error('⚠️ Supabase credentials not found!')
    console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
    // Create a dummy client that won't crash but also won't work
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key')
}

export { supabase }
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Type definitions for our database
export interface Profile {
    id: string
    display_name: string | null
    avatar_url: string | null
    created_at: string
}

export interface Category {
    id: string
    user_id: string
    name: string
    type: 'income' | 'expense'
    icon: string
    color: string
    is_active: boolean
    created_at: string
}

export interface FundingSource {
    id: string
    user_id: string
    name: string
    is_personal: boolean
    color: string
    created_at: string
}

export interface Transaction {
    id: string
    user_id: string
    category_id: string
    funding_source_id: string
    amount: number
    type: 'income' | 'expense'
    description: string | null
    transaction_date: string
    created_at: string
    // Joined fields
    category?: Category
    funding_source?: FundingSource
}
