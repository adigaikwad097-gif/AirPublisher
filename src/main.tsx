import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { ModalProvider } from '@/components/providers/modal-provider'
import App from './App'
import './index.css' // Global styles

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <ModalProvider>
                    <App />
                </ModalProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>,
)
