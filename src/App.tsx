import { useState } from 'react'
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import CategoryManager from './pages/CategoryManager'
import TransactionForm from './components/TransactionForm'

// Icons as SVG components
const HomeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
)

const ChartIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
)

const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
)

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
)

function AppContent() {
    const { user, loading, signOut, profile } = useAuth()
    const [showAddTransaction, setShowAddTransaction] = useState(false)
    const location = useLocation()

    if (loading) {
        return (
            <div className="loading-page">
                <div className="app-background"></div>
                <div className="loading-spinner"></div>
            </div>
        )
    }

    if (!user) {
        return <LoginPage />
    }

    return (
        <>
            <div className="app-background"></div>
            <div className="app-container">
                {/* User info header when on home */}
                {location.pathname === '/' && profile && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        marginBottom: '8px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="avatar"
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        border: '2px solid var(--glass-border)'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'var(--primary-purple)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 600
                                }}>
                                    {profile.display_name?.[0] || '👤'}
                                </div>
                            )}
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    早安 👋
                                </div>
                                <div style={{ fontWeight: 600 }}>
                                    {profile.display_name || '使用者'}
                                </div>
                            </div>
                        </div>
                        <button
                            className="glass-button glass-button--small"
                            onClick={signOut}
                        >
                            登出
                        </button>
                    </div>
                )}

                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/analytics" element={<AnalyticsDashboard />} />
                    <Route path="/settings" element={<CategoryManager />} />
                </Routes>

                {/* Bottom Navigation */}
                <nav className="bottom-nav">
                    <div className="bottom-nav-inner">
                        <NavLink
                            to="/"
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <HomeIcon />
                            <span>首頁</span>
                        </NavLink>

                        <button
                            className="nav-add-button"
                            onClick={() => setShowAddTransaction(true)}
                        >
                            <PlusIcon />
                        </button>

                        <NavLink
                            to="/analytics"
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <ChartIcon />
                            <span>分析</span>
                        </NavLink>

                        <NavLink
                            to="/settings"
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <SettingsIcon />
                            <span>設定</span>
                        </NavLink>
                    </div>
                </nav>
            </div>

            {/* Add Transaction Modal */}
            {showAddTransaction && (
                <TransactionForm
                    onClose={() => setShowAddTransaction(false)}
                    onSuccess={() => {
                        // Force refresh by navigating
                        window.location.reload()
                    }}
                />
            )}
        </>
    )
}

export default function App() {
    return (
        <HashRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </HashRouter>
    )
}
