import { ReactNode, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, Minus } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface StatWidgetProps {
  title: string
  value: string | number
  icon: ReactNode
  iconColor?: string
  subtitle?: string
  trend?: {
    value: number
    label: string
  }
  detailsContent?: ReactNode
  className?: string
  onClick?: () => void
}

export function StatWidget({
  title,
  value,
  icon,
  iconColor = 'text-primary',
  subtitle,
  trend,
  detailsContent,
  className = '',
  onClick
}: StatWidgetProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (detailsContent) {
      setDetailsOpen(true)
    }
  }

  const isClickable = onClick || detailsContent

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) return <ArrowUp size={16} weight="bold" />
    if (trend.value < 0) return <ArrowDown size={16} weight="bold" />
    return <Minus size={16} weight="bold" />
  }

  const getTrendColor = () => {
    if (!trend) return ''
    if (trend.value > 0) return 'text-green-600 bg-green-50'
    if (trend.value < 0) return 'text-red-600 bg-red-50'
    return 'text-muted-foreground bg-muted'
  }

  return (
    <>
      <motion.div
        whileHover={isClickable ? { scale: 1.02, y: -4 } : {}}
        whileTap={isClickable ? { scale: 0.98 } : {}}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Card
          className={`${className} ${
            isClickable ? 'cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all duration-300' : ''
          } relative overflow-hidden group`}
          onClick={handleClick}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <div className={`${iconColor} p-2 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 group-hover:scale-110 transition-transform duration-300`}>
              {icon}
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold mb-1 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
              {value}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground/80 mb-2 font-medium">{subtitle}</p>
            )}
            {trend && (
              <Badge
                variant="secondary"
                className={`${getTrendColor()} text-xs gap-1 border-0 font-semibold`}
              >
                {getTrendIcon()}
                {Math.abs(trend.value)}% {trend.label}
              </Badge>
            )}
            {isClickable && detailsContent && (
              <p className="text-xs text-primary/60 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Click pentru detalii →
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {detailsContent && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className={`${iconColor} p-2 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30`}>
                  {icon}
                </div>
                {title}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">{detailsContent}</div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
