'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  RefreshCw
} from 'lucide-react'

interface Payment {
  id: string
  amount: number
  profit: number
  status: string
  transferTime: string | null
  createdAt: string
  wallet: {
    address: string
    network: string
  }
}

interface Transaction {
  id: string
  hash: string
  type: string
  amount: number
  balance: number
  fromAddress: string | null
  toAddress: string | null
  blockNumber: string | null
  gasUsed: string | null
  gasPrice: string | null
  fee: number
  status: string
  createdAt: string
  wallet: {
    address: string | null
    network: string
    type: string
  }
}

interface PaymentStats {
  totalAmount: number
  totalProfit: number
  completedPayments: number
  pendingPayments: number
}

interface TransactionStats {
  totalIncoming: number
  totalOutgoing: number
  totalTransactions: number
}

// Моковые данные для демонстрации
const mockPayments = [
  {
    id: '1',
    amount: 1500,
    profit: 37.5,
    status: 'COMPLETED',
    transferTime: new Date('2024-01-15T14:30:00'),
    network: 'TRC20 → BEP20',
    wallet: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'
  },
  {
    id: '2',
    amount: 2300,
    profit: 73.6,
    status: 'COMPLETED',
    transferTime: new Date('2024-01-14T09:15:00'),
    network: 'BEP20 → ERC20',
    wallet: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  },
  {
    id: '3',
    amount: 800,
    profit: 14.4,
    status: 'PENDING',
    transferTime: new Date('2024-01-13T16:45:00'),
    network: 'ERC20 → POLYGON',
    wallet: '0x8ba1f109551bD432803012645Hac136c0c8B1288'
  },
  {
    id: '4',
    amount: 3200,
    profit: 89.6,
    status: 'COMPLETED',
    transferTime: new Date('2024-01-12T11:20:00'),
    network: 'TRC20 → ERC20',
    wallet: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'
  },
  {
    id: '5',
    amount: 950,
    profit: 26.6,
    status: 'FAILED',
    transferTime: new Date('2024-01-11T08:30:00'),
    network: 'BEP20 → POLYGON',
    wallet: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  }
]

const statusColors = {
  COMPLETED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800'
}

