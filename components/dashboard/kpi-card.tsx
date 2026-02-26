import { Card, CardContent } from '@/components/ui/card'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
}

export function KPICard({ title, value, subtitle, icon }: KPICardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-2">
          {icon}
          <div className="text-xs text-foreground/50 uppercase tracking-wider font-medium">{title}</div>
        </div>
        <div className="text-2xl font-semibold tracking-tight text-white">{value}</div>
        {subtitle && <p className="text-xs text-[#89CFF0] mt-1 font-medium">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
