import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  format?: 'number' | 'currency' | 'default'
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  format = 'default',
}: KPICardProps) {
  const formattedValue =
    format === 'number'
      ? formatNumber(typeof value === 'number' ? value : 0)
      : format === 'currency'
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(typeof value === 'number' ? value : 0)
      : value

  return (
    <Card className="hover:border-primary/50 hover:bg-card-hover transition-all bg-card-elevated">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-primary/20 rounded-xl">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="text-4xl md:text-5xl font-extrabold mb-3 text-foreground">
          {formattedValue}
        </div>
        <CardTitle className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
          {title}
        </CardTitle>
        {trend && (
          <p
            className={`text-xs font-semibold mt-3 ${
              trend.isPositive ? 'text-success' : 'text-error'
            }`}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  )
}

