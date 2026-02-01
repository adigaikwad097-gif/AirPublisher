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
          <div className="text-sm text-foreground/70">{title}</div>
        </div>
        <div className="text-2xl font-bold text-white">{value}</div>
        {subtitle && <p className="text-xs text-[#89CFF0] mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
