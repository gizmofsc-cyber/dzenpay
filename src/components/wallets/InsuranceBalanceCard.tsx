'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Shield } from 'lucide-react'

interface InsuranceBalanceCardProps {
  amount: number
  paid: number
}

export function InsuranceBalanceCard({ amount, paid }: InsuranceBalanceCardProps) {
  const shortage = amount - paid
  const isConfigured = amount > 0
  const statusText = !isConfigured
    ? 'Не установлен'
    : shortage <= 0
    ? 'Полностью оплачен'
    : `Не хватает: ${formatCurrency(shortage)}`

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Страховой баланс</CardTitle>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(Math.max(paid, 0))}</div>
        <p className="text-xs text-muted-foreground">{statusText}</p>
      </CardContent>
    </Card>
  )
}