const statusLabels = {
  COMPLETED: 'Завершено',
  PENDING: 'Ожидает',
  FAILED: 'Ошибка'
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [transactionStats, setTransactionStats] = useState<TransactionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'payments' | 'transactions'>('payments')

  // Загрузка данных о выплатах и транзакциях
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем выплаты
        const paymentsResponse = await fetch('/api/user/payments')
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json()
          setPayments(paymentsData.payments || [])
          setStats(paymentsData.stats)
        }

        // Загружаем транзакции
        const transactionsResponse = await fetch('/api/user/transactions')
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json()
          setTransactions(transactionsData.transactions || [])
          setTransactionStats(transactionsData.stats)
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Фильтрация выплат
  const filteredPayments = payments.filter(payment => {
    const walletAddress = payment.wallet.address || ''
    const matchesSearch = walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.wallet.network.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const paymentDate = payment.transferTime ? new Date(payment.transferTime) : new Date(payment.createdAt)
    const matchesDate = dateFilter === 'all' || 
                       (dateFilter === 'today' && isToday(paymentDate)) ||
                       (dateFilter === 'week' && isThisWeek(paymentDate)) ||
                       (dateFilter === 'month' && isThisMonth(paymentDate))
    
    return matchesSearch && matchesStatus && matchesDate
  })

  // Фильтрация транзакций
  const filteredTransactions = transactions.filter(transaction => {
    const walletAddress = transaction.wallet.address || ''
    const matchesSearch = walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.wallet.network.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.hash.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
    const transactionDate = new Date(transaction.createdAt)
    const matchesDate = dateFilter === 'all' || 
                       (dateFilter === 'today' && isToday(transactionDate)) ||
                       (dateFilter === 'week' && isThisWeek(transactionDate)) ||
                       (dateFilter === 'month' && isThisMonth(transactionDate))
    
    return matchesSearch && matchesStatus && matchesDate
  })

  // Статистика
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalProfit = filteredPayments.reduce((sum, payment) => sum + payment.profit, 0)
  const completedPayments = filteredPayments.filter(p => p.status === 'COMPLETED').length

  function isToday(date: Date) {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  function isThisWeek(date: Date) {
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    return date >= startOfWeek
  }

  function isThisMonth(date: Date) {
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Выплаты и транзакции</h1>
          <p className="text-gray-600">История всех ваших транзакций и выплат</p>
        </div>

        {/* Табы */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'payments'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Выплаты
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Транзакции
          </button>
        </div>

        {/* Статистика */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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
        ) : activeTab === 'payments' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-stat">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Общая сумма</CardTitle>
                <DollarSign className="h-4 w-4 text-green-400 icon-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400 neon-text">
                  {formatCurrency(stats?.totalAmount || totalAmount)}
                </div>
                <p className="text-xs text-gray-400">
                  За выбранный период
                </p>
              </CardContent>
            </Card>

            <Card className="card-stat">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Общая прибыль</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-400 icon-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400 neon-text">
                  {formatCurrency(stats?.totalProfit || totalProfit)}
                </div>
                <p className="text-xs text-gray-400">
                  Автоматически рассчитано
                </p>
              </CardContent>
            </Card>

            <Card className="card-stat">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Завершённых операций</CardTitle>
                <Clock className="h-4 w-4 text-blue-400 icon-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400 neon-text">
                  {stats?.completedPayments || completedPayments}
                </div>
                <p className="text-xs text-gray-400">
                  Из {(stats?.completedPayments || 0) + (stats?.pendingPayments || 0) || filteredPayments.length} операций
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-stat">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Пополнения</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-400 icon-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400 neon-text">
                  {formatCurrency(transactionStats?.totalIncoming || 0)}
                </div>
                <p className="text-xs text-gray-400">
                  Входящие транзакции
                </p>
              </CardContent>
            </Card>

            <Card className="card-stat">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Переводы</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-400 icon-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400 neon-text">
                  {formatCurrency(transactionStats?.totalOutgoing || 0)}
                </div>
                <p className="text-xs text-gray-400">
                  Исходящие транзакции
                </p>
              </CardContent>
            </Card>

            <Card className="card-stat">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Всего транзакций</CardTitle>
                <Clock className="h-4 w-4 text-blue-400 icon-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400 neon-text">
                  {transactionStats?.totalTransactions || 0}
                </div>
                <p className="text-xs text-gray-400">
                  Все операции
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Фильтры */}
        <Card>
          <CardHeader>
            <CardTitle>Фильтры и поиск</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Поиск</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder={activeTab === 'payments' ? "Поиск по кошельку или сети..." : "Поиск по хешу, кошельку или сети..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Статус</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">Все статусы</option>
                  <option value="COMPLETED">Завершено</option>
                  <option value="PENDING">Ожидает</option>
                  <option value="FAILED">Ошибка</option>
                </select>
              </div>

              <div>
                <Label htmlFor="date">Период</Label>
                <select
                  id="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">Все время</option>
                  <option value="today">Сегодня</option>
                  <option value="week">Эта неделя</option>
                  <option value="month">Этот месяц</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Экспорт
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Таблица выплат/транзакций */}
        <Card>
          <CardHeader>
            <CardTitle>{activeTab === 'payments' ? 'История выплат' : 'История транзакций'}</CardTitle>
            <CardDescription>
              {activeTab === 'payments' ? 'Детальная информация по всем операциям' : 'Детальная информация по всем транзакциям кошельков'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {activeTab === 'payments' ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">ID</th>
                      <th className="text-left py-3 px-4 font-medium">Сумма</th>
                      <th className="text-left py-3 px-4 font-medium">Прибыль</th>
                      <th className="text-left py-3 px-4 font-medium">Сеть</th>
                      <th className="text-left py-3 px-4 font-medium">Кошелёк</th>
                      <th className="text-left py-3 px-4 font-medium">Статус</th>
                      <th className="text-left py-3 px-4 font-medium">Время</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          #{payment.id}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 px-4 text-green-600 font-medium">
                          +{formatCurrency(payment.profit)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {payment.wallet.network}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                          {payment.wallet.address ? 
                            `${payment.wallet.address.substring(0, 10)}...${payment.wallet.address.substring(payment.wallet.address.length - 6)}` :
                            'Не назначен'
                          }
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[payment.status as keyof typeof statusColors]}`}>
                            {statusLabels[payment.status as keyof typeof statusLabels]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(payment.transferTime ? new Date(payment.transferTime) : new Date(payment.createdAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Хеш</th>
                      <th className="text-left py-3 px-4 font-medium">Тип</th>
                      <th className="text-left py-3 px-4 font-medium">Сумма</th>
                      <th className="text-left py-3 px-4 font-medium">Баланс</th>
                      <th className="text-left py-3 px-4 font-medium">Сеть</th>
                      <th className="text-left py-3 px-4 font-medium">Кошелёк</th>
                      <th className="text-left py-3 px-4 font-medium">Статус</th>
                      <th className="text-left py-3 px-4 font-medium">Время</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                          {transaction.hash.substring(0, 10)}...{transaction.hash.substring(transaction.hash.length - 6)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'INCOMING' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'INCOMING' ? 'Входящая' : 'Исходящая'}
                          </span>
                        </td>
                        <td className={`py-3 px-4 font-medium ${
                          transaction.type === 'INCOMING' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'INCOMING' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatCurrency(transaction.balance)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {transaction.wallet.network}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                          {transaction.wallet.address ? 
                            `${transaction.wallet.address.substring(0, 10)}...${transaction.wallet.address.substring(transaction.wallet.address.length - 6)}` :
                            'Не назначен'
                          }
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status === 'CONFIRMED' ? 'Подтверждена' :
                             transaction.status === 'PENDING' ? 'Ожидает' : 'Ошибка'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(new Date(transaction.createdAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {((activeTab === 'payments' && filteredPayments.length === 0) || 
                (activeTab === 'transactions' && filteredTransactions.length === 0)) && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {activeTab === 'payments' ? 'Нет выплат, соответствующих фильтрам' : 'Нет транзакций, соответствующих фильтрам'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
