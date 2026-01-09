import { useMemo } from 'react'
import { Transaction } from '../lib/supabaseClient'

interface AnalyticsData {
    totalIncome: number
    totalExpense: number
    balance: number
    personalExpense: number
    othersExpense: number
    personalIncome: number
    othersIncome: number
    categoryBreakdown: {
        category: string
        icon: string
        color: string
        amount: number
        percentage: number
        type: 'income' | 'expense'
    }[]
    monthlyTrend: {
        month: string
        income: number
        expense: number
    }[]
    fundingSourceBreakdown: {
        name: string
        color: string
        isPersonal: boolean
        amount: number
        percentage: number
    }[]
}

export function useAnalytics(transactions: Transaction[]): AnalyticsData {
    return useMemo(() => {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0)

        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)

        const personalExpense = transactions
            .filter(t => t.type === 'expense' && t.funding_source?.is_personal)
            .reduce((sum, t) => sum + t.amount, 0)

        const othersExpense = transactions
            .filter(t => t.type === 'expense' && !t.funding_source?.is_personal)
            .reduce((sum, t) => sum + t.amount, 0)

        const personalIncome = transactions
            .filter(t => t.type === 'income' && t.funding_source?.is_personal)
            .reduce((sum, t) => sum + t.amount, 0)

        const othersIncome = transactions
            .filter(t => t.type === 'income' && !t.funding_source?.is_personal)
            .reduce((sum, t) => sum + t.amount, 0)

        // Category breakdown
        const categoryMap = new Map<string, {
            icon: string;
            color: string;
            amount: number;
            type: 'income' | 'expense';
        }>()

        transactions.forEach(t => {
            if (t.category) {
                const existing = categoryMap.get(t.category.name)
                if (existing) {
                    existing.amount += t.amount
                } else {
                    categoryMap.set(t.category.name, {
                        icon: t.category.icon,
                        color: t.category.color,
                        amount: t.amount,
                        type: t.category.type
                    })
                }
            }
        })

        const categoryBreakdown = Array.from(categoryMap.entries())
            .map(([category, data]) => ({
                category,
                ...data,
                percentage: data.type === 'expense'
                    ? (totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0)
                    : (totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0)
            }))
            .sort((a, b) => b.amount - a.amount)

        // Funding source breakdown
        const fundingMap = new Map<string, {
            color: string;
            isPersonal: boolean;
            amount: number;
        }>()

        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                if (t.funding_source) {
                    const existing = fundingMap.get(t.funding_source.name)
                    if (existing) {
                        existing.amount += t.amount
                    } else {
                        fundingMap.set(t.funding_source.name, {
                            color: t.funding_source.color,
                            isPersonal: t.funding_source.is_personal,
                            amount: t.amount
                        })
                    }
                }
            })

        const fundingSourceBreakdown = Array.from(fundingMap.entries())
            .map(([name, data]) => ({
                name,
                ...data,
                percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount)

        // Monthly trend (last 6 months)
        const monthlyMap = new Map<string, { income: number; expense: number }>()
        const now = new Date()

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            monthlyMap.set(key, { income: 0, expense: 0 })
        }

        transactions.forEach(t => {
            const date = new Date(t.transaction_date)
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            const existing = monthlyMap.get(key)
            if (existing) {
                if (t.type === 'income') {
                    existing.income += t.amount
                } else {
                    existing.expense += t.amount
                }
            }
        })

        const monthlyTrend = Array.from(monthlyMap.entries())
            .map(([month, data]) => ({
                month: new Date(month + '-01').toLocaleDateString('zh-TW', { month: 'short' }),
                ...data
            }))

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            personalExpense,
            othersExpense,
            personalIncome,
            othersIncome,
            categoryBreakdown,
            monthlyTrend,
            fundingSourceBreakdown
        }
    }, [transactions])
}
