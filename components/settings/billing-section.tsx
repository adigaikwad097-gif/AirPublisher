import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Sparkles, Receipt } from 'lucide-react'

export function BillingSection() {
    return (
        <div className="space-y-6">
            {/* Current Plan */}
            <Card className="bg-card border-border/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-white">Current Plan</CardTitle>
                            <CardDescription className="text-white/60">
                                Manage your subscription and billing
                            </CardDescription>
                        </div>
                        <Badge variant="primary" className="text-sm px-3 py-1">
                            Basic Plan
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Credits Usage */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-white/60">Monthly Credits</span>
                            <span className="text-white font-medium">25 / 25 remaining</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <p className="text-xs text-white/60">
                            Credits reset on the 1st of each month
                        </p>
                    </div>

                    {/* Plan Features */}
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-2">
                        <p className="text-sm font-medium text-white">What's included:</p>
                        <ul className="text-sm text-white/60 space-y-1.5">
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-primary rounded-full" />
                                25 video posts per month
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-primary rounded-full" />
                                Post to YouTube, Instagram & Facebook
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-primary rounded-full" />
                                Schedule posts in advance
                            </li>
                        </ul>
                    </div>

                    {/* Upgrade CTA */}
                    <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-3 mb-3">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <div>
                                <p className="text-sm font-semibold text-white">Upgrade to Pro</p>
                                <p className="text-xs text-white/60">Unlock unlimited posts and premium features</p>
                            </div>
                        </div>
                        <Button
                            disabled
                            className="w-full"
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Coming Soon
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="bg-card border-border/20">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-white/60" />
                        Payment History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <Receipt className="w-6 h-6 text-white/30" />
                        </div>
                        <p className="text-sm text-white/60">No payment history yet</p>
                        <p className="text-xs text-white/30 mt-1">
                            Your invoices and receipts will appear here
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
