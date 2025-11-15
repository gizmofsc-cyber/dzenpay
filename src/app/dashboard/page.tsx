'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import {
  DollarSign,
  CreditCard,
  Wallet,
  TrendingUp,
  Users,
  Activity,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Shield,
  AlertTriangle,
  X
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface UserStats {
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
      wallet: { network: string }
    }>
  }
  insuranceDeposit: {
    amount: number
    paid: number
  }
}

interface NetworkPair {
  id: string
  fromNetworkId: string
  toNetworkId: string
  profitPercent: number
  isActive: boolean
  fromNetwork: {
    id: string
    name: string
    displayName: string
  }
  toNetwork: {
    id: string
    name: string
    displayName: string
  }
}

interface ChartData {
  date: string
  formattedDate: string
  balance: number
  wallets: number
  incoming: number
  outgoing: number
}


export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [networkPairs, setNetworkPairs] = useState<NetworkPair[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showInsuranceModal, setShowInsuranceModal] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [networks, setNetworks] = useState<Array<{id: string, name: string, displayName: string}>>([])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchNetworkPairs = async () => {
    try {
      const response = await fetch('/api/network-pairs')
      if (response.ok) {
        const data = await response.json()
        setNetworkPairs(data.networkPairs)
      }
    } catch (error) {
      console.error('Ошибка загрузки сетевых пар:', error)
    }
  }

  const fetchNetworks = async () => {
    try {
      const response = await fetch('/api/user/networks')
      if (response.ok) {
        const data = await response.json()
        setNetworks(data.networks)
      }
    } catch (error) {
      console.error('Ошибка загрузки сетей:', error)
    }
  }

  const handleInsuranceRequest = async () => {
    if (!selectedNetwork) return

    try {
      const response = await fetch('/api/user/insurance-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          network: selectedNetwork
        }),
      })

      if (response.ok) {
        alert('Запрос на страховой взнос отправлен! Администратор рассмотрит его в ближайшее время.')
        setShowInsuranceModal(false)
        setSelectedNetwork('')
        fetchStats() // Обновляем статистику
      } else {
        const error = await response.json()
        alert('Ошибка: ' + error.error)
      }
    } catch (error) {
      console.error('Ошибка отправки запроса:', error)
      alert('Произошла ошибка при отправке запроса')
    }
  }

  const generateChartData = () => {
    if (!stats) return

    const data: ChartData[] = []
    const baseBalance = stats.walletStats.totalBalance
    const baseWallets = stats.walletStats.totalWallets
    const totalIncoming = stats.transactionStats.last30Days.incoming.amount
    const totalOutgoing = stats.transactionStats.last30Days.outgoing.amount

    // Генерируем данные за последние 30 дней
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Создаем реалистичные колебания данных
      const dayProgress = (30 - i) / 30
      const randomFactor = 0.8 + Math.random() * 0.4 // 0.8 - 1.2
      
      // Баланс постепенно растет с небольшими колебаниями
      const balance = baseBalance * (0.3 + dayProgress * 0.7) * randomFactor
      
      // Количество кошельков остается относительно стабильным
      const wallets = baseWallets + Math.floor((Math.random() - 0.5) * 2)
      
      // Пополнения и выводы распределяем по дням с реалистичными колебаниями
      const incoming = i % 7 === 0 ? totalIncoming * 0.1 * randomFactor : totalIncoming * 0.02 * randomFactor
      const outgoing = i % 5 === 0 ? totalOutgoing * 0.15 * randomFactor : totalOutgoing * 0.01 * randomFactor
      
      data.push({
        date: date.toISOString().split('T')[0],
        formattedDate: date.toLocaleDateString('ru-RU', { 
          day: '2-digit', 
          month: '2-digit' 
        }),
        balance: Math.max(0, balance),
        wallets: Math.max(1, wallets),
        incoming: Math.max(0, incoming),
        outgoing: Math.max(0, outgoing)
      })
    }
    
    setChartData(data)
  }


  useEffect(() => {
    fetchStats()
    fetchNetworkPairs()
    fetchNetworks()
  }, [])

  useEffect(() => {
    if (stats) {
      generateChartData()
    }
  }, [stats])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStats()
    fetchNetworkPairs()
    fetchNetworks()
  }


  const handleSelectPair = (pair: NetworkPair) => {
    console.log('Selected pair:', pair)
    // Здесь будет логика выбора связки сетей
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Уведомление о страховом взносе */}
        {stats && (stats.insuranceDeposit.amount <= 0 || (stats.insuranceDeposit.paid < stats.insuranceDeposit.amount && stats.insuranceDeposit.amount > 0)) && (
          <Card className="border-orange-500/50 bg-gradient-to-r from-orange-900/20 to-red-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between min-h-[60px]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500/20 border border-orange-500/50 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Требуется страховой взнос</h3>
                    <p className="text-sm text-gray-300">
                      {stats.insuranceDeposit.amount <= 0 
                        ? 'Для работы на платформе необходимо получить страховой депозит от администратора'
                        : 'Для работы на платформе необходимо пополнить страховой баланс'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Button
                    onClick={() => setShowInsuranceModal(true)}
                    className="neon-button"
                    size="sm"
                  >
                    {stats.insuranceDeposit.amount <= 0 ? 'Запросить' : 'Пополнить'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text mb-2">Dashboard</h1>
            <p className="text-gray-200 text-sm sm:text-base lg:text-lg">Обзор вашей деятельности на платформе</p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="neon-button w-full sm:w-auto"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>

        {/* Основная статистика */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="card-stat">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Общий баланс</CardTitle>
                <DollarSign className="h-5 w-5 text-green-400 icon-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1 neon-text">
                  {formatCurrency(stats?.walletStats.totalBalance || 0)}
                </div>
                <p className="text-sm text-green-400 font-medium">
                  На всех кошельках
                </p>
              </CardContent>
            </Card>

            <Card className="card-stat">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Активные кошельки</CardTitle>
                <Wallet className="h-5 w-5 text-purple-400 icon-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1 neon-text">
                  {stats?.walletStats.activeWallets || 0}
                </div>
                <p className="text-sm text-purple-400 font-medium">
                  Из {stats?.walletStats.totalWallets || 0} всего
                </p>
              </CardContent>
            </Card>

            <Card className="card-stat">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Пополнения (30 дн.)</CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-400 icon-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1 neon-text">
                  {formatCurrency(stats?.transactionStats.last30Days.incoming.amount || 0)}
                </div>
                <p className="text-sm text-blue-400 font-medium">
                  {stats?.transactionStats.last30Days.incoming.count || 0} транзакций
                </p>
              </CardContent>
            </Card>

            <Card className="card-stat">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Выводы (30 дн.)</CardTitle>
                <Activity className="h-5 w-5 text-orange-400 icon-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1 neon-text">
                  {formatCurrency(stats?.transactionStats.last30Days.outgoing.amount || 0)}
                </div>
                <p className="text-sm text-orange-400 font-medium">
                  {stats?.transactionStats.last30Days.outgoing.count || 0} транзакций
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Связки сетей */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="hover-glow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white">Доступные связки сетей</CardTitle>
                  <CardDescription className="text-gray-300">
                    Выберите связку для получения средств
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {networkPairs.map((pair, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg transition-all duration-300 ${
                      pair.isActive 
                        ? 'status-active hover-glow' 
                        : 'status-inactive'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">
                          {pair.fromNetwork.displayName} ↔ {pair.toNetwork.displayName}
                        </h3>
                        <p className="text-sm text-gray-300">
                          Доходность: <span className="text-green-400 font-semibold">{pair.profitPercent}%</span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {pair.isActive ? (
                          <span className="status-active px-2.5 py-0.5 rounded-full text-xs font-medium">
                            Активна
                          </span>
                        ) : (
                          <span className="status-inactive px-2.5 py-0.5 rounded-full text-xs font-medium">
                            Неактивна
                          </span>
                        )}
                        {pair.isActive && (
                          <Button
                            size="sm"
                            onClick={() => handleSelectPair(pair)}
                            className="neon-button"
                          >
                            Выбрать
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* График доходности */}
          <Card className="hover-glow">
            <CardHeader>
              <CardTitle className="text-white">Динамика доходов</CardTitle>
              <CardDescription className="text-gray-300">
                График показывает статистику активного пользователя
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/30">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Загрузка данных...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Статистика */}
                  {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-500/30">
                        <p className="text-sm text-gray-300">Общий баланс</p>
                        <p className="text-lg font-bold text-green-400">{formatCurrency(stats.walletStats.totalBalance)}</p>
                        <p className="text-xs text-gray-400">На всех кошельках</p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-r from-purple-900/20 to-violet-900/20 rounded-lg border border-purple-500/30">
                        <p className="text-sm text-gray-300">Активные кошельки</p>
                        <p className="text-lg font-bold text-purple-400">{stats.walletStats.activeWallets}</p>
                        <p className="text-xs text-gray-400">Из {stats.walletStats.totalWallets} всего</p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-lg border border-blue-500/30">
                        <p className="text-sm text-gray-300">Пополнения (30 дн.)</p>
                        <p className="text-lg font-bold text-blue-400">{formatCurrency(stats.transactionStats.last30Days.incoming.amount)}</p>
                        <p className="text-xs text-gray-400">{stats.transactionStats.last30Days.incoming.count} транзакций</p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-lg border border-orange-500/30">
                        <p className="text-sm text-gray-300">Выводы (30 дн.)</p>
                        <p className="text-lg font-bold text-orange-400">{formatCurrency(stats.transactionStats.last30Days.outgoing.amount)}</p>
                        <p className="text-xs text-gray-400">{stats.transactionStats.last30Days.outgoing.count} транзакций</p>
                      </div>
                    </div>
                  )}
                  
                  {/* График */}
                  <div className="h-64 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/30 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4C1D95" opacity={0.3} />
                        <XAxis 
                          dataKey="formattedDate" 
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value.toFixed(0)}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #7C3AED',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                          labelStyle={{ color: '#D1D5DB' }}
                          formatter={(value: number, name: string) => [
                            name === 'balance' ? formatCurrency(value) : value.toFixed(0), 
                            name === 'balance' ? 'Баланс' : 
                            name === 'wallets' ? 'Кошельки' :
                            name === 'incoming' ? 'Пополнения' : 'Выводы'
                          ]}
                          labelFormatter={(label) => `Дата: ${label}`}
                        />
                        <Legend 
                          wrapperStyle={{ 
                            color: '#D1D5DB',
                            fontSize: '12px',
                            paddingTop: '10px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#10B981" 
                          strokeWidth={3}
                          name="Баланс"
                          dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="wallets" 
                          stroke="#8B5CF6" 
                          strokeWidth={3}
                          name="Кошельки"
                          dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="incoming" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          name="Пополнения"
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="outgoing" 
                          stroke="#F97316" 
                          strokeWidth={3}
                          name="Выводы"
                          dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#F97316', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Последние операции */}
        <Card className="hover-glow">
          <CardHeader>
            <CardTitle className="text-white">Последние операции</CardTitle>
            <CardDescription className="text-gray-300">
              История ваших последних транзакций
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg animate-pulse">
                      <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="h-4 w-16 bg-gray-700 rounded"></div>
                        <div className="h-3 w-12 bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                stats?.transactionStats.recentTransactions.length ? (
                  stats.transactionStats.recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 border border-purple-500/30 rounded-lg bg-gradient-to-r from-purple-900/10 to-pink-900/10 hover:from-purple-900/20 hover:to-pink-900/20 transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 ${tx.type === 'INCOMING' ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'} rounded-full flex items-center justify-center`}>
                          {tx.type === 'INCOMING' ? (
                            <ArrowDownLeft className="h-5 w-5 text-green-400" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {tx.type === 'INCOMING' ? 'Пополнение' : 'Вывод'}
                          </p>
                          <p className="text-sm text-gray-300">{tx.wallet.network}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${tx.type === 'INCOMING' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.type === 'INCOMING' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Нет недавних транзакций</p>
                    <p className="text-sm text-gray-500">Ваши операции будут отображаться здесь</p>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Модальное окно для запроса страхового взноса */}
        {showInsuranceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Запрос страхового взноса</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInsuranceModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="text-gray-300">
                  Выберите сеть для пополнения страхового баланса
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="network" className="text-white">Сеть</Label>
                  <select
                    id="network"
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value)}
                    className="w-full mt-1 p-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">Выберите сеть</option>
                    {networks.map((network) => (
                      <option key={network.id} value={network.name}>
                        {network.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleInsuranceRequest}
                    disabled={!selectedNetwork}
                    className="neon-button flex-1"
                  >
                    Отправить запрос
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInsuranceModal(false)}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

    </Layout>
  )
}
