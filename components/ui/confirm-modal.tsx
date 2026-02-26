import { useState, useCallback, ReactNode, useEffect } from 'react'

export interface ConfirmModalProps {
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'default'
    onConfirm: () => void
    onCancel: () => void
    isOpen: boolean
}

export function ConfirmModal({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel,
    isOpen
}: ConfirmModalProps) {
    const [isAnimatingIn, setIsAnimatingIn] = useState(false)

    useEffect(() => {
        if (isOpen) {
            // Small delay to allow CSS transitions to trigger
            requestAnimationFrame(() => setIsAnimatingIn(true))
        } else {
            setIsAnimatingIn(false)
        }
    }, [isOpen])

    if (!isOpen && !isAnimatingIn) return null

    return (
        <>
            <div
                className={`fixed inset-0 z-[9999990] bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onCancel}
            />

            <div className="fixed inset-0 z-[9999991] flex items-center justify-center p-4 pointer-events-none">
                <div
                    className={`
            w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A1A] text-left align-middle shadow-2xl
            transition-all duration-200
            ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
            pointer-events-auto
          `}
                >
                    <div className="p-6">
                        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                        <p className="text-sm text-[#A1A1AA]">{message}</p>
                    </div>

                    <div className="bg-[#121212] px-6 py-4 flex items-center justify-end gap-3 border-t border-white/5">
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                            onClick={onCancel}
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            className={`
                inline-flex justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20
                ${variant === 'danger'
                                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                                    : 'bg-white text-black hover:bg-gray-200'}
              `}
                            onClick={onConfirm}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
