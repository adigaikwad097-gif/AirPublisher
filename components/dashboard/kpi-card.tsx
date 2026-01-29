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
    <Card className="bg-white/5 border-white/10 hover:border-white/20 transition-all">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-[#89CFF0]/20 rounded-md">
            <Icon className="h-4 w-4 text-[#89CFF0]" />
          </div>
        </div>
        <div className="text-3xl md:text-4xl font-bold mb-2 text-white">
          {formattedValue}
        </div>
        <CardTitle className="text-xs font-medium text-white/50 uppercase tracking-[0.4em]">
          {title}
        </CardTitle>
        {trend && (
          <p
            className={`text-xs font-semibold mt-3 ${
              trend.isPositive ? 'text-[#89CFF0]' : 'text-red-400'
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

