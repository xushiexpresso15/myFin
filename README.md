# myFin - 個人記帳 App

一個具有 Liquid Glass UI 風格的個人記帳 PWA 應用程式。

## 功能特色

- 🔐 **Google 帳號登入** - 使用 Supabase Auth 整合 Google OAuth
- 💰 **收入/支出記錄** - 輕鬆記錄每筆交易
- 📂 **自訂分類** - 可自訂收入和支出分類
- 💳 **資金來源區分** - 區分「自己的錢」和「他人的錢」（如：媽媽的卡）
- 📊 **完整財務分析** - 圖表化顯示收支狀況
- 🎨 **Liquid Glass UI** - 現代毛玻璃風格設計

## 技術棧

- **前端**: React + TypeScript + Vite
- **UI**: 自訂 Liquid Glass CSS 設計系統
- **後端**: Supabase (PostgreSQL + Auth)
- **圖表**: Chart.js
- **部署**: GitHub Pages

## 本地開發

### 1. 安裝依賴
```bash
npm install
```

### 2. 設定環境變數
```bash
cp .env.example .env
# 編輯 .env，填入 Supabase 憑證
```

### 3. 啟動開發伺服器
```bash
npm run dev
```

## GitHub Pages 部署

### 1. 建立 GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用戶名/myFin.git
git push -u origin main
```

### 2. 設定 GitHub Secrets
到 Repository → Settings → Secrets and variables → Actions，新增：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. 啟用 GitHub Pages
到 Repository → Settings → Pages：
- Source: 選擇 **GitHub Actions**

### 4. 更新 Google OAuth Redirect URI
到 Google Cloud Console，新增 Redirect URI：
```
https://你的用戶名.github.io/myFin/
```

到 Supabase Dashboard → Authentication → URL Configuration：
- 新增 Site URL: `https://你的用戶名.github.io/myFin/`
- 新增 Redirect URLs: `https://你的用戶名.github.io/myFin/`

### 5. 推送程式碼觸發部署
每次 push 到 main 分支會自動部署。

## 專案結構

```
myFin/
├── .github/workflows/    # GitHub Actions
├── src/
│   ├── components/       # 可重用元件
│   ├── contexts/         # React Context
│   ├── hooks/            # 自訂 Hooks
│   ├── lib/              # 工具函式庫
│   ├── pages/            # 頁面元件
│   └── styles/           # 樣式檔案
├── supabase/             # 資料庫結構
└── package.json
```

## 資金來源說明

此 App 的特色功能是區分不同的資金來源：

- **自己的錢** 💚：個人收入、儲蓄
- **他人的錢** 🟡：刷家人的卡、父母贊助等

在財務分析中會分開顯示，讓您清楚知道實際的個人支出狀況。

## License

MIT
