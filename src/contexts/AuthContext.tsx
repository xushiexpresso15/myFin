import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile, isSupabaseConfigured } from '../lib/supabaseClient'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    loading: boolean
    error: string | null
    signInWithGoogle: () => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Get the redirect URL based on platform
const getRedirectUrl = (): string => {
    if (typeof window === 'undefined') {
        return 'https://xushiexpresso15.github.io/myFin/'
    }
    // For web, use the current URL without hash
    return window.location.origin + window.location.pathname
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Handle URL hash for OAuth callback (works for both web and Capacitor)
    useEffect(() => {
        const handleAuthCallback = async () => {
            // Check for hash with tokens
            const hash = window.location.hash
            if (hash && hash.includes('access_token')) {
                console.log('Found access token in URL hash')
                const params = new URLSearchParams(hash.substring(1))
                const accessToken = params.get('access_token')
                const refreshToken = params.get('refresh_token')

                if (accessToken && refreshToken) {
                    try {
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken
                        })
                        if (sessionError) {
                            console.error('Session set error:', sessionError)
                        }
                        // Clear the hash but keep the path
                        if (window.history.replaceState) {
                            window.history.replaceState(null, '', window.location.pathname)
                        }
                    } catch (err) {
                        console.error('Auth callback error:', err)
                    }
                }
            }
        }

        handleAuthCallback()
    }, [])

    useEffect(() => {
        // Check if Supabase is configured
        if (!isSupabaseConfigured) {
            setError('Supabase 尚未設定。請檢查環境變數。')
            setLoading(false)
            return
        }

        let mounted = true

        // Get initial session with timeout
        const timeout = setTimeout(() => {
            if (mounted) {
                setLoading(false)
            }
        }, 8000) // 8 second timeout

        supabase.auth.getSession()
            .then(({ data: { session: currentSession }, error: sessionError }) => {
                if (!mounted) return
                clearTimeout(timeout)

                if (sessionError) {
                    console.error('Session error:', sessionError)
                    // Don't set error for auth errors, just show login
                    setLoading(false)
                    return
                }

                setSession(currentSession)
                setUser(currentSession?.user ?? null)

                if (currentSession?.user) {
                    fetchProfile(currentSession.user.id)
                }
                setLoading(false)
            })
            .catch((err) => {
                if (!mounted) return
                clearTimeout(timeout)
                console.error('Auth error:', err)
                setLoading(false)
            })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted) return
                console.log('Auth event:', event)

                setSession(newSession)
                setUser(newSession?.user ?? null)

                if (event === 'SIGNED_IN' && newSession?.user) {
                    try {
                        await createOrUpdateProfile(newSession.user)
                        await initializeUserData(newSession.user.id)
                        fetchProfile(newSession.user.id)
                    } catch (err) {
                        console.error('Error initializing user data:', err)
                    }
                }

                if (!newSession?.user) {
                    setProfile(null)
                }

                setLoading(false)
            }
        )

        return () => {
            mounted = false
            clearTimeout(timeout)
            subscription.unsubscribe()
        }
    }, [])

    async function fetchProfile(userId: string) {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (data) {
                setProfile(data as Profile)
            }
        } catch (err) {
            console.error('Profile fetch error:', err)
        }
    }

    async function createOrUpdateProfile(user: User) {
        try {
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single()

            if (!existingProfile) {
                await supabase.from('profiles').insert({
                    id: user.id,
                    display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                    avatar_url: user.user_metadata?.avatar_url || null
                })
            }
        } catch (err) {
            // Ignore errors - profile might already exist
            console.log('Profile create/update:', err)
        }
    }

    async function initializeUserData(userId: string) {
        try {
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
        } catch (err) {
            console.error('Initialize user data error:', err)
        }
    }

    async function signInWithGoogle() {
        try {
            setError(null)
            const redirectUrl = getRedirectUrl()
            console.log('Sign in redirect URL:', redirectUrl)

            const { error: signInError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl
                }
            })

            if (signInError) {
                console.error('Sign in error:', signInError)
                setError('登入失敗：' + signInError.message)
            }
        } catch (err) {
            console.error('Sign in exception:', err)
            setError('登入過程發生錯誤')
        }
    }

    async function signOut() {
        try {
            await supabase.auth.signOut()
        } catch (err) {
            console.error('Sign out error:', err)
        }
        setUser(null)
        setProfile(null)
        setSession(null)
    }

    const value = {
        user,
        profile,
        session,
        loading,
        error,
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
