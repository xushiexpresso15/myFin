import { useState } from 'react'
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Filler
} from 'chart.js'
import { Pie, Bar, Line } from 'react-chartjs-2'
import { useTransactions } from '../hooks/useData'
import { useAnalytics } from '../hooks/useAnalytics'

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Filler
)

type TimeRange = 'week' | 'month' | 'year'

export default function AnalyticsDashboard() {
    const [timeRange, setTimeRange] = useState<TimeRange>('month')
    const [showPersonalOnly, setShowPersonalOnly] = useState(false)

    const getDateRange = () => {
        const end = new Date()
        const start = new Date()

        switch (timeRange) {
            case 'week':
                start.setDate(end.getDate() - 7)
                break
            case 'month':
                start.setMonth(end.getMonth() - 1)
                break
            case 'year':
                start.setFullYear(end.getFullYear() - 1)
                break
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        }
    }

    const { transactions, loading } = useTransactions(getDateRange())

    const filteredTransactions = showPersonalOnly
        ? transactions.filter(t => t.funding_source?.is_personal)
        : transactions

    const analytics = useAnalytics(filteredTransactions)

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    if (loading) {
        return (
            <div className="page">
                <div className="loading-page">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        )
    }

    const expenseCategories = analytics.categoryBreakdown.filter(c => c.type === 'expense')
    const incomeCategories = analytics.categoryBreakdown.filter(c => c.type === 'income')

    // Chart configurations
    const expensePieData = {
        labels: expenseCategories.map(c => c.category),
        datasets: [{
            data: expenseCategories.map(c => c.amount),
            backgroundColor: expenseCategories.map(c => c.color),
            borderWidth: 0
        }]
    }

    const fundingPieData = {
        labels: analytics.fundingSourceBreakdown.map(f => f.name),
        datasets: [{
            data: analytics.fundingSourceBreakdown.map(f => f.amount),
            backgroundColor: analytics.fundingSourceBreakdown.map(f => f.color),
            borderWidth: 0
        }]
    }

    const trendData = {
        labels: analytics.monthlyTrend.map(m => m.month),
        datasets: [
            {
                label: '收入',
                data: analytics.monthlyTrend.map(m => m.income),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: '支出',
                data: analytics.monthlyTrend.map(m => m.expense),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        }
    }

    const lineChartOptions = {
        ...chartOptions,
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: 'rgba(255, 255, 255, 0.5)' }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: 'rgba(255, 255, 255, 0.5)' }
            }
        }
    }

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">財務分析</h1>
                    <p className="page-subtitle">深入了解您的收支狀況</p>
                </div>
            </div>

            {/* Time Range Selector */}
            <div className="tabs">
                <button
                    className={`tab ${timeRange === 'week' ? 'active' : ''}`}
                    onClick={() => setTimeRange('week')}
                >
                    本週
                </button>
                <button
                    className={`tab ${timeRange === 'month' ? 'active' : ''}`}
                    onClick={() => setTimeRange('month')}
                >
                    本月
                </button>
                <button
                    className={`tab ${timeRange === 'year' ? 'active' : ''}`}
                    onClick={() => setTimeRange('year')}
                >
                    本年
                </button>
            </div>

            {/* Personal Filter Toggle */}
            <div
                className="glass-card"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    marginBottom: '16px'
                }}
            >
                <div>
                    <div style={{ fontWeight: 500 }}>只看自己的支出</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        排除他人資金（如家人的卡）
                    </div>
                </div>
                <div
                    className={`toggle ${showPersonalOnly ? 'active' : ''}`}
                    onClick={() => setShowPersonalOnly(!showPersonalOnly)}
                />
            </div>

            {/* Summary Stats */}
            <div className="stats-row">
                <div className="glass-card stat-card">
                    <div className="stat-value income">+{formatAmount(analytics.totalIncome)}</div>
                    <div className="stat-label">總收入</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value expense">-{formatAmount(analytics.totalExpense)}</div>
                    <div className="stat-label">總支出</div>
                </div>
            </div>

            {/* Funding Source Breakdown - KEY FEATURE */}
            {!showPersonalOnly && analytics.totalExpense > 0 && (
                <div className="glass-card chart-container">
                    <h3 className="chart-title">💳 資金來源分析</h3>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <div style={{ width: '120px', height: '120px' }}>
                            <Pie data={fundingPieData} options={chartOptions} />
                        </div>
                        <div style={{ flex: 1 }}>
                            {analytics.fundingSourceBreakdown.map(f => (
                                <div
                                    key={f.name}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '12px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span
                                            style={{
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                background: f.color
                                            }}
                                        />
                                        <span style={{ fontSize: '0.875rem' }}>{f.name}</span>
                                        <span
                                            className={`funding-badge ${f.isPersonal ? 'personal' : 'others'}`}
                                        >
                                            {f.isPersonal ? '自己' : '他人'}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600 }}>{formatAmount(f.amount)}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {f.percentage.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Visual Comparison Bar */}
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem' }}>
                            <span className="funding-badge personal">自己的錢：{formatAmount(analytics.personalExpense)}</span>
                            <span className="funding-badge others">他人的錢：{formatAmount(analytics.othersExpense)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', height: '8px' }}>
                            <div
                                style={{
                                    flex: analytics.personalExpense || 1,
                                    background: 'var(--success)',
                                    borderRadius: '4px 0 0 4px'
                                }}
                            />
                            <div
                                style={{
                                    flex: analytics.othersExpense || 0.01,
                                    background: 'var(--warning)',
                                    borderRadius: '0 4px 4px 0'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Monthly Trend */}
            <div className="glass-card chart-container">
                <h3 className="chart-title">📈 收支趨勢</h3>
                <div className="chart-wrapper">
                    <Line data={trendData} options={lineChartOptions} />
                </div>
            </div>

            {/* Expense by Category */}
            {expenseCategories.length > 0 && (
                <div className="glass-card chart-container">
                    <h3 className="chart-title">💸 支出分類</h3>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <div style={{ width: '120px', height: '120px' }}>
                            <Pie data={expensePieData} options={chartOptions} />
                        </div>
                        <div style={{ flex: 1 }}>
                            {expenseCategories.slice(0, 5).map(c => (
                                <div
                                    key={c.category}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '8px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '1.25rem' }}>{c.icon}</span>
                                        <span style={{ fontSize: '0.875rem' }}>{c.category}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatAmount(c.amount)}</div>
                                        <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                                            {c.percentage.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Income by Category */}
            {incomeCategories.length > 0 && (
                <div className="glass-card chart-container">
                    <h3 className="chart-title">💰 收入分類</h3>
                    <div style={{ flex: 1 }}>
                        {incomeCategories.map(c => (
                            <div
                                key={c.category}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '12px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.25rem' }}>{c.icon}</span>
                                    <span>{c.category}</span>
                                </div>
                                <div style={{ fontWeight: 600, color: 'var(--success)' }}>
                                    +{formatAmount(c.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {transactions.length === 0 && (
                <div className="glass-card empty-state">
                    <div className="empty-state-icon">📊</div>
                    <h4 className="empty-state-title">尚無資料</h4>
                    <p className="empty-state-text">開始記帳後就能看到分析報表</p>
                </div>
            )}
        </div>
    )
}
