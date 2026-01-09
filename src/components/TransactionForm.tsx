import { useState } from 'react'
import { useCategories, useFundingSources, useTransactions } from '../hooks/useData'

interface TransactionFormProps {
    onClose: () => void
    onSuccess?: () => void
}

export default function TransactionForm({ onClose, onSuccess }: TransactionFormProps) {
    const { expenseCategories, incomeCategories } = useCategories()
    const { fundingSources } = useFundingSources()
    const { addTransaction } = useTransactions()

    const [type, setType] = useState<'expense' | 'income'>('expense')
    const [amount, setAmount] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [fundingSourceId, setFundingSourceId] = useState('')
    const [description, setDescription] = useState('')
    const [transactionDate, setTransactionDate] = useState(
        new Date().toISOString().split('T')[0]
    )
    const [loading, setLoading] = useState(false)

    const categories = type === 'expense' ? expenseCategories : incomeCategories

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!amount || !categoryId || !fundingSourceId) {
            return
        }

        setLoading(true)

        const result = await addTransaction({
            amount: parseFloat(amount),
            type,
            category_id: categoryId,
            funding_source_id: fundingSourceId,
            description: description || undefined,
            transaction_date: transactionDate
        })

        setLoading(false)

        if (result?.data) {
            onSuccess?.()
            onClose()
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="glass-card modal-content"
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="modal-title">新增記錄</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Type Toggle */}
                    <div className="tabs">
                        <button
                            type="button"
                            className={`tab ${type === 'expense' ? 'active' : ''}`}
                            onClick={() => { setType('expense'); setCategoryId('') }}
                        >
                            💸 支出
                        </button>
                        <button
                            type="button"
                            className={`tab ${type === 'income' ? 'active' : ''}`}
                            onClick={() => { setType('income'); setCategoryId('') }}
                        >
                            💰 收入
                        </button>
                    </div>

                    {/* Amount */}
                    <div className="form-group">
                        <label className="form-label">金額</label>
                        <input
                            type="number"
                            className="glass-input"
                            placeholder="輸入金額"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            required
                            min="0"
                            step="1"
                            style={{ fontSize: '1.5rem', textAlign: 'center', fontWeight: 600 }}
                        />
                    </div>

                    {/* Category */}
                    <div className="form-group">
                        <label className="form-label">分類</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className="category-item"
                                    onClick={() => setCategoryId(cat.id)}
                                    style={{
                                        background: categoryId === cat.id ? `${cat.color}30` : 'var(--glass-bg)',
                                        border: categoryId === cat.id ? `2px solid ${cat.color}` : '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '12px 8px'
                                    }}
                                >
                                    <div
                                        className="category-icon"
                                        style={{
                                            background: `${cat.color}20`,
                                            width: '36px',
                                            height: '36px',
                                            fontSize: '1.25rem'
                                        }}
                                    >
                                        {cat.icon}
                                    </div>
                                    <span className="category-name">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Funding Source */}
                    <div className="form-group">
                        <label className="form-label">資金來源</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {fundingSources.map(fs => (
                                <button
                                    key={fs.id}
                                    type="button"
                                    className="glass-button"
                                    onClick={() => setFundingSourceId(fs.id)}
                                    style={{
                                        flex: 1,
                                        background: fundingSourceId === fs.id ? `${fs.color}30` : undefined,
                                        borderColor: fundingSourceId === fs.id ? fs.color : undefined
                                    }}
                                >
                                    <span
                                        style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: fs.color
                                        }}
                                    />
                                    {fs.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date and Description */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">日期</label>
                            <input
                                type="date"
                                className="glass-input"
                                value={transactionDate}
                                onChange={e => setTransactionDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">備註（選填）</label>
                        <input
                            type="text"
                            className="glass-input"
                            placeholder="例如：午餐、加油"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="glass-button glass-button--primary glass-button--full glass-button--large"
                        disabled={loading || !amount || !categoryId || !fundingSourceId}
                        style={{ marginTop: '8px' }}
                    >
                        {loading ? '儲存中...' : '儲存記錄'}
                    </button>
                </form>
            </div>
        </div>
    )
}
