import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabaseClient'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            }
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session)
                setUser(session?.user ?? null)

                if (event === 'SIGNED_IN' && session?.user) {
                    await createOrUpdateProfile(session.user)
                    await initializeUserData(session.user.id)
                }

                if (session?.user) {
                    fetchProfile(session.user.id)
                } else {
                    setProfile(null)
                }

                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    async function fetchProfile(userId: string) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (data) {
            setProfile(data)
        }
    }

    async function createOrUpdateProfile(user: User) {
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single()

        if (!existingProfile) {
            await supabase.from('profiles').insert({
                id: user.id,
                display_name: user.user_metadata.full_name || user.email?.split('@')[0],
                avatar_url: user.user_metadata.avatar_url
            })
        }
    }

    async function initializeUserData(userId: string) {
        // Check if user has categories
        const { data: categories } = await supabase
            .from('categories')
            .select('id')
            .eq('user_id', userId)
            .limit(1)

        // If no categories, create default ones
        if (!categories || categories.length === 0) {
            const defaultCategories = [
                { name: '飲食', type: 'expense', icon: '🍔', color: '#ef4444' },
                { name: '交通', type: 'expense', icon: '🚗', color: '#f59e0b' },
                { name: '購物', type: 'expense', icon: '🛍️', color: '#ec4899' },
                { name: '娛樂', type: 'expense', icon: '🎮', color: '#8b5cf6' },
                { name: '帳單', type: 'expense', icon: '📄', color: '#3b82f6' },
                { name: '醫療', type: 'expense', icon: '💊', color: '#14b8a6' },
                { name: '教育', type: 'expense', icon: '📚', color: '#6366f1' },
                { name: '其他支出', type: 'expense', icon: '💸', color: '#64748b' },
                { name: '薪資', type: 'income', icon: '💰', color: '#10b981' },
                { name: '獎金', type: 'income', icon: '🎁', color: '#22c55e' },
                { name: '投資收入', type: 'income', icon: '📈', color: '#059669' },
                { name: '其他收入', type: 'income', icon: '💵', color: '#15803d' }
            ]

            await supabase.from('categories').insert(
                defaultCategories.map(cat => ({
                    ...cat,
                    user_id: userId,
                    is_active: true
                }))
            )
        }

        // Check if user has funding sources
        const { data: fundingSources } = await supabase
            .from('funding_sources')
            .select('id')
            .eq('user_id', userId)
            .limit(1)

        // If no funding sources, create default ones
        if (!fundingSources || fundingSources.length === 0) {
            const defaultFundingSources = [
                { name: '自己的錢', is_personal: true, color: '#10b981' },
                { name: '家人的卡', is_personal: false, color: '#f59e0b' }
            ]

            await supabase.from('funding_sources').insert(
                defaultFundingSources.map(fs => ({
                    ...fs,
                    user_id: userId
                }))
            )
        }
    }

    async function signInWithGoogle() {
        // 取得當前網址的 origin，支援 GitHub Pages
        const redirectUrl = window.location.origin + window.location.pathname
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl
            }
        })
    }

    async function signOut() {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setSession(null)
    }

    const value = {
        user,
        profile,
        session,
        loading,
        signInWithGoogle,
        signOut
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
