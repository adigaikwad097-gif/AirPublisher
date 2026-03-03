import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { ModalProvider } from '@/components/providers/modal-provider'
import App from './App'
import './index.css' // Global styles

// Router base path for deployment behind nginx at /publisher/
// VITE_BASE_PATH is set in .env.production ("/publisher/") but NOT in .env.local
// On localhost: undefined → "/" | On Hostinger: "/publisher/" → "/publisher"
const basePath = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/$/, '') || '/'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter basename={basePath} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <ModalProvider>
                    <App />
                </ModalProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>,
)
