'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import {
  Plus, 
  Wallet, 
  Settings, 
  Trash2, 
  Power, 
  PowerOff,
  Copy,
  Eye,
  EyeOff,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  RefreshCw,
  History,
  Shield,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { InsuranceDepositBanner } from '@/components/wallets/InsuranceDepositBanner'
import { InsuranceBalanceCard } from '@/components/wallets/InsuranceBalanceCard'

// Интерфейсы для типизации
interface Wallet {
  id: string
  address: string | null
  network: string
  type: string
  status: string
  dailyLimit: number | null
  monthlyLimit: number | null
  balance: number
  lastChecked: string | null
  createdAt: string
}

interface WalletTransaction {
  id: string
  hash: string
  type: 'INCOMING' | 'OUTGOING'
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
}

const networkColors: Record<string, string> = {
  TRC20: 'bg-blue-100 text-blue-800',
  BEP20: 'bg-yellow-100 text-yellow-800',
  ERC20: 'bg-green-100 text-green-800',
  POLYGON: 'bg-purple-100 text-purple-800'
}

interface WalletRequest {
  id: string
  address: string
  network: string
  status: string
  description: string | null
  createdAt: string
}

interface InsuranceDeposit {
  insuranceDepositAmount: number
  insuranceDepositPaid: number
  isInsuranceDepositPaid: boolean
  canWork: boolean
}

interface WithdrawalRequest {
  id: string
  walletId: string
  amount: number
  status: string
  paidAmount: number
  remainingAmount: number
  profit?: number
  adminNotes?: string
  createdAt: string
  wallet: {
    id: string
    address: string | null
    network: string
    type: string
  }
  earnings: Array<{
    id: string
    amount: number
    createdAt: string
  }>
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [walletRequests, setWalletRequests] = useState<WalletRequest[]>([])
  const [depositRequests, setDepositRequests] = useState<any[]>([])
  const [insuranceDeposit, setInsuranceDeposit] = useState<InsuranceDeposit | null>(null)
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [walletTypeSelection, setWalletTypeSelection] = useState<'select' | 'deposit' | 'withdrawal' | 'insurance-withdrawal'>('select')
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([])
  const [showTransactions, setShowTransactions] = useState(false)
  const [showInsuranceDepositModal, setShowInsuranceDepositModal] = useState(false)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [userBalance, setUserBalance] = useState(0)
  const [networks, setNetworks] = useState<Array<{id: string, name: string, displayName: string, isActive: boolean}>>([])
  const [confirmedDepositRequests, setConfirmedDepositRequests] = useState<Set<string>>(new Set())
  const [insuranceDepositAcknowledged, setInsuranceDepositAcknowledged] = useState(false)
  const [newWallet, setNewWallet] = useState({
    address: '',
    network: '',
    type: 'RECEIVE', // RECEIVE для пополнения, DEPOSIT для страхового, WITHDRAWAL для вывода
    dailyLimit: '',
    monthlyLimit: '',
    minAmount: '',
    maxAmount: ''
  })

