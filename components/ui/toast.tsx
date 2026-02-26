import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastProps {
    id: string
    message: string
    type: ToastType
    onClose: (id: string) => void
}

export function Toast({ id, message, type, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Slight delay to trigger slide-in animation
        requestAnimationFrame(() => setIsVisible(true))

        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(() => onClose(id), 300) // Wait for fade-out
        }, 3000)

        return () => clearTimeout(timer)
    }, [id, onClose])

    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
        error: <XCircle className="h-5 w-5 text-red-400 shrink-0" />,
        info: <Info className="h-5 w-5 text-blue-400 shrink-0" />
    }

    const bgColors = {
        success: 'bg-emerald-500/10 border-emerald-500/20',
        error: 'bg-red-500/10 border-red-500/20',
        info: 'bg-blue-500/10 border-blue-500/20'
    }

    return (
        <div
            className={`
        pointer-events-auto flex w-full max-w-sm items-start gap-4 rounded-xl border p-4 shadow-lg backdrop-blur-md
        transition-all duration-300 ease-in-out
        ${bgColors[type]}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
        >
            <div className="flex-1 flex gap-3 items-center">
                {icons[type]}
                <p className="text-sm font-medium text-white">{message}</p>
            </div>
            <button
                onClick={() => {
                    setIsVisible(false)
                    setTimeout(() => onClose(id), 300)
                }}
                className="text-white/50 hover:text-white transition-colors shrink-0"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}
