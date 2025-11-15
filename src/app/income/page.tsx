'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react'

interface WalletEarning {
  id: string
  amount: number
  createdAt: string
  wallet: {
    id: string
    address: string | null
    network: string
    type: string
  }
  withdrawalRequest?: {
    id: string
    amount: number
    profit: number | null
    status: string
    createdAt: string
  }
}

interface EarningsByWallet {
  wallet: {
    id: string
    address: string | null
    network: string
    type: string
  }
  totalEarnings: number
  earnings: WalletEarning[]
}

interface IncomeData {
  totalEarnings: number
  totalWalletEarnings: number
  earningsByWallet: EarningsByWallet[]
  walletEarnings: WalletEarning[]
}

const networkColors: Record<string, string> = {
  TRC20: 'bg-blue-100 text-blue-800',
  BEP20: 'bg-yellow-100 text-yellow-800',
  ERC20: 'bg-green-100 text-green-800',
  POLYGON: 'bg-purple-100 text-purple-800'
}

export default function IncomePage() {
  const [incomeData, setIncomeData] = useState<IncomeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIncomeData = async () => {
      try {
        const response = await fetch('/api/user/income')
        if (response.ok) {
          const data = await response.json()
          setIncomeData(data)
        }
      } catch (error) {
        console.error('Ошибка загрузки данных о доходности:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchIncomeData()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl gradient-text">Загрузка данных о доходности...</div>
        </div>
      </Layout>
    )
  }

  if (!incomeData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl text-red-500">Ошибка загрузки данных</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Доходность</h1>
          <p className="text-sm sm:text-base text-gray-600">Статистика ваших заработков по кошелькам вывода</p>
        </div>

        {/* Общая статистика */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(incomeData.totalEarnings)}
              </div>
              <p className="text-xs text-muted-foreground">
                Всего заработано
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">От кошельков</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {formatCurrency(incomeData.totalWalletEarnings)}
              </div>
              <p className="text-xs text-muted-foreground">
                Заработок с кошельков
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Доходность по кошелькам */}
        {incomeData.earningsByWallet.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Доходность по кошелькам вывода</CardTitle>
              <CardDescription>
                Детальная статистика заработка по каждому кошельку
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {incomeData.earningsByWallet.map((walletData) => (
                  <div key={walletData.wallet.id} className="p-4 border rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Wallet className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {walletData.wallet.address}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Badge className={networkColors[walletData.wallet.network]}>
                                {walletData.wallet.network}
                              </Badge>
                              <Badge variant="outline" className="text-purple-600 border-purple-600">
                                Для вывода
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(walletData.totalEarnings)}
                        </div>
                        <p className="text-sm text-gray-600">
                          Всего заработано
                        </p>
                      </div>
                    </div>

                    {/* Детали заработков */}
                    <div className="mt-4 space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">История заработков:</h4>
                      {walletData.earnings.map((earning) => (
                        <div key={earning.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(earning.amount)}
                              </p>
                              <p className="text-xs text-gray-600">
                                {new Date(earning.createdAt).toLocaleDateString('ru-RU', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          
                          {earning.withdrawalRequest && (
                            <div className="text-right">
                              <Badge className={
                                earning.withdrawalRequest.status === 'COMPLETED' 
                                  ? 'bg-green-100 text-green-800'
                                  : earning.withdrawalRequest.status === 'IN_WORK'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }>
                                {earning.withdrawalRequest.status === 'COMPLETED' ? 'Завершен' :
                                 earning.withdrawalRequest.status === 'IN_WORK' ? 'В работе' : 'Ожидает'}
                              </Badge>
                              <p className="text-xs text-gray-600 mt-1">
                                Запрос: {formatCurrency(earning.withdrawalRequest.amount)}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


        {/* Пустое состояние */}
        {incomeData.totalEarnings === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Пока нет доходов</h3>
              <p className="text-gray-600 mb-4">
                Ваши заработки с кошельков вывода будут отображаться здесь
              </p>
              <div className="text-sm text-gray-500">
                <p>• Создайте кошелек для вывода</p>
                <p>• Начните работать с кошельками</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
