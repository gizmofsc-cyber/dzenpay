'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Layout from '@/components/layout/Layout'
import { ArrowLeft, Wallet, Network, DollarSign, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface NetworkPair {
  id: string
  fromNetwork: string
  toNetwork: string
  profitPercent: number
}

interface DepositRequest {
  id: string
  amount: number
  fromNetwork: string
  toNetwork: string
  adminWalletAddress: string
  status: string
  createdAt: string
}

export default function DepositPage() {
  const router = useRouter()
  const [networkPairs, setNetworkPairs] = useState<NetworkPair[]>([])
  const [selectedPair, setSelectedPair] = useState<NetworkPair | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([])

  // Загрузка сетевых пар
  useEffect(() => {
    const fetchNetworkPairs = async () => {
      try {
        const response = await fetch('/api/network-pairs')
        if (response.ok) {
          const data = await response.json()
          setNetworkPairs(data.networkPairs || [])
        }
      } catch (error) {
        console.error('Ошибка загрузки сетевых пар:', error)
      }
    }

    fetchNetworkPairs()
  }, [])

  // Загрузка запросов пополнения
  useEffect(() => {
    const fetchDepositRequests = async () => {
      try {
        const response = await fetch('/api/user/deposit-requests')
        if (response.ok) {
          const data = await response.json()
          setDepositRequests(data.depositRequests || [])
        }
      } catch (error) {
        console.error('Ошибка загрузки запросов пополнения:', error)
      }
    }

    fetchDepositRequests()
  }, [])

  const handleCreateDepositRequest = async () => {
    if (!selectedPair || !amount) {
      toast.error('Выберите сетевую пару и введите сумму')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Введите корректную сумму')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/deposit-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numAmount,
          fromNetwork: selectedPair.fromNetwork,
          toNetwork: selectedPair.toNetwork
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        
        // Обновляем список запросов
        const updatedResponse = await fetch('/api/user/deposit-requests')
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json()
          setDepositRequests(updatedData.depositRequests || [])
        }
        
        // Сбрасываем форму
        setAmount('')
        setSelectedPair(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error)
      }
    } catch (error) {
      console.error('Ошибка создания запроса пополнения:', error)
      toast.error('Ошибка создания запроса пополнения')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'PROCESSING': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'COMPLETED': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'CANCELLED': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Ожидает'
      case 'PROCESSING': return 'Обрабатывается'
      case 'COMPLETED': return 'Завершено'
      case 'CANCELLED': return 'Отменено'
      default: return status
    }
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Заголовок */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold gradient-text">Пополнение баланса</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Выбор сетевой пары */}
          <Card className="neon-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Network className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Выберите сетевую пару</h2>
            </div>

            <div className="space-y-3 mb-6">
              {networkPairs.map((pair) => (
                <div
                  key={pair.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedPair?.id === pair.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedPair(pair)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">
                        {pair.fromNetwork} → {pair.toNetwork}
                      </div>
                      <div className="text-sm text-gray-400">
                        Доходность: {pair.profitPercent}%
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {pair.profitPercent}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Ввод суммы */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-gray-300">Сумма пополнения (USDT)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Введите сумму"
                  className="neon-input mt-1"
                />
              </div>

              <Button
                onClick={handleCreateDepositRequest}
                disabled={!selectedPair || !amount || loading}
                className="w-full neon-button"
              >
                {loading ? 'Создание запроса...' : 'Создать запрос на пополнение'}
              </Button>
            </div>
          </Card>

          {/* Информация о процессе */}
          <Card className="neon-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Процесс пополнения</h2>
            </div>

            <div className="space-y-4 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">1</div>
                <div>
                  <div className="font-medium text-white">Выберите сетевую пару</div>
                  <div className="text-gray-400">Выберите сети для пополнения и перевода</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">2</div>
                <div>
                  <div className="font-medium text-white">Введите сумму</div>
                  <div className="text-gray-400">Укажите сумму пополнения в USDT</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-xs">3</div>
                <div>
                  <div className="font-medium text-white">Получите адрес кошелька</div>
                  <div className="text-gray-400">Админ предоставит адрес для пополнения</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-xs">4</div>
                <div>
                  <div className="font-medium text-white">Ожидайте обработки</div>
                  <div className="text-gray-400">Админ проверит транзакцию и зачислит средства</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* История запросов */}
        {depositRequests.length > 0 && (
          <Card className="neon-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold text-white">Мои запросы пополнения</h2>
            </div>

            <div className="space-y-3">
              {depositRequests.map((request) => (
                <div key={request.id} className="p-4 rounded-lg border border-gray-600 bg-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-medium">
                      {request.fromNetwork} → {request.toNetwork}
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusText(request.status)}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>Сумма: <span className="text-white">{request.amount} USDT</span></div>
                    {request.adminWalletAddress && (
                      <div>Адрес для пополнения: <span className="text-white font-mono text-xs">{request.adminWalletAddress}</span></div>
                    )}
                    <div>Создан: {new Date(request.createdAt).toLocaleString('ru-RU')}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}
