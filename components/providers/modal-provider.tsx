import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { Toast, ToastType } from '../ui/toast'
import { ConfirmModal } from '../ui/confirm-modal'

interface ConfirmOptions {
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'default'
}

interface ToastOptions {
    message: string
    type: ToastType
}

interface ModalContextType {
    showConfirm: (options: ConfirmOptions) => Promise<boolean>
    showToast: (options: ToastOptions) => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
    // Toast State
    const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([])

    // Confirm Modal State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean
        options: ConfirmOptions | null
        resolve: ((value: boolean) => void) | null
    }>({
        isOpen: false,
        options: null,
        resolve: null
    })

    const showToast = useCallback(({ message, type }: ToastOptions) => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts((prev) => [...prev, { id, message, type }])
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    const showConfirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setConfirmState({
                isOpen: true,
                options,
                resolve
            })
        })
    }, [])

    const handleConfirm = useCallback(() => {
        if (confirmState.resolve) {
            confirmState.resolve(true)
        }
        setConfirmState((prev) => ({ ...prev, isOpen: false }))
    }, [confirmState])

    const handleCancel = useCallback(() => {
        if (confirmState.resolve) {
            confirmState.resolve(false)
        }
        setConfirmState((prev) => ({ ...prev, isOpen: false }))
    }, [confirmState])

    return (
        <ModalContext.Provider value={{ showConfirm, showToast }}>
            {children}

            {/* Toast Container */}
            <div
                aria-live="assertive"
                className="pointer-events-none fixed inset-0 z-[9999992] flex flex-col items-end justify-end px-4 py-6 sm:p-6 gap-2"
            >
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={removeToast}
                    />
                ))}
            </div>

            {/* Confirm Modal */}
            {confirmState.options && (
                <ConfirmModal
                    isOpen={confirmState.isOpen}
                    title={confirmState.options.title}
                    message={confirmState.options.message}
                    confirmLabel={confirmState.options.confirmLabel}
                    cancelLabel={confirmState.options.cancelLabel}
                    variant={confirmState.options.variant}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </ModalContext.Provider>
    )
}

export function useModal() {
    const context = useContext(ModalContext)
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider')
    }
    return context
}
