import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile, isSupabaseConfigured } from '../lib/supabaseClient'

// Capacitor App plugin for deep links
let CapacitorApp: any = null
try {
    // Dynamic import to avoid issues on web
    import('@capacitor/app').then(module => {
        CapacitorApp = module.App
    }).catch(() => {
        console.log('Capacitor App plugin not available (web mode)')
    })
} catch {
    console.log('Running in web mode')
}

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

// Custom scheme for deep link
const APP_SCHEME = 'myfin'
const REDIRECT_URL = `${APP_SCHEME}://auth/callback`
const WEB_REDIRECT_URL = typeof window !== 'undefined'
    ? window.location.origin + window.location.pathname
    : 'https://xushiexpresso15.github.io/myFin/'

// Detect if running in Capacitor
const isCapacitor = typeof window !== 'undefined' &&
    (window as any).Capacitor !== undefined

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Handle deep link for OAuth callback
    useEffect(() => {
        if (!isCapacitor || !CapacitorApp) return

        const handleAppUrlOpen = async (event: { url: string }) => {
            console.log('Deep link received:', event.url)

            // Check if it's our auth callback
            if (event.url.startsWith(APP_SCHEME + '://auth')) {
                // Extract the tokens from the URL
                const url = new URL(event.url.replace(`${APP_SCHEME}://`, 'https://'))
                const accessToken = url.searchParams.get('access_token')
                const refreshToken = url.searchParams.get('refresh_token')

                if (accessToken && refreshToken) {
                    try {
                        const { data, error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken
                        })

                        if (error) {
                            console.error('Session set error:', error)
                            setError('登入失敗')
                        } else if (data.session) {
                            setSession(data.session)
                            setUser(data.session.user)
                            await createOrUpdateProfile(data.session.user)
                            await initializeUserData(data.session.user.id)
                            fetchProfile(data.session.user.id)
                        }
                    } catch (err) {
                        console.error('Deep link auth error:', err)
                    }
                }
            }
        }

        // Listen for app URL open events
        CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen)

        return () => {
            CapacitorApp.removeAllListeners()
        }
    }, [])

    // Handle URL hash for web OAuth callback
    useEffect(() => {
        const handleHashChange = async () => {
            const hash = window.location.hash
            if (hash && hash.includes('access_token')) {
                // Parse the hash
                const params = new URLSearchParams(hash.substring(1))
                const accessToken = params.get('access_token')
                const refreshToken = params.get('refresh_token')

                if (accessToken && refreshToken) {
                    try {
                        await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken
                        })
                        // Clear the hash
                        window.location.hash = ''
                    } catch (err) {
                        console.error('Hash auth error:', err)
                    }
                }
            }
        }

        handleHashChange()
    }, [])

    useEffect(() => {
        // Check if Supabase is configured
        if (!isSupabaseConfigured) {
            setError('Supabase 尚未設定。請檢查環境變數。')
            setLoading(false)
            return
        }

        // Get initial session with timeout
        const timeout = setTimeout(() => {
            setLoading(false)
            setError('連線逾時，請檢查網路連線。')
        }, 10000) // 10 second timeout

        supabase.auth.getSession()
            .then(({ data: { session }, error: sessionError }) => {
                clearTimeout(timeout)
                if (sessionError) {
                    console.error('Session error:', sessionError)
                    setError('無法取得登入狀態')
                    setLoading(false)
                    return
                }
                setSession(session)
                setUser(session?.user ?? null)
                if (session?.user) {
                    fetchProfile(session.user.id)
                }
                setLoading(false)
            })
            .catch((err) => {
                clearTimeout(timeout)
                console.error('Auth error:', err)
                setError('連線錯誤')
                setLoading(false)
            })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth event:', event)
                setSession(session)
                setUser(session?.user ?? null)

                if (event === 'SIGNED_IN' && session?.user) {
                    try {
                        await createOrUpdateProfile(session.user)
                        await initializeUserData(session.user.id)
                    } catch (err) {
                        console.error('Error initializing user data:', err)
                    }
                }

                if (session?.user) {
                    fetchProfile(session.user.id)
                } else {
                    setProfile(null)
                }

                setLoading(false)
            }
        )

        return () => {
            clearTimeout(timeout)
            subscription.unsubscribe()
        }
    }, [])

    async function fetchProfile(userId: string) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.error('Profile fetch error:', error)
                return
            }

            if (data) {
                setProfile(data)
            }
        } catch (err) {
            console.error('Profile fetch exception:', err)
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
                    display_name: user.user_metadata.full_name || user.email?.split('@')[0],
                    avatar_url: user.user_metadata.avatar_url
                })
            }
        } catch (err) {
            console.error('Create profile error:', err)
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
            // Use different redirect based on platform
            const redirectTo = isCapacitor ? REDIRECT_URL : WEB_REDIRECT_URL

            console.log('Signing in with redirect:', redirectTo)

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectTo,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            })

            if (error) {
                console.error('Sign in error:', error)
                setError('登入失敗：' + error.message)
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
