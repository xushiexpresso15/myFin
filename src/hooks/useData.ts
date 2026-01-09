import { useState, useEffect, useCallback } from 'react'
import { supabase, Transaction, Category, FundingSource } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export function useCategories() {
    const { user } = useAuth()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    const fetchCategories = useCallback(async () => {
        if (!user) return

        const { data } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id)
            .order('name')

        if (data) setCategories(data)
        setLoading(false)
    }, [user])

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    const addCategory = async (category: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
        if (!user) return

        const { data, error } = await supabase
            .from('categories')
            .insert({ ...category, user_id: user.id })
            .select()
            .single()

        if (data && !error) {
            setCategories(prev => [...prev, data])
        }
        return { data, error }
    }

    const updateCategory = async (id: string, updates: Partial<Category>) => {
        const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (data && !error) {
            setCategories(prev => prev.map(c => c.id === id ? data : c))
        }
        return { data, error }
    }

    const deleteCategory = async (id: string) => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)

        if (!error) {
            setCategories(prev => prev.filter(c => c.id !== id))
        }
        return { error }
    }

    return {
        categories,
        loading,
        refetch: fetchCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        expenseCategories: categories.filter(c => c.type === 'expense' && c.is_active),
        incomeCategories: categories.filter(c => c.type === 'income' && c.is_active)
    }
}

export function useFundingSources() {
    const { user } = useAuth()
    const [fundingSources, setFundingSources] = useState<FundingSource[]>([])
    const [loading, setLoading] = useState(true)

    const fetchFundingSources = useCallback(async () => {
        if (!user) return

        const { data } = await supabase
            .from('funding_sources')
            .select('*')
            .eq('user_id', user.id)
            .order('name')

        if (data) setFundingSources(data)
        setLoading(false)
    }, [user])

    useEffect(() => {
        fetchFundingSources()
    }, [fetchFundingSources])

    const addFundingSource = async (source: Omit<FundingSource, 'id' | 'user_id' | 'created_at'>) => {
        if (!user) return

        const { data, error } = await supabase
            .from('funding_sources')
            .insert({ ...source, user_id: user.id })
            .select()
            .single()

        if (data && !error) {
            setFundingSources(prev => [...prev, data])
        }
        return { data, error }
    }

    const updateFundingSource = async (id: string, updates: Partial<FundingSource>) => {
        const { data, error } = await supabase
            .from('funding_sources')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (data && !error) {
            setFundingSources(prev => prev.map(fs => fs.id === id ? data : fs))
        }
        return { data, error }
    }

    const deleteFundingSource = async (id: string) => {
        const { error } = await supabase
            .from('funding_sources')
            .delete()
            .eq('id', id)

        if (!error) {
            setFundingSources(prev => prev.filter(fs => fs.id !== id))
        }
        return { error }
    }

    return {
        fundingSources,
        loading,
        refetch: fetchFundingSources,
        addFundingSource,
        updateFundingSource,
        deleteFundingSource,
        personalSources: fundingSources.filter(fs => fs.is_personal),
        othersSources: fundingSources.filter(fs => !fs.is_personal)
    }
}

export function useTransactions(dateRange?: { start: string; end: string }) {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTransactions = useCallback(async () => {
        if (!user) return

        let query = supabase
            .from('transactions')
            .select(`
        *,
        category:categories(*),
        funding_source:funding_sources(*)
      `)
            .eq('user_id', user.id)
            .order('transaction_date', { ascending: false })
            .order('created_at', { ascending: false })

        if (dateRange) {
            query = query
                .gte('transaction_date', dateRange.start)
                .lte('transaction_date', dateRange.end)
        }

        const { data } = await query

        if (data) setTransactions(data)
        setLoading(false)
    }, [user, dateRange?.start, dateRange?.end])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const addTransaction = async (transaction: {
        category_id: string
        funding_source_id: string
        amount: number
        type: 'income' | 'expense'
        description?: string
        transaction_date: string
    }) => {
        if (!user) return

        const { data, error } = await supabase
            .from('transactions')
            .insert({ ...transaction, user_id: user.id })
            .select(`
        *,
        category:categories(*),
        funding_source:funding_sources(*)
      `)
            .single()

        if (data && !error) {
            setTransactions(prev => [data, ...prev])
        }
        return { data, error }
    }

    const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
        const { data, error } = await supabase
            .from('transactions')
            .update(updates)
            .eq('id', id)
            .select(`
        *,
        category:categories(*),
        funding_source:funding_sources(*)
      `)
            .single()

        if (data && !error) {
            setTransactions(prev => prev.map(t => t.id === id ? data : t))
        }
        return { data, error }
    }

    const deleteTransaction = async (id: string) => {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id)

        if (!error) {
            setTransactions(prev => prev.filter(t => t.id !== id))
        }
        return { error }
    }

    return {
        transactions,
        loading,
        refetch: fetchTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction
    }
}
