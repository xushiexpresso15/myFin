import { useState } from 'react'
import { useCategories, useFundingSources } from '../hooks/useData'
import { Category, FundingSource } from '../lib/supabaseClient'

type EditingItem = {
    type: 'category' | 'fundingSource'
    item: Category | FundingSource | null
}

const EMOJI_OPTIONS = ['🍔', '🚗', '🛍️', '🎮', '📄', '💊', '📚', '💸', '💰', '🎁', '📈', '💵', '🏠', '✈️', '📱', '🎬']
const COLOR_OPTIONS = ['#ef4444', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#6366f1', '#64748b', '#10b981', '#22c55e', '#059669', '#15803d']

export default function CategoryManager() {
    const { categories, addCategory, updateCategory, deleteCategory } = useCategories()
    const { fundingSources, addFundingSource, updateFundingSource, deleteFundingSource } = useFundingSources()

    const [activeTab, setActiveTab] = useState<'categories' | 'funding'>('categories')
    const [editing, setEditing] = useState<EditingItem | null>(null)
    const [showForm, setShowForm] = useState(false)

    // Form states
    const [name, setName] = useState('')
    const [type, setType] = useState<'expense' | 'income'>('expense')
    const [icon, setIcon] = useState('💸')
    const [color, setColor] = useState('#8b5cf6')
    const [isPersonal, setIsPersonal] = useState(true)
    const [isActive, setIsActive] = useState(true)

    const resetForm = () => {
        setName('')
        setType('expense')
        setIcon('💸')
        setColor('#8b5cf6')
        setIsPersonal(true)
        setIsActive(true)
        setEditing(null)
        setShowForm(false)
    }

    const openEditCategory = (cat: Category) => {
        setEditing({ type: 'category', item: cat })
        setName(cat.name)
        setType(cat.type)
        setIcon(cat.icon)
        setColor(cat.color)
        setIsActive(cat.is_active)
        setShowForm(true)
    }

    const openEditFundingSource = (fs: FundingSource) => {
        setEditing({ type: 'fundingSource', item: fs })
        setName(fs.name)
        setColor(fs.color)
        setIsPersonal(fs.is_personal)
        setShowForm(true)
    }

    const openNewCategory = () => {
        resetForm()
        setEditing({ type: 'category', item: null })
        setShowForm(true)
    }

    const openNewFundingSource = () => {
        resetForm()
        setEditing({ type: 'fundingSource', item: null })
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) return

        if (editing?.type === 'category') {
            if (editing.item) {
                await updateCategory(editing.item.id, { name, type, icon, color, is_active: isActive })
            } else {
                await addCategory({ name, type, icon, color, is_active: true })
            }
        } else if (editing?.type === 'fundingSource') {
            if (editing.item) {
                await updateFundingSource(editing.item.id, { name, color, is_personal: isPersonal })
            } else {
                await addFundingSource({ name, color, is_personal: isPersonal })
            }
        }

        resetForm()
    }

    const handleDelete = async () => {
        if (!editing?.item) return

        if (editing.type === 'category') {
            await deleteCategory(editing.item.id)
        } else {
            await deleteFundingSource(editing.item.id)
        }

        resetForm()
    }

    const expenseCategories = categories.filter(c => c.type === 'expense')
    const incomeCategories = categories.filter(c => c.type === 'income')

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">設定</h1>
                    <p className="page-subtitle">管理分類和資金來源</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}
                >
                    📂 分類
                </button>
                <button
                    className={`tab ${activeTab === 'funding' ? 'active' : ''}`}
                    onClick={() => setActiveTab('funding')}
                >
                    💳 資金來源
                </button>
            </div>

            {activeTab === 'categories' && (
                <>
                    {/* Expense Categories */}
                    <h3 className="section-title">支出分類</h3>
                    <div className="transaction-list" style={{ marginBottom: '24px' }}>
                        {expenseCategories.map(cat => (
                            <div
                                key={cat.id}
                                className="glass-card transaction-item"
                                onClick={() => openEditCategory(cat)}
                                style={{ cursor: 'pointer', opacity: cat.is_active ? 1 : 0.5 }}
                            >
                                <div
                                    className="transaction-icon"
                                    style={{ background: `${cat.color}20` }}
                                >
                                    {cat.icon}
                                </div>
                                <div className="transaction-info">
                                    <div className="transaction-title">{cat.name}</div>
                                    <div className="transaction-meta">
                                        {cat.is_active ? '啟用中' : '已停用'}
                                    </div>
                                </div>
                                <div style={{ color: 'var(--text-muted)' }}>›</div>
                            </div>
                        ))}
                    </div>

                    {/* Income Categories */}
                    <h3 className="section-title">收入分類</h3>
                    <div className="transaction-list" style={{ marginBottom: '24px' }}>
                        {incomeCategories.map(cat => (
                            <div
                                key={cat.id}
                                className="glass-card transaction-item"
                                onClick={() => openEditCategory(cat)}
                                style={{ cursor: 'pointer', opacity: cat.is_active ? 1 : 0.5 }}
                            >
                                <div
                                    className="transaction-icon"
                                    style={{ background: `${cat.color}20` }}
                                >
                                    {cat.icon}
                                </div>
                                <div className="transaction-info">
                                    <div className="transaction-title">{cat.name}</div>
                                    <div className="transaction-meta">
                                        {cat.is_active ? '啟用中' : '已停用'}
                                    </div>
                                </div>
                                <div style={{ color: 'var(--text-muted)' }}>›</div>
                            </div>
                        ))}
                    </div>

                    <button
                        className="glass-button glass-button--primary glass-button--full"
                        onClick={openNewCategory}
                    >
                        ＋ 新增分類
                    </button>
                </>
            )}

            {activeTab === 'funding' && (
                <>
                    <div className="glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            💡 資金來源用於區分「自己的錢」和「他人的錢」（如：媽媽的卡），讓財務分析更精確。
                        </p>
                    </div>

                    <div className="transaction-list" style={{ marginBottom: '24px' }}>
                        {fundingSources.map(fs => (
                            <div
                                key={fs.id}
                                className="glass-card transaction-item"
                                onClick={() => openEditFundingSource(fs)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div
                                    className="transaction-icon"
                                    style={{ background: `${fs.color}20` }}
                                >
                                    <span
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: fs.color
                                        }}
                                    />
                                </div>
                                <div className="transaction-info">
                                    <div className="transaction-title">{fs.name}</div>
                                    <div className="transaction-meta">
                                        <span className={`funding-badge ${fs.is_personal ? 'personal' : 'others'}`}>
                                            {fs.is_personal ? '自己的錢' : '他人的錢'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ color: 'var(--text-muted)' }}>›</div>
                            </div>
                        ))}
                    </div>

                    <button
                        className="glass-button glass-button--primary glass-button--full"
                        onClick={openNewFundingSource}
                    >
                        ＋ 新增資金來源
                    </button>
                </>
            )}

            {/* Edit/Add Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div
                        className="glass-card modal-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editing?.item
                                    ? `編輯${editing.type === 'category' ? '分類' : '資金來源'}`
                                    : `新增${editing?.type === 'category' ? '分類' : '資金來源'}`
                                }
                            </h2>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">名稱</label>
                                <input
                                    type="text"
                                    className="glass-input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="輸入名稱"
                                    required
                                />
                            </div>

                            {editing?.type === 'category' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">類型</label>
                                        <div className="tabs">
                                            <button
                                                type="button"
                                                className={`tab ${type === 'expense' ? 'active' : ''}`}
                                                onClick={() => setType('expense')}
                                            >
                                                支出
                                            </button>
                                            <button
                                                type="button"
                                                className={`tab ${type === 'income' ? 'active' : ''}`}
                                                onClick={() => setType('income')}
                                            >
                                                收入
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">圖示</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {EMOJI_OPTIONS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => setIcon(emoji)}
                                                    style={{
                                                        width: '44px',
                                                        height: '44px',
                                                        fontSize: '1.5rem',
                                                        background: icon === emoji ? 'var(--glass-bg-hover)' : 'transparent',
                                                        border: icon === emoji ? '2px solid var(--primary-purple)' : '1px solid var(--glass-border)',
                                                        borderRadius: 'var(--radius-md)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {editing.item && (
                                        <div className="form-group">
                                            <label className="form-label">狀態</label>
                                            <div
                                                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                                                onClick={() => setIsActive(!isActive)}
                                            >
                                                <div className={`toggle ${isActive ? 'active' : ''}`} />
                                                <span>{isActive ? '啟用中' : '已停用'}</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {editing?.type === 'fundingSource' && (
                                <div className="form-group">
                                    <label className="form-label">資金類型</label>
                                    <div className="tabs">
                                        <button
                                            type="button"
                                            className={`tab ${isPersonal ? 'active' : ''}`}
                                            onClick={() => setIsPersonal(true)}
                                        >
                                            🙋 自己的錢
                                        </button>
                                        <button
                                            type="button"
                                            className={`tab ${!isPersonal ? 'active' : ''}`}
                                            onClick={() => setIsPersonal(false)}
                                        >
                                            👨‍👩‍👧 他人的錢
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">顏色</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {COLOR_OPTIONS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                background: c,
                                                border: color === c ? '3px solid white' : 'none',
                                                borderRadius: '50%',
                                                cursor: 'pointer',
                                                boxShadow: color === c ? '0 0 0 2px var(--primary-purple)' : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                {editing?.item && (
                                    <button
                                        type="button"
                                        className="glass-button glass-button--danger"
                                        onClick={handleDelete}
                                        style={{ flex: 1 }}
                                    >
                                        刪除
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="glass-button glass-button--primary"
                                    style={{ flex: 2 }}
                                >
                                    儲存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
