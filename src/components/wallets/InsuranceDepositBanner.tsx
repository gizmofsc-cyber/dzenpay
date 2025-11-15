'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, Shield } from 'lucide-react'

interface InsuranceDepositBannerProps {
  amount: number
  paid: number
  acknowledged: boolean
  onAcknowledge: () => void
}

export function InsuranceDepositBanner({
  amount,
  paid,
  acknowledged,
  onAcknowledge
}: InsuranceDepositBannerProps) {
  const isFullyPaid = amount > 0 && paid >= amount

  if (!isFullyPaid || acknowledged) {
    return null
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600" />
          <CardTitle className="text-green-800">Страховой депозит</CardTitle>
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <CardDescription className="text-green-700">
          Страховой депозит полностью оплачен. Вы можете работать с кошельками.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Требуемая сумма</Label>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(amount)}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Оплачено</Label>
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(paid)}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Статус</Label>
            <div className="text-lg font-semibold text-green-600">
              {`${formatCurrency(paid)} / ${formatCurrency(amount)}`}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-green-100 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Важно:</strong> Страховой депозит можно будет вывести только спустя 15 дней после завершения работы.
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={onAcknowledge}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Ознакомлен
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


