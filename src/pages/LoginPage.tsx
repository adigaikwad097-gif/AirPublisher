import { ManualEntryForm } from '@/components/auth/manual-entry-form'

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Air Publisher
                    </h1>
                    <p className="text-white/60">
                        Enter your unique identifier to access the dashboard.
                    </p>
                </div>

                <ManualEntryForm />

                <div className="pt-8">
                    <div className="inline-block px-3 py-1 bg-white/5 rounded border border-white/10 text-[10px] text-white/30 font-mono uppercase tracking-widest">
                        Waiting for input...
                    </div>
                </div>
            </div>
        </div>
    )
}
