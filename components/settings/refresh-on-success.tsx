import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'

export function RefreshOnSuccess() {
    const [searchParams, setSearchParams] = useSearchParams()
    const success = searchParams.get('success')
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (success) {
            setVisible(true)
            const timer = setTimeout(() => {
                setVisible(false)
                const params = new URLSearchParams(searchParams)
                params.delete('success')
                setSearchParams(params, { replace: true })
            }, 3000)

            return () => clearTimeout(timer)
        }
    }, [success, searchParams, setSearchParams])

    if (visible) {
        return (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <p className="text-sm text-green-400 font-semibold">
                        Connection updated successfully!
                    </p>
                </div>
            </div>
        )
    }

    return null
}
