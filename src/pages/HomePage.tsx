import { useTransactions, useCategories, useFundingSources } from '../hooks/useData'
import { useAnalytics } from '../hooks/useAnalytics'

export default function HomePage() {
    const { transactions, loading } = useTransactions()
    const { expenseCategories } = useCategories()
    const { fundingSources } = useFundingSources()
    const analytics = useAnalytics(transactions)

    if (loading) {
        return (
            <div className="page">
                <div className="loading-page">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        )
    }

    const recentTransactions = transactions.slice(0, 10)
    const topCategories = expenseCategories.slice(0, 4)

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return '今天'
        } else if (date.toDateString() === yesterday.toDateString()) {
            return '昨天'
        } else {
            return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
        }
    }

    return (
        <div className="page">
            {/* Balance Card */}
            <div className="glass-card glass-card--no-hover balance-card">
                <p className="balance-label">本月結餘</p>
                <h2 className={`balance-amount ${analytics.balance >= 0 ? 'positive' : 'negative'}`}>
                    {formatAmount(analytics.balance)}
                </h2>
                <div className="stats-row" style={{ marginTop: '16px', marginBottom: 0 }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--success)' }}>
                            +{formatAmount(analytics.totalIncome)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>收入</div>
                    </div>
                    <div style={{ width: '1px', background: 'var(--glass-border)' }}></div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--danger)' }}>
                            -{formatAmount(analytics.totalExpense)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>支出</div>
                    </div>
                </div>
            </div>

            {/* Personal vs Others Expense */}
            {analytics.totalExpense > 0 && (
                <div className="glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span className="section-title" style={{ marginBottom: 0 }}>支出資金來源</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <div
                            style={{
                                flex: analytics.personalExpense,
                                height: '8px',
                                background: 'var(--success)',
                                borderRadius: '4px 0 0 4px'
                            }}
                        />
                        <div
                            style={{
                                flex: analytics.othersExpense,
                                height: '8px',
                                background: 'var(--warning)',
                                borderRadius: '0 4px 4px 0'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="funding-badge personal">自己的錢</span>
                            <span>{formatAmount(analytics.personalExpense)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="funding-badge others">他人的錢</span>
                            <span>{formatAmount(analytics.othersExpense)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Categories */}
            {topCategories.length > 0 && (
                <>
                    <h3 className="section-title">快速分類</h3>
                    <div className="category-grid">
                        {topCategories.map(cat => (
                            <div key={cat.id} className="category-item">
                                <div
                                    className="category-icon"
                                    style={{ background: `${cat.color}20` }}
                                >
                                    {cat.icon}
                                </div>
                                <span className="category-name">{cat.name}</span>
                            </div>
                        ))}
                        {topCategories.length < 4 && fundingSources.length > 0 && (
                            <div className="category-item" style={{ opacity: 0.5 }}>
                                <div className="category-icon" style={{ background: 'var(--glass-bg)' }}>
                                    ＋
                                </div>
                                <span className="category-name">更多</span>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Recent Transactions */}
            <h3 className="section-title">最近交易</h3>
            {recentTransactions.length === 0 ? (
                <div className="glass-card empty-state">
                    <div className="empty-state-icon">📝</div>
                    <h4 className="empty-state-title">還沒有任何記錄</h4>
                    <p className="empty-state-text">點擊下方的 + 按鈕開始記帳</p>
                </div>
            ) : (
                <div className="transaction-list">
                    {recentTransactions.map(t => (
                        <div key={t.id} className="glass-card transaction-item">
                            <div
                                className="transaction-icon"
                                style={{ background: `${t.category?.color || '#666'}20` }}
                            >
                                {t.category?.icon || '💵'}
                            </div>
                            <div className="transaction-info">
                                <div className="transaction-title">
                                    {t.description || t.category?.name || '未分類'}
                                </div>
                                <div className="transaction-meta">
                                    <span>{formatDate(t.transaction_date)}</span>
                                    {t.funding_source && (
                                        <span
                                            className={`funding-badge ${t.funding_source.is_personal ? 'personal' : 'others'}`}
                                        >
                                            {t.funding_source.is_personal ? '自己' : '他人'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={`transaction-amount ${t.type}`}>
                                {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
