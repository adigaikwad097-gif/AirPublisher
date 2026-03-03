import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
//
// base path: VITE_BASE_PATH is '/publisher/' in production (.env.production)
// and unset on localhost (defaults to '/')
export default defineConfig({
    plugins: [react()],
    base: process.env.VITE_BASE_PATH || '/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
    server: {
        port: 8000,
    },
    preview: {
        port: 3003,
        host: '0.0.0.0',
        allowedHosts: ['aircreator.cloud'],
    },
})
