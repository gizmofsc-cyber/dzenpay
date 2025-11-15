'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  Download,
  PieChart,
  BarChart3,
  RefreshCw
} from 'lucide-react'

interface FinancialData {
  walletStats: {
    totalBalance: number
    totalWallets: number
    activeWallets: number
  }
  transactionStats: {
    last30Days: {
      incoming: { amount: number; count: number }
      outgoing: { amount: number; count: number }
      netAmount: number
    }
    networkBreakdown: Record<string, { totalAmount: number; transactionCount: number }>
    recentTransactions: Array<{
      id: string
      type: 'INCOMING' | 'OUTGOING'
      amount: number
      createdAt: string
      wallet: {
        network: string
      }
    }>
  }
}

// Моковые данные для демонстрации
const mockFinancialData = {
  totalIncome: 125000,
  totalExpenses: 15000,
  netProfit: 110000,
  monthlyGrowth: 12.5,
  weeklyIncome: 25000,
  dailyIncome: 4200,
  topNetworks: [
    { network: 'TRC20', amount: 45000, percentage: 36 },
    { network: 'BEP20', amount: 38000, percentage: 30.4 },
    { network: 'ERC20', amount: 28000, percentage: 22.4 },
    { network: 'POLYGON', amount: 14000, percentage: 11.2 }
  ],
  monthlyData: [
    { month: 'Янв', income: 18000, expenses: 2000 },
    { month: 'Фев', income: 22000, expenses: 1800 },
    { month: 'Мар', income: 25000, expenses: 2200 },
    { month: 'Апр', income: 28000, expenses: 2500 },
    { month: 'Май', income: 32000, expenses: 2800 },
    { month: 'Июн', income: 35000, expenses: 3000 }
  ],
  recentTransactions: [
    { id: '1', type: 'INCOMING', amount: 1500, createdAt: '2024-01-15T10:00:00Z', wallet: { network: 'TRC20' } },
    { id: '2', type: 'INCOMING', amount: 2300, createdAt: '2024-01-14T15:30:00Z', wallet: { network: 'BEP20' } },
    { id: '3', type: 'OUTGOING', amount: 50, createdAt: '2024-01-14T12:15:00Z', wallet: { network: 'ERC20' } },
    { id: '4', type: 'INCOMING', amount: 800, createdAt: '2024-01-13T09:45:00Z', wallet: { network: 'POLYGON' } },
    { id: '5', type: 'INCOMING', amount: 3200, createdAt: '2024-01-12T14:20:00Z', wallet: { network: 'TRC20' } }
  ]
}

export default function FinancesPage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [viewType, setViewType] = useState('chart')
  
  // Используем моковые данные для демонстрации
  const { totalIncome, totalExpenses, netProfit, weeklyIncome, dailyIncome } = mockFinancialData

  // Загрузка финансовых данных
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const response = await fetch('/api/user/stats')
        if (response.ok) {
          const data = await response.json()
          setFinancialData(data)
        }
      } catch (error) {
        console.error('Ошибка загрузки финансовых данных:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFinancialData()
  }, [])

  return (
    <Layout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Финансы</h1>
            <p className="text-gray-600">Анализ доходов и расходов</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Фильтры
            </Button>
          </div>
        </div>

        {/* Основные показатели */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="card-stat">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-5 w-5 bg-gray-700 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-24 bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-16 bg-gray-700 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-stat">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Общий доход</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-400 icon-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400 neon-text">
                  {formatCurrency(financialData?.transactionStats.last30Days.incoming.amount || 0)}
                </div>
                <p className="text-xs text-gray-400">
                  За последние 30 дней
                </p>
              </CardContent>
            </Card>

            <Card className="card-stat">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Расходы</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-400 icon-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400 neon-text">
                  {formatCurrency(financialData?.transactionStats.last30Days.outgoing.amount || 0)}
                </div>
                <p className="text-xs text-gray-400">
                  За последние 30 дней
                </p>
              </CardContent>
            </Card>

            <Card className="card-stat">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Чистая прибыль</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-400 icon-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400 neon-text">
                  {formatCurrency(financialData?.transactionStats.last30Days.netAmount || 0)}
                </div>
                <p className="text-xs text-gray-400">
                  За последние 30 дней
                </p>
              </CardContent>
            </Card>

            <Card className="card-stat">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Общий баланс</CardTitle>
                <Calendar className="h-4 w-4 text-blue-400 icon-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400 neon-text">
                  {formatCurrency(financialData?.walletStats.totalBalance || 0)}
                </div>
                <p className="text-xs text-gray-400">
                  На всех кошельках
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Фильтры периода */}
        <Card>
          <CardHeader>
            <CardTitle>Период анализа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              {[
                { value: 'week', label: 'Неделя' },
                { value: 'month', label: 'Месяц' },
                { value: 'quarter', label: 'Квартал' },
                { value: 'year', label: 'Год' }
              ].map((item) => (
                <Button
                  key={item.value}
                  variant={period === item.value ? 'default' : 'outline'}
                  onClick={() => setPeriod(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>



      </div>
    </Layout>
  )
}