  // Загрузка запросов кошельков
  const fetchWalletRequests = async () => {
    try {
      const response = await fetch('/api/user/wallet-requests')
      if (response.ok) {
        const data = await response.json()
        setWalletRequests(data.walletRequests || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки запросов кошельков:', error)
    }
  }

  // Загрузка запросов на страховые взносы
  const fetchDepositRequests = async () => {
    try {
      const response = await fetch('/api/user/insurance-deposit')
      if (response.ok) {
        const data = await response.json()
        setDepositRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки запросов на страховые взносы:', error)
    }
  }

  // Загрузка информации о страховом депозите
  const fetchInsuranceDeposit = async () => {
    try {
      const response = await fetch('/api/user/stats')
      if (response.ok) {
        const data = await response.json()
        const insuranceData = data.insuranceDeposit
        setInsuranceDeposit({
          insuranceDepositAmount: insuranceData.amount,
          insuranceDepositPaid: insuranceData.paid,
          isInsuranceDepositPaid: insuranceData.amount > 0 && insuranceData.paid >= insuranceData.amount,
          canWork: insuranceData.amount > 0 && insuranceData.paid >= insuranceData.amount
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки страхового депозита:', error)
    }
  }

  // Загрузка запросов на вывод
  const fetchWithdrawalRequests = async () => {
    try {
      const response = await fetch('/api/user/withdrawal-requests')
      if (response.ok) {
        const data = await response.json()
        setWithdrawalRequests(data.withdrawalRequests || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки запросов на вывод:', error)
    }
  }

  // Загрузка баланса пользователя
  const fetchUserBalance = async () => {
    try {
      const response = await fetch('/api/user/balance')
      if (response.ok) {
        const data = await response.json()
        console.log('💰 BALANCE API RESPONSE:', data)
        setUserBalance(data.balance || 0)
      }
    } catch (error) {
      console.error('Ошибка загрузки баланса:', error)
    }
  }

  // Загрузка сетей
  const fetchNetworks = async () => {
    try {
      const response = await fetch('/api/user/networks')
      if (response.ok) {
        const data = await response.json()
        setNetworks(data.networks || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки сетей:', error)
    }
  }

  // Загрузка кошельков пользователя
  const fetchWallets = async () => {
    try {
      const response = await fetch('/api/user/wallets')
      if (response.ok) {
        const data = await response.json()
        console.log('💼 ALL WALLETS:', data.wallets)
        console.log('💼 WITHDRAWAL WALLETS:', data.wallets.filter((w: any) => w.type === 'WITHDRAWAL'))
        console.log('💼 DEPOSIT WALLETS:', data.wallets.filter((w: any) => w.type === 'DEPOSIT'))
        setWallets(data.wallets)
      }
    } catch (error) {
      console.error('Ошибка загрузки кошельков:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWallets()
    fetchWalletRequests()
    fetchDepositRequests()
    fetchInsuranceDeposit()
    fetchWithdrawalRequests()
    fetchUserBalance()
    fetchNetworks()

    // Загружаем состояние ознакомления из localStorage
    const acknowledged = localStorage.getItem('insuranceDepositAcknowledged')
    if (acknowledged === 'true') {
      setInsuranceDepositAcknowledged(true)
    }

    // Автоматическое обновление данных каждые 10 секунд
    const interval = setInterval(() => {
      fetchWallets()
      fetchDepositRequests()
      fetchInsuranceDeposit()
      fetchWithdrawalRequests()
      fetchUserBalance()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Проверяем, что сеть выбрана
    if (!newWallet.network) {
      toast.error('Выберите сеть')
      return
    }
    

    // Для кошельков пополнения нужны лимиты
    if (newWallet.type === 'DEPOSIT' && (!newWallet.minAmount || !newWallet.maxAmount || !newWallet.dailyLimit)) {
      toast.error('Заполните все лимиты для кошелька пополнения')
      return
    }

    // Для кошельков вывода нужен адрес и сумма
    if (newWallet.type === 'WITHDRAWAL' && (!newWallet.address.trim() || !newWallet.dailyLimit)) {
      toast.error('Введите адрес кошелька и сумму для вывода')
      return
    }

    try {
      const response = await fetch('/api/user/wallet-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: newWallet.type === 'WITHDRAWAL' ? newWallet.address : null,
          network: newWallet.network,
          type: newWallet.type,
          description: newWallet.type === 'RECEIVE' 
            ? `Тип: Для пополнения, Минимальная сумма: ${newWallet.minAmount} USDT, Максимальная сумма: ${newWallet.maxAmount} USDT, Дневной лимит: ${newWallet.dailyLimit} USDT`
            : newWallet.type === 'WITHDRAWAL'
            ? `Тип: Для вывода, Сумма: ${newWallet.dailyLimit} USDT`
            : ''
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setNewWallet({ 
          address: '', 
          network: '', 
          type: 'RECEIVE', 
          dailyLimit: '', 
          monthlyLimit: '',
          minAmount: '',
          maxAmount: ''
        })
        setShowAddForm(false)
        setWalletTypeSelection('select')
        toast.success(data.message)
        // Обновляем список запросов
        fetchWalletRequests()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error)
      }
    } catch (error) {
      console.error('Ошибка отправки запроса:', error)
      toast.error('Ошибка отправки запроса')
    }
  }

  const handleToggleStatus = (walletId: string) => {
    setWallets(wallets.map(wallet => 
      wallet.id === walletId 
        ? { ...wallet, status: wallet.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
        : wallet
    ))
    toast.success('Статус кошелька изменён')
  }

  const handleDeleteWallet = async (walletId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот кошелёк?')) {
      try {
        const response = await fetch(`/api/user/wallets?id=${walletId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setWallets(wallets.filter(wallet => wallet.id !== walletId))
          toast.success('Кошелёк удалён')
        } else {
          const errorData = await response.json()
          toast.error(errorData.error || 'Ошибка удаления кошелька')
        }
      } catch (error) {
        console.error('Ошибка удаления кошелька:', error)
        toast.error('Ошибка удаления кошелька')
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Адрес скопирован в буфер обмена')
  }

  const handleInsuranceDepositPayment = async () => {
    try {
      const response = await fetch('/api/user/insurance-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          network: 'TRC20' // По умолчанию используем TRC20
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Запрос на страховой депозит создан успешно')
        setShowInsuranceDepositModal(false)
        fetchInsuranceDeposit()
        fetchDepositRequests() // Обновляем список запросов
      } else {
        const errorData = await response.json()
        toast.error(errorData.error)
      }
    } catch (error) {
      console.error('Ошибка пополнения страхового депозита:', error)
      toast.error('Ошибка пополнения страхового депозита')
    }
  }

  const handleCreateWithdrawalRequest = async () => {
    if (!selectedWallet || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      toast.error('Введите корректную сумму')
      return
    }

    const amount = parseFloat(withdrawalAmount)
    if (amount > userBalance) {
      toast.error('Недостаточно средств на балансе')
      return
    }

    try {
      const response = await fetch('/api/user/withdrawal-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId: selectedWallet.id,
          amount: amount
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        setWithdrawalAmount('')
        setShowWithdrawalModal(false)
        setSelectedWallet(null)
        fetchWithdrawalRequests()
        fetchUserBalance() // Обновляем баланс
      } else {
        const errorData = await response.json()
        toast.error(errorData.error)
      }
    } catch (error) {
      console.error('Ошибка создания запроса на вывод:', error)
      toast.error('Ошибка создания запроса на вывод')
    }
  }

  const handleConfirmDepositRequest = async (requestId: string) => {
    try {
      // Добавляем запрос в список подтвержденных
      setConfirmedDepositRequests(prev => new Set([...Array.from(prev), requestId]))
      toast.success('Запрос подтвержден')
    } catch (error) {
      console.error('Ошибка подтверждения запроса:', error)
      toast.error('Ошибка подтверждения запроса')
    }
  }

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const activeWallets = wallets.filter(wallet => wallet.status === 'ACTIVE').length

  return (
    <Layout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Кошельки</h1>
            <p className="text-sm sm:text-base text-gray-600">Управление вашими кошельками для приёма средств</p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Добавить кошелёк
          </Button>
        </div>

        {/* Уведомления о страховых взносах */}
        {(() => {
          const depositWallet = wallets.find(w => w.type === 'DEPOSIT')
          const isFullyPaid = insuranceDeposit && insuranceDeposit.isInsuranceDepositPaid
          
          const unconfirmedRequests = depositRequests.filter(request => !confirmedDepositRequests.has(request.id))
          // Показываем только если данные загружены (insuranceDeposit !== null) и депозит не оплачен
          return insuranceDeposit !== null && unconfirmedRequests.length > 0 && !isFullyPaid
        })() && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-800">Запросы на страховые взносы</CardTitle>
              </div>
              <CardDescription className="text-blue-700">
                Статус ваших запросов на пополнение страхового баланса
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {depositRequests
                  .filter(request => !confirmedDepositRequests.has(request.id))
                  .map((request) => (
                  <div key={request.id} className="p-4 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          request.status === 'PENDING' ? 'bg-yellow-500' :
                          request.status === 'PROCESSING' ? 'bg-blue-500' :
                          request.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium text-gray-900">
                          {request.status === 'PENDING' ? 'Ожидает рассмотрения' :
                           request.status === 'PROCESSING' ? 'В работе' :
                           request.status === 'COMPLETED' ? 'Завершен' : 'Отклонен'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Сеть: {request.fromNetwork}</div>
                      {request.adminWalletAddress && (
                        <div>
                          <span className="font-medium">Адрес для пополнения:</span>
                          <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                            {request.adminWalletAddress}
                          </div>
                        </div>
                      )}
                      {request.amount > 0 && (
                        <div>
                          <span className="font-medium">Сумма страхового взноса:</span> {request.amount} USDT
                        </div>
                      )}
                    </div>

                    {request.status === 'PROCESSING' && request.adminWalletAddress && (
                      <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Требуется пополнение</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Администратор назначил кошелек для пополнения. Переведите средства на указанный адрес.
                        </p>
                      </div>
                    )}

                    {request.status === 'COMPLETED' && (
                      <div className="mt-3 flex justify-end">
                        <Button
                          onClick={() => handleConfirmDepositRequest(request.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Подтвердить
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Страховой депозит */}
        {(() => {
          const isFullyPaid = insuranceDeposit && insuranceDeposit.isInsuranceDepositPaid
          
          return insuranceDeposit && insuranceDeposit.insuranceDepositAmount > 0 && !isFullyPaid
        })() && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-800">
                  Страховой депозит
                </CardTitle>
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <CardDescription className="text-orange-700">
                Для работы с кошельками необходимо пополнить страховой депозит.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Требуемая сумма</Label>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(insuranceDeposit?.insuranceDepositAmount || 0)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Оплачено</Label>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(insuranceDeposit?.insuranceDepositPaid || 0)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Статус</Label>
                  <div className="text-lg font-semibold text-orange-600">
                    {(() => {
                      const paid = insuranceDeposit?.insuranceDepositPaid || 0
                      const required = insuranceDeposit?.insuranceDepositAmount || 0
                      const shortage = required - paid
                      if (shortage <= 0) {
                        return `${formatCurrency(paid)} / ${formatCurrency(required)}`
                      } else {
                        return `${formatCurrency(paid)} / ${formatCurrency(required)} (не хватает ${formatCurrency(shortage)})`
                      }
                    })()}
                  </div>
                </div>
              </div>
              
              {!insuranceDeposit?.isInsuranceDepositPaid && (
                <div className="mt-4">
                  <Button 
                    onClick={() => setShowInsuranceDepositModal(true)}
                    className="w-full sm:w-auto"
                    variant="outline"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Создать запрос
                  </Button>
                </div>
              )}

              {insuranceDeposit?.isInsuranceDepositPaid && (
                <div className="mt-4 p-3 bg-green-100 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Важно:</strong> Страховой депозит можно будет вывести только спустя 15 дней после завершения работы.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Статус страхового депозита после оплаты */}
        <InsuranceDepositBanner
          amount={insuranceDeposit?.insuranceDepositAmount || 0}
          paid={insuranceDeposit?.insuranceDepositPaid || 0}
          acknowledged={insuranceDepositAcknowledged}
          onAcknowledge={() => {
            setInsuranceDepositAcknowledged(true)
            localStorage.setItem('insuranceDepositAcknowledged', 'true')
            toast.success('Информация принята')
          }}
        />

        {/* Статистика */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 w-4 bg-gray-700 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-12 bg-gray-700 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Активные кошельки</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeWallets}</div>
                <p className="text-xs text-muted-foreground">
                  Из {wallets.length} всего
                </p>
              </CardContent>
            </Card>

            <InsuranceBalanceCard 
              amount={insuranceDeposit?.insuranceDepositAmount || 0}
              paid={insuranceDeposit?.insuranceDepositPaid || 0}
            />

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Средний баланс</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(wallets.length > 0 ? totalBalance / wallets.length : 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  На кошелек
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Форма добавления кошелька */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Добавить новый кошелёк</CardTitle>
            </CardHeader>
            <CardContent>
              {walletTypeSelection === 'select' && (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">Выберите тип кошелька:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button
                      onClick={() => {
                        setWalletTypeSelection('deposit')
                        setNewWallet(prev => ({ ...prev, type: 'RECEIVE' }))
                      }}
                      className="h-20 text-left justify-start p-4"
                      variant="outline"
                    >
                      <div className="flex items-center space-x-3">
                        <ArrowUpRight className="h-6 w-6 text-blue-600" />
                        <div>
                          <div className="font-semibold">Для пополнения</div>
                          <div className="text-sm text-gray-500">Укажите лимиты и сеть</div>
                        </div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => {
                        setWalletTypeSelection('withdrawal')
                        setNewWallet(prev => ({ ...prev, type: 'WITHDRAWAL' }))
                      }}
                      className="h-20 text-left justify-start p-4"
                      variant="outline"
                    >
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-6 w-6 text-purple-600" />
                        <div>
                          <div className="font-semibold">Для вывода</div>
                          <div className="text-sm text-gray-500">Укажите адрес кошелька</div>
                        </div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => {
                        setWalletTypeSelection('insurance-withdrawal')
                        setNewWallet(prev => ({ ...prev, type: 'WITHDRAWAL', address: '', network: '' }))
                      }}
                      className="h-20 text-left justify-start p-4"
                      variant="outline"
                    >
                      <div className="flex items-center space-x-3">
                        <Shield className="h-6 w-6 text-green-600" />
                        <div>
                          <div className="font-semibold">Вывод страхового</div>
                          <div className="text-sm text-gray-500">После 15 дней</div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              )}

              {walletTypeSelection === 'deposit' && (
                <form onSubmit={handleAddWallet} className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Button
                      onClick={() => setWalletTypeSelection('select')}
                      variant="outline"
                      size="sm"
                    >
                      ← Назад
                    </Button>
                    <h4 className="text-lg font-semibold">Кошелек для пополнения</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deposit-network">Сеть</Label>
                      <select
                        id="deposit-network"
                        value={newWallet.network}
                        onChange={(e) => setNewWallet({ ...newWallet, network: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Выберите сеть</option>
                        {networks.filter(network => network.isActive).map(network => (
                          <option key={network.id} value={network.name}>
                            {network.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="dailyLimit">Дневной лимит (USDT)</Label>
                      <Input
                        id="dailyLimit"
                        type="number"
                        step="0.01"
                        value={newWallet.dailyLimit}
                        onChange={(e) => setNewWallet({ ...newWallet, dailyLimit: e.target.value })}
                        placeholder="Дневной лимит"
                        className="text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="minAmount">Минимальная сумма (USDT)</Label>
                      <Input
                        id="minAmount"
                        type="number"
                        step="0.01"
                        value={newWallet.minAmount}
                        onChange={(e) => setNewWallet({ ...newWallet, minAmount: e.target.value })}
                        placeholder="Минимальная сумма"
                        className="text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxAmount">Максимальная сумма (USDT)</Label>
                      <Input
                        id="maxAmount"
                        type="number"
                        step="0.01"
                        value={newWallet.maxAmount}
                        onChange={(e) => setNewWallet({ ...newWallet, maxAmount: e.target.value })}
                        placeholder="Максимальная сумма"
                        className="text-white"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button type="submit" className="w-full sm:w-auto">Отправить запрос</Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setShowAddForm(false)
                      setWalletTypeSelection('select')
                      setNewWallet({
                        address: '',
                        network: '',
                        type: 'RECEIVE',
                        dailyLimit: '',
                        monthlyLimit: '',
                        minAmount: '',
                        maxAmount: ''
                      })
                    }} className="w-full sm:w-auto">
                      Отмена
                    </Button>
                  </div>
                </form>
              )}

              {walletTypeSelection === 'withdrawal' && (
                <form onSubmit={handleAddWallet} className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Button
                      onClick={() => setWalletTypeSelection('select')}
                      variant="outline"
                      size="sm"
                    >
                      ← Назад
                    </Button>
                    <h4 className="text-lg font-semibold">Кошелек для вывода</h4>
                  </div>

                  {/* Отображение доступного баланса */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Доступный баланс</p>
                        <p className="text-2xl font-bold text-green-800">{userBalance.toFixed(2)} USDT</p>
                      </div>
                      <div className="text-green-600">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="withdrawal-address">Адрес кошелька</Label>
                      <Input
                        id="withdrawal-address"
                        value={newWallet.address}
                        onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                        placeholder="Введите адрес кошелька"
                        className="text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="withdrawal-network">Сеть</Label>
                      <select
                        id="withdrawal-network"
                        value={newWallet.network}
                        onChange={(e) => setNewWallet({ ...newWallet, network: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                      >
                        <option value="">Выберите сеть</option>
                        {networks.filter(network => network.isActive).map(network => (
                          <option key={network.id} value={network.name}>
                            {network.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Сумма для вывода */}
                  <div>
                    <Label htmlFor="withdrawal-amount">Сумма для вывода (USDT)</Label>
                    <Input
                      id="withdrawal-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={userBalance}
                      value={newWallet.dailyLimit}
                      onChange={(e) => setNewWallet({ ...newWallet, dailyLimit: e.target.value })}
                      placeholder="Введите сумму для вывода"
                      className="text-white"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Доступно: {userBalance.toFixed(2)} USDT
                    </p>
                  </div>

                  {/* Кнопки быстрого выбора суммы */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-300">Быстрый выбор суммы:</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setNewWallet({ ...newWallet, dailyLimit: (userBalance * 0.1).toFixed(2) })}
                        className="text-xs"
                      >
                        10% ({userBalance > 0 ? (userBalance * 0.1).toFixed(2) : '0.00'} USDT)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setNewWallet({ ...newWallet, dailyLimit: (userBalance * 0.25).toFixed(2) })}
                        className="text-xs"
                      >
                        25% ({userBalance > 0 ? (userBalance * 0.25).toFixed(2) : '0.00'} USDT)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setNewWallet({ ...newWallet, dailyLimit: (userBalance * 0.5).toFixed(2) })}
                        className="text-xs"
                      >
                        50% ({userBalance > 0 ? (userBalance * 0.5).toFixed(2) : '0.00'} USDT)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setNewWallet({ ...newWallet, dailyLimit: userBalance.toFixed(2) })}
                        className="text-xs"
                      >
                        Все ({userBalance.toFixed(2)} USDT)
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button type="submit" className="w-full sm:w-auto">Отправить запрос</Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setShowAddForm(false)
                      setWalletTypeSelection('select')
                      setNewWallet({
                        address: '',
                        network: '',
                        type: 'RECEIVE',
                        dailyLimit: '',
                        monthlyLimit: '',
                        minAmount: '',
                        maxAmount: ''
                      })
                    }} className="w-full sm:w-auto">
                      Отмена
                    </Button>
                  </div>
                </form>
              )}

              {walletTypeSelection === 'insurance-withdrawal' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Button
                      onClick={() => setWalletTypeSelection('select')}
                      variant="outline"
                      size="sm"
                    >
                      ← Назад
                    </Button>
                    <h4 className="text-lg font-semibold">Вывод страхового баланса</h4>
                  </div>

                  {/* Информация о страховом балансе */}
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm font-medium text-yellow-800">Страховой баланс</p>
                    </div>
                    <p className="text-2xl font-bold text-yellow-900">
                      {(() => {
                        const depositWallet = wallets.find(w => w.type === 'DEPOSIT')
                        return depositWallet ? formatCurrency(depositWallet.balance) : '0 USDT'
                      })()}
                    </p>
                    <p className="text-xs text-yellow-700 mt-2">
                      ⚠️ Важно: Страховой депозит можно вывести только спустя 15 дней после внесения
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="insurance-address">Адрес кошелька для вывода</Label>
                      <Input
                        id="insurance-address"
                        value={newWallet.address}
                        onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                        placeholder="Введите адрес кошелька"
                        className="text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="insurance-network">Сеть</Label>
                      <select
                        id="insurance-network"
                        value={newWallet.network}
                        onChange={(e) => setNewWallet({ ...newWallet, network: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                      >
                        <option value="">Выберите сеть</option>
                        {networks.filter(network => network.isActive).map(network => (
                          <option key={network.id} value={network.name}>
                            {network.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Информация:</strong> После отправки запроса администратор проверит соблюдение 15-дневного срока и одобрит вывод страхового баланса.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/user/wallet-requests', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              address: newWallet.address,
                              network: newWallet.network,
                              type: 'WITHDRAWAL',
                              description: `Тип: Вывод страхового депозита, Адрес: ${newWallet.address}, Сеть: ${newWallet.network}`
                            })
                          })

                          if (response.ok) {
                            toast.success('Запрос на вывод страхового баланса отправлен админу!')
                            setShowAddForm(false)
                            setWalletTypeSelection('select')
                            setNewWallet({
                              address: '',
                              network: '',
                              type: 'DEPOSIT',
                              dailyLimit: '',
                              monthlyLimit: '',
                              minAmount: '',
                              maxAmount: ''
                            })
                            fetchWalletRequests()
                          } else {
                            const errorData = await response.json()
                            toast.error(errorData.error || 'Ошибка отправки запроса')
                          }
                        } catch (error) {
                          console.error('Ошибка:', error)
                          toast.error('Ошибка отправки запроса')
                        }
                      }}
                      className="w-full sm:w-auto"
                      disabled={!newWallet.address || !newWallet.network}
                    >
                      Отправить запрос
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setShowAddForm(false)
                      setWalletTypeSelection('select')
                      setNewWallet({
                        address: '',
                        network: '',
                        type: 'RECEIVE',
                        dailyLimit: '',
                        monthlyLimit: '',
                        minAmount: '',
                        maxAmount: ''
                      })
                    }} className="w-full sm:w-auto">
                      Отмена
                    </Button>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        )}

        {/* Запросы кошельков */}
        {walletRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Мои запросы кошельков</CardTitle>
              <CardDescription>
                Статус ваших запросов на добавление кошельков
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {walletRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        request.status === 'PENDING' ? 'bg-yellow-500' :
                        request.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">{request.address}</p>
                        <p className="text-sm text-gray-600">
                          {request.network} • {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                        {request.description && (
                          <p className="text-xs text-gray-500 mt-1">{request.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status === 'PENDING' ? 'Ожидает' :
                         request.status === 'APPROVED' ? 'Одобрен' : 'Отклонен'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Список кошельков */}
        <div className="space-y-6">
          {/* Горизонтальное расположение блоков кошельков */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Все кошельки в одном grid - каждый кошелек - отдельная карточка */}
            {wallets.map((wallet) => (
              <Card key={wallet.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-5 w-5" />
                      <CardTitle className="text-lg">
                        {wallet.network} Кошелёк
                      </CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${networkColors[wallet.network]}`}>
                        {wallet.network}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        wallet.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : wallet.status === 'IN_WORK'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {wallet.status === 'ACTIVE' ? 'Активен' : 
                         wallet.status === 'IN_WORK' ? 'В работе' : 'Неактивен'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        wallet.type === 'RECEIVE' 
                          ? 'bg-blue-100 text-blue-800'
                          : wallet.type === 'DEPOSIT'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {wallet.type === 'RECEIVE' ? 'Для пополнения' : wallet.type === 'DEPOSIT' ? 'Страховой депозит' : 'Для вывода'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Адрес кошелька */}
                  <div>
                    <Label className="text-sm font-medium">Адрес</Label>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-1">
                      <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono text-gray-900 break-all">
                        {wallet.address || 'Не назначен'}
                      </code>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => copyToClipboard(wallet.address || '')}
                        className="w-full sm:w-auto"
                        disabled={!wallet.address}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Баланс */}
                  <div>
                    <Label className="text-sm font-medium">Баланс</Label>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(wallet.balance)}
                    </div>
                  </div>

                  {/* Лимиты - только для RECEIVE и DEPOSIT */}
                  {(wallet.type === 'RECEIVE' || wallet.type === 'DEPOSIT') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Дневной лимит</Label>
                        <div className="text-lg font-semibold">
                          {wallet.dailyLimit ? formatCurrency(wallet.dailyLimit) : 'Не установлен'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Месячный лимит</Label>
                        <div className="text-lg font-semibold">
                          {wallet.monthlyLimit ? formatCurrency(wallet.monthlyLimit) : 'Не установлен'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Кнопки действий - только для WITHDRAWAL */}
                  {wallet.type === 'WITHDRAWAL' && (
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteWallet(wallet.id)}
                        className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Удалить
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {withdrawalRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Мои запросы на вывод</CardTitle>
              <CardDescription>
                Статус ваших запросов на вывод средств
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {withdrawalRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        request.status === 'PENDING' ? 'bg-yellow-500' :
                        request.status === 'PROCESSING' ? 'bg-blue-500' :
                        request.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">{request.wallet.address}</p>
                        <p className="text-sm text-gray-600">
                          {request.wallet.network} • {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            Запрошено: <span className="font-medium">{request.amount} USDT</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Получено: <span className="font-medium text-green-600">{request.paidAmount} USDT</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Осталось: <span className="font-medium text-orange-600">{request.remainingAmount} USDT</span>
                          </p>
                          {request.profit && (
                            <p className="text-sm text-green-600 font-medium">
                              Доход: +{request.profit} USDT
                            </p>
                          )}
                          {request.adminNotes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <p className="text-gray-600 font-medium">Заметка админа:</p>
                              <p className="text-gray-700">{request.adminNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status === 'PENDING' ? 'Ожидает' :
                         request.status === 'PROCESSING' ? 'В работе' :
                         request.status === 'COMPLETED' ? 'Завершен' : 'Отклонен'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Модальное окно пополнения страхового депозита */}
        {showInsuranceDepositModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Создать запрос на страховой депозит
            </h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Информация:</strong> После создания запроса администратор назначит сумму и предоставит адрес для пополнения.
                </p>
              </div>
                
                {insuranceDeposit && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Требуется: {formatCurrency(insuranceDeposit.insuranceDepositAmount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Оплачено: {formatCurrency(insuranceDeposit.insuranceDepositPaid)}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      Остаток: {formatCurrency(Math.max(0, insuranceDeposit.insuranceDepositAmount - insuranceDeposit.insuranceDepositPaid))}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <Button
                  onClick={() => {
                    setShowInsuranceDepositModal(false)
                  }}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleInsuranceDepositPayment}
                  className="w-full sm:w-auto"
                >
                  Создать запрос
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно создания запроса на вывод */}
        {showWithdrawalModal && selectedWallet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Создать запрос на вывод
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700">Кошелек</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{selectedWallet.address}</p>
                    <p className="text-sm text-gray-600">{selectedWallet.network}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-700 mb-2 block">Ваш баланс</Label>
                  <div className="p-3 bg-green-50 rounded-lg mb-4">
                    <p className="text-lg font-semibold text-green-800">
                      {userBalance.toFixed(2)} USDT
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="withdrawal-amount" className="text-gray-700">Сумма для вывода (USDT)</Label>
                  <Input
                    id="withdrawal-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={userBalance}
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="Введите сумму"
                    className="mt-1"
                  />
                  
                  {/* Кнопки быстрого выбора */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setWithdrawalAmount((userBalance * 0.25).toFixed(2))}
                      className="text-xs"
                    >
                      25%
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setWithdrawalAmount((userBalance * 0.5).toFixed(2))}
                      className="text-xs"
                    >
                      50%
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setWithdrawalAmount((userBalance * 0.75).toFixed(2))}
                      className="text-xs"
                    >
                      75%
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setWithdrawalAmount(userBalance.toFixed(2))}
                      className="text-xs"
                    >
                      Все
                    </Button>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Важно:</strong> После создания запроса кошелек будет переведен в статус "В работе" и станет недоступен для других операций до завершения работы.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <Button
                  onClick={() => {
                    setShowWithdrawalModal(false)
                    setWithdrawalAmount('')
                    setSelectedWallet(null)
                  }}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleCreateWithdrawalRequest}
                  className="w-full sm:w-auto"
                  disabled={!withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
                >
                  Создать запрос
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
