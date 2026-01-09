import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // GitHub Pages 部署設定
    // 請將 'myFin' 替換為你的 GitHub repository 名稱
    base: '/myFin/',
    server: {
        port: 3000,
        host: true
    },
    build: {
        outDir: 'dist',
        sourcemap: false
    }
})
