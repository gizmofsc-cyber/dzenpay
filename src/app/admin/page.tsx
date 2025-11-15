'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Wallet, 
  Key, 
  UserCheck, 
  UserX, 
  Plus,
  Eye,
  Settings,
  DollarSign,
  Activity,
  BarChart3,
  ArrowDownLeft,
  Network,
  X,
  Shield
} from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  telegram?: string
  status: string
  role: string
  createdAt: string
}

interface Wallet {
  id: string
  address: string
  network: string
  status: string
  userId: string
  balance: number
  user?: {
    id: string
    email: string
    telegram?: string
  }
}

interface RegistrationToken {
  id: string
  token: string
  used: boolean
  createdAt: string
}

interface WalletRequest {
  id: string
  address: string
  network: string
  type: string
  status: string
  description: string | null
  createdAt: string
  user: {
    id: string
    email: string
    telegram: string | null
    status: string
  }
}

interface NetworkPair {
  id: string
  fromNetworkId: string
  toNetworkId: string
  profitPercent: number
  isActive: boolean
  createdAt: string
  updatedAt: string
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

interface UserWithInsuranceDeposit {
  id: string
  email: string
  telegram?: string
  status: string
  insuranceDepositAmount?: number
  insuranceDepositPaid: number
  createdAt: string
}

interface WithdrawalRequestAdmin {
  id: string
  walletId: string
  amount: number
  status: string
  paidAmount: number
  remainingAmount: number
  profit?: number
  adminNotes?: string
  createdAt: string
  user: {
    id: string
    email: string
    telegram?: string
    status: string
  }
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

interface Network {
  id: string
  name: string
  displayName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [tokens, setTokens] = useState<RegistrationToken[]>([])
  const [walletRequests, setWalletRequests] = useState<WalletRequest[]>([])
  const [networkPairs, setNetworkPairs] = useState<NetworkPair[]>([])
  const [insuranceDeposits, setInsuranceDeposits] = useState<UserWithInsuranceDeposit[]>([])
  const [depositRequests, setDepositRequests] = useState<any[]>([])
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequestAdmin[]>([])
  const [networks, setNetworks] = useState<Network[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'wallets' | 'tokens' | 'wallet-requests' | 'network-pairs' | 'stats' | 'metrics' | 'insurance-deposits' | 'withdrawal-requests' | 'networks'>('users')
  const [showAddWalletModal, setShowAddWalletModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [walletTypeSelection, setWalletTypeSelection] = useState<'select' | 'deposit' | 'receive'>('select')
  const [walletForm, setWalletForm] = useState({
    address: '',
    network: 'TRC20',
    type: 'RECEIVE',
    minAmount: '',
    maxAmount: '',
    dailyLimit: ''
  })
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showWalletSettingsModal, setShowWalletSettingsModal] = useState(false)
  const [selectedWalletRequest, setSelectedWalletRequest] = useState<WalletRequest | null>(null)
  const [approveWalletAddress, setApproveWalletAddress] = useState('')
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false)
  const [showEditNetworkPairModal, setShowEditNetworkPairModal] = useState(false)
  const [selectedNetworkPair, setSelectedNetworkPair] = useState<NetworkPair | null>(null)
  const [networkPairForm, setNetworkPairForm] = useState({
    profitPercent: '',
    isActive: true
  })
  const [showInsuranceDepositModal, setShowInsuranceDepositModal] = useState(false)
  const [selectedInsuranceUser, setSelectedInsuranceUser] = useState<UserWithInsuranceDeposit | null>(null)
  const [insuranceDepositForm, setInsuranceDepositForm] = useState({
    amount: ''
  })
  const [showWithdrawalRequestModal, setShowWithdrawalRequestModal] = useState(false)
  const [selectedWithdrawalRequest, setSelectedWithdrawalRequest] = useState<WithdrawalRequestAdmin | null>(null)
  const [withdrawalRequestForm, setWithdrawalRequestForm] = useState({
    action: '',
    paidAmount: '',
    profit: '',
    adminNotes: ''
  })
  const [showCreateNetworkPairModal, setShowCreateNetworkPairModal] = useState(false)
  const [createNetworkPairForm, setCreateNetworkPairForm] = useState({
    fromNetworkId: '',
    toNetworkId: '',
    profitPercent: '',
    isActive: true,
    // Поля для пользовательских сетей
    customFromNetwork: {
      name: '',
      displayName: ''
    },
    customToNetwork: {
      name: '',
      displayName: ''
    },
    useCustomFromNetwork: false,
    useCustomToNetwork: false
  })
  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [networkForm, setNetworkForm] = useState({
    name: '',
    displayName: '',
    isActive: true
  })
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [balanceForm, setBalanceForm] = useState({
    amount: '',
    type: 'ADD',
    description: ''
  })
  const [transactionForm, setTransactionForm] = useState({
    type: 'INCOMING',
    amount: '',
    fromAddress: '',
    toAddress: '',
    description: '',
    blockNumber: '',
    gasUsed: '',
    gasPrice: '',
    fee: ''
  })

  // Функция для обновления данных
  const refreshData = async () => {
    try {
      // Загружаем пользователей
      const usersResponse = await fetch('/api/admin/users', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users)
        console.log('👥 Пользователи загружены:', usersData.users.length)
      } else {
        console.error('❌ Ошибка загрузки пользователей:', usersResponse.status)
      }

      // Загружаем кошельки
      const walletsResponse = await fetch('/api/admin/wallets')
      if (walletsResponse.ok) {
        const walletsData = await walletsResponse.json()
        setWallets(walletsData.wallets)
      }

      // Загружаем токены
      const tokensResponse = await fetch('/api/admin/tokens')
      if (tokensResponse.ok) {
        const tokensData = await tokensResponse.json()
        setTokens(tokensData.tokens)
      }

      // Загружаем запросы кошельков
      const walletRequestsResponse = await fetch('/api/admin/wallet-requests')
      if (walletRequestsResponse.ok) {
        const walletRequestsData = await walletRequestsResponse.json()
        setWalletRequests(walletRequestsData.walletRequests)
      }
    } catch (error) {
      console.error('Ошибка обновления данных:', error)
    }
  }

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Начинаем загрузку данных админки...')
        
        // Загружаем пользователей
        console.log('Загружаем пользователей...')
        const usersResponse = await fetch('/api/admin/users', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        console.log('Ответ пользователей:', usersResponse.status, usersResponse.ok)
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          console.log('Данные пользователей:', usersData)
          setUsers(usersData.users)
        } else {
          const errorData = await usersResponse.json()
          console.error('Ошибка загрузки пользователей:', errorData)
        }

        // Загружаем кошельки
        console.log('Загружаем кошельки...')
        const walletsResponse = await fetch('/api/admin/wallets')
        console.log('Ответ кошельков:', walletsResponse.status, walletsResponse.ok)
        
        if (walletsResponse.ok) {
          const walletsData = await walletsResponse.json()
          console.log('Данные кошельков:', walletsData)
          setWallets(walletsData.wallets)
        } else {
          const errorData = await walletsResponse.json()
          console.error('Ошибка загрузки кошельков:', errorData)
        }

        // Загружаем токены
        console.log('Загружаем токены...')
        const tokensResponse = await fetch('/api/admin/tokens')
        console.log('Ответ токенов:', tokensResponse.status, tokensResponse.ok)
        
        if (tokensResponse.ok) {
          const tokensData = await tokensResponse.json()
          console.log('Данные токенов:', tokensData)
          setTokens(tokensData.tokens)
        } else {
          const errorData = await tokensResponse.json()
          console.error('Ошибка загрузки токенов:', errorData)
        }

        // Загружаем запросы кошельков
        console.log('Загружаем запросы кошельков...')
        const walletRequestsResponse = await fetch('/api/admin/wallet-requests')
        console.log('Ответ запросов кошельков:', walletRequestsResponse.status, walletRequestsResponse.ok)
        
        if (walletRequestsResponse.ok) {
          const walletRequestsData = await walletRequestsResponse.json()
          console.log('Данные запросов кошельков:', walletRequestsData)
          setWalletRequests(walletRequestsData.walletRequests)
        } else {
          const errorData = await walletRequestsResponse.json()
          console.error('Ошибка загрузки запросов кошельков:', errorData)
        }

        // Загружаем сетевые пары
        console.log('Загружаем сетевые пары...')
        const networkPairsResponse = await fetch('/api/admin/network-pairs')
        console.log('Ответ сетевых пар:', networkPairsResponse.status, networkPairsResponse.ok)
        
        if (networkPairsResponse.ok) {
          const networkPairsData = await networkPairsResponse.json()
          console.log('Данные сетевых пар:', networkPairsData)
          setNetworkPairs(networkPairsData.networkPairs || [])
        } else {
          const errorData = await networkPairsResponse.json()
          console.error('Ошибка загрузки сетевых пар:', errorData)
          setNetworkPairs([])
        }

        // Загружаем страховые депозиты
        console.log('Загружаем страховые депозиты...')
        const insuranceDepositsResponse = await fetch('/api/admin/insurance-deposits')
        console.log('Ответ страховых депозитов:', insuranceDepositsResponse.status, insuranceDepositsResponse.ok)
        
        if (insuranceDepositsResponse.ok) {
          const insuranceDepositsData = await insuranceDepositsResponse.json()
          console.log('Данные страховых депозитов:', insuranceDepositsData)
          setInsuranceDeposits(insuranceDepositsData.users || [])
        } else {
          const errorData = await insuranceDepositsResponse.json()
          console.error('Ошибка загрузки страховых депозитов:', errorData)
          setInsuranceDeposits([])
        }

        // Загружаем запросы на страховые взносы
        console.log('Загружаем запросы на страховые взносы...')
        const depositRequestsResponse = await fetch('/api/admin/deposit-requests')
        console.log('Ответ запросов на страховые взносы:', depositRequestsResponse.status, depositRequestsResponse.ok)
        
        if (depositRequestsResponse.ok) {
          const depositRequestsData = await depositRequestsResponse.json()
          console.log('Данные запросов на страховые взносы:', depositRequestsData)
          setDepositRequests(depositRequestsData.requests || [])
        } else {
          const errorData = await depositRequestsResponse.json()
          console.error('Ошибка загрузки запросов на страховые взносы:', errorData)
          setDepositRequests([])
        }

        // Загружаем запросы на вывод
        console.log('Загружаем запросы на вывод...')
        const withdrawalRequestsResponse = await fetch('/api/admin/withdrawal-requests')
        console.log('Ответ запросов на вывод:', withdrawalRequestsResponse.status, withdrawalRequestsResponse.ok)
        
        if (withdrawalRequestsResponse.ok) {
          const withdrawalRequestsData = await withdrawalRequestsResponse.json()
          console.log('Данные запросов на вывод:', withdrawalRequestsData)
          setWithdrawalRequests(withdrawalRequestsData.withdrawalRequests || [])
        } else {
          const errorData = await withdrawalRequestsResponse.json()
          console.error('Ошибка загрузки запросов на вывод:', errorData)
          setWithdrawalRequests([])
        }

        // Загружаем сети
        console.log('Загружаем сети...')
        const networksResponse = await fetch('/api/admin/networks')
        console.log('Ответ сетей:', networksResponse.status, networksResponse.ok)
        
        if (networksResponse.ok) {
          const networksData = await networksResponse.json()
          console.log('Данные сетей:', networksData)
          setNetworks(networksData.networks || [])
        } else {
          const errorData = await networksResponse.json()
          console.error('Ошибка загрузки сетей:', errorData)
          setNetworks([])
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleActivateUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, status: 'ACTIVE' }),
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(prev => prev.map(user => 
          user.id === userId ? data.user : user
        ))
      }
    } catch (error) {
      console.error('Ошибка активации пользователя:', error)
    }
  }

  const handleBlockUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, status: 'BLOCKED' }),
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(prev => prev.map(user => 
          user.id === userId ? data.user : user
        ))
        toast.success('Пользователь заблокирован')
      } else {
        toast.error('Ошибка при блокировке пользователя')
      }
    } catch (error) {
      console.error('Ошибка блокировки пользователя:', error)
      toast.error('Ошибка при блокировке пользователя')
    }
  }

  const handleUnblockUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, status: 'ACTIVE' }),
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(prev => prev.map(user => 
          user.id === userId ? data.user : user
        ))
        toast.success('Пользователь разблокирован')
      } else {
        toast.error('Ошибка при разблокировке пользователя')
      }
    } catch (error) {
      console.error('Ошибка разблокировки пользователя:', error)
      toast.error('Ошибка при разблокировке пользователя')
    }
  }

  const handleViewUserDetails = (user: any) => {
    setSelectedUser(user)
    setShowUserDetailsModal(true)
  }

  const handleCreateToken = async () => {
    try {
      const response = await fetch('/api/admin/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTokens(prev => [data.token, ...prev])
      }
    } catch (error) {
      console.error('Ошибка создания токена:', error)
    }
  }

  const handleAddWallet = (user: User) => {
    setSelectedUser(user)
    setWalletTypeSelection('select')
    setWalletForm({ 
      address: '', 
      network: 'TRC20', 
      type: 'RECEIVE',
      minAmount: '',
      maxAmount: '',
      dailyLimit: ''
    })
    setShowAddWalletModal(true)
  }

  const handleSubmitWallet = async () => {
    if (!selectedUser || !walletForm.network || !walletForm.type) {
      return
    }

    // Для кошельков приема нужен адрес
    if (walletForm.type === 'RECEIVE' && !walletForm.address) {
      return
    }

    // Для кошельков пополнения нужны лимиты
    if (walletForm.type === 'DEPOSIT' && (!walletForm.minAmount || !walletForm.maxAmount || !walletForm.dailyLimit)) {
      return
    }

    try {
      const response = await fetch('/api/admin/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          address: walletForm.type === 'RECEIVE' ? walletForm.address : null,
          network: walletForm.network,
          type: walletForm.type,
          minAmount: walletForm.type === 'DEPOSIT' ? parseFloat(walletForm.minAmount) : null,
          maxAmount: walletForm.type === 'DEPOSIT' ? parseFloat(walletForm.maxAmount) : null,
          dailyLimit: walletForm.type === 'DEPOSIT' ? parseFloat(walletForm.dailyLimit) : null
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Обновляем данные после добавления кошелька
        await refreshData()
        setShowAddWalletModal(false)
        setSelectedUser(null)
        setWalletTypeSelection('select')
        setWalletForm({ 
          address: '', 
          network: 'TRC20', 
          type: 'RECEIVE',
          minAmount: '',
          maxAmount: '',
          dailyLimit: ''
        })
        alert('Кошелек успешно добавлен!')
      } else {
        const errorData = await response.json()
        alert(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Ошибка добавления кошелька:', error)
    }
  }

  const handleManageBalance = (wallet: Wallet) => {
    setSelectedWallet(wallet)
    setBalanceForm({ amount: '', type: 'ADD', description: '' })
    setShowBalanceModal(true)
  }

  const handleSubmitBalance = async () => {
    if (!selectedWallet || !balanceForm.amount) {
      return
    }

    try {
      const response = await fetch('/api/admin/users/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedWallet.userId,
          walletId: selectedWallet.id,
          amount: parseFloat(balanceForm.amount),
          type: balanceForm.type,
          description: balanceForm.description
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Обновляем данные после изменения баланса
        await refreshData()
        setShowBalanceModal(false)
        setSelectedWallet(null)
        setBalanceForm({ amount: '', type: 'ADD', description: '' })
        alert(data.message)
      } else {
        const errorData = await response.json()
        alert(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Ошибка обновления баланса:', error)
    }
  }

  const handleLogTransaction = (wallet: Wallet) => {
    setSelectedWallet(wallet)
    setTransactionForm({
      type: 'INCOMING',
      amount: '',
      fromAddress: '',
      toAddress: wallet.address || '',
      description: '',
      blockNumber: '',
      gasUsed: '',
      gasPrice: '',
      fee: ''
    })
    setShowTransactionModal(true)
  }

  const handleWalletSettings = (wallet: Wallet) => {
    setSelectedWallet(wallet)
    setShowWalletSettingsModal(true)
  }

  const handleSubmitTransaction = async () => {
    if (!selectedWallet || !transactionForm.amount) {
      return
    }

    try {
      const response = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId: selectedWallet.id,
          type: transactionForm.type,
          amount: parseFloat(transactionForm.amount),
          fromAddress: transactionForm.fromAddress || null,
          toAddress: transactionForm.toAddress || null,
          description: transactionForm.description,
          blockNumber: transactionForm.blockNumber || null,
          gasUsed: transactionForm.gasUsed || null,
          gasPrice: transactionForm.gasPrice || null,
          fee: parseFloat(transactionForm.fee) || 0
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Обновляем данные после создания транзакции
        await refreshData()
        setShowTransactionModal(false)
        setSelectedWallet(null)
        setTransactionForm({
          type: 'INCOMING',
          amount: '',
          fromAddress: '',
          toAddress: '',
          description: '',
          blockNumber: '',
          gasUsed: '',
          gasPrice: '',
          fee: ''
        })
        alert(data.message)
      } else {
        const errorData = await response.json()
        alert(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Ошибка создания транзакции:', error)
    }
  }

  const handleWalletRequestAction = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
    const request = walletRequests.find(r => r.id === requestId)
    if (!request) return

    if (action === 'APPROVED' && request.type === 'DEPOSIT') {
      // Для кошельков пополнения показываем модальное окно для ввода адреса
      setSelectedWalletRequest(request)
      setApproveWalletAddress('')
      setShowApproveModal(true)
    } else {
      // Для кошельков приема или отклонения обрабатываем сразу
      await processWalletRequest(requestId, action, null)
    }
  }

  const processWalletRequest = async (requestId: string, action: 'APPROVED' | 'REJECTED', walletAddress?: string | null) => {
    try {
      const response = await fetch('/api/admin/wallet-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action,
          walletAddress
        }),
      })

      if (response.ok) {
        const data = await response.json()
        await refreshData()
        alert(data.message)
        setShowApproveModal(false)
        setSelectedWalletRequest(null)
        setApproveWalletAddress('')
      } else {
        const errorData = await response.json()
        alert(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Ошибка обработки запроса:', error)
    }
  }

  const handleApproveWithAddress = async () => {
    if (!selectedWalletRequest || !approveWalletAddress.trim()) {
      alert('Введите адрес кошелька')
      return
    }

    await processWalletRequest(selectedWalletRequest.id, 'APPROVED', approveWalletAddress)
  }

  const handleEditNetworkPair = (pair: NetworkPair) => {
    setSelectedNetworkPair(pair)
    setNetworkPairForm({
      profitPercent: pair.profitPercent.toString(),
      isActive: pair.isActive
    })
    setShowEditNetworkPairModal(true)
  }

  const handleSubmitNetworkPair = async () => {
    if (!selectedNetworkPair || !networkPairForm.profitPercent) {
      return
    }

    try {
      const response = await fetch('/api/admin/network-pairs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedNetworkPair.id,
          profitPercent: parseFloat(networkPairForm.profitPercent),
          isActive: networkPairForm.isActive
        }),
      })

      if (response.ok) {
        // Обновляем локальное состояние
        setNetworkPairs(prev => prev.map(pair => 
          pair.id === selectedNetworkPair.id 
            ? { ...pair, profitPercent: parseFloat(networkPairForm.profitPercent), isActive: networkPairForm.isActive }
            : pair
        ))
        setShowEditNetworkPairModal(false)
        setSelectedNetworkPair(null)
      } else {
        const errorData = await response.json()
        alert(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Ошибка обновления сетевой пары:', error)
      alert('Ошибка обновления сетевой пары')
    }
  }

  const handleEditInsuranceDeposit = (user: UserWithInsuranceDeposit) => {
    setSelectedInsuranceUser(user)
    setInsuranceDepositForm({
      amount: user.insuranceDepositAmount?.toString() || ''
    })
    setShowInsuranceDepositModal(true)
  }


  const handleAssignWallet = async (requestId: string) => {
    const walletAddress = prompt('Введите адрес кошелька админа для пополнения:')
    if (!walletAddress) return

    try {
      const response = await fetch('/api/admin/deposit-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action: 'assign_wallet',
          adminWalletAddress: walletAddress
        }),
      })

      if (response.ok) {
        alert('Кошелек назначен успешно!')
        // Перезагружаем данные
        window.location.reload()
      } else {
        const error = await response.json()
        alert('Ошибка: ' + error.error)
      }
    } catch (error) {
      console.error('Ошибка назначения кошелька:', error)
      alert('Произошла ошибка при назначении кошелька')
    }
  }

  const handleSetDepositAmount = async (requestId: string) => {
    const amount = prompt('Введите сумму страхового взноса (USDT):')
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert('Неверная сумма')
      return
    }

    try {
      const response = await fetch('/api/admin/deposit-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action: 'set_amount',
          amount: parseFloat(amount)
        }),
      })

      if (response.ok) {
        alert('Сумма страхового взноса установлена успешно!')
        // Перезагружаем данные
        window.location.reload()
      } else {
        const error = await response.json()
        alert('Ошибка: ' + error.error)
      }
    } catch (error) {
      console.error('Ошибка установки суммы:', error)
      alert('Произошла ошибка при установке суммы')
    }
  }

  const handleRejectDepositRequest = async (requestId: string) => {
    if (!confirm('Вы уверены, что хотите отклонить этот запрос?')) return

    try {
      const response = await fetch('/api/admin/deposit-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action: 'reject'
        }),
      })

      if (response.ok) {
        alert('Запрос отклонен')
        // Перезагружаем данные
        window.location.reload()
      } else {
        const error = await response.json()
        alert('Ошибка: ' + error.error)
      }
    } catch (error) {
      console.error('Ошибка отклонения запроса:', error)
      alert('Произошла ошибка при отклонении запроса')
    }
  }

  const handleCompleteDepositRequest = async (requestId: string) => {
    if (!confirm('Вы уверены, что хотите начислить баланс на кошелек пользователя и завершить запрос?')) return

    try {
      const response = await fetch('/api/admin/deposit-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action: 'complete'
        }),
      })

      if (response.ok) {
        alert('Баланс начислен, запрос завершен')
        // Перезагружаем данные
        window.location.reload()
      } else {
        const error = await response.json()
        alert('Ошибка: ' + error.error)
      }
    } catch (error) {
      console.error('Ошибка начисления баланса:', error)
      alert('Произошла ошибка при начислении баланса')
    }
  }

  const handleSubmitInsuranceDeposit = async () => {
    if (!selectedInsuranceUser) {
      return
    }

    try {
      const response = await fetch('/api/admin/insurance-deposits', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedInsuranceUser.id,
          insuranceDepositAmount: insuranceDepositForm.amount ? parseFloat(insuranceDepositForm.amount) : null
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Обновляем локальное состояние
        setInsuranceDeposits(prev => prev.map(user => 
          user.id === selectedInsuranceUser.id 
            ? { ...user, insuranceDepositAmount: data.user.insuranceDepositAmount }
            : user
        ))
        setShowInsuranceDepositModal(false)
        setSelectedInsuranceUser(null)
        setInsuranceDepositForm({ amount: '' })
        toast.success(data.message)
      } else {
        const errorData = await response.json()
        toast.error(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Ошибка обновления страхового депозита:', error)
      toast.error('Ошибка обновления страхового депозита')
    }
  }

  const handleManageWithdrawalRequest = (request: WithdrawalRequestAdmin) => {
    setSelectedWithdrawalRequest(request)
    setWithdrawalRequestForm({
      action: '',
      paidAmount: request.paidAmount.toString(),
      profit: request.profit?.toString() || '',
      adminNotes: request.adminNotes || ''
    })
    setShowWithdrawalRequestModal(true)
  }

  const handleSubmitWithdrawalRequest = async () => {
    if (!selectedWithdrawalRequest || !withdrawalRequestForm.action) {
      return
    }

    console.log('Submitting withdrawal request:', {
      requestId: selectedWithdrawalRequest.id,
      action: withdrawalRequestForm.action,
      paidAmount: withdrawalRequestForm.paidAmount,
      profit: withdrawalRequestForm.profit,
      adminNotes: withdrawalRequestForm.adminNotes
    })

    try {
      const response = await fetch('/api/admin/withdrawal-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: selectedWithdrawalRequest.id,
          action: withdrawalRequestForm.action,
          paidAmount: withdrawalRequestForm.paidAmount ? parseFloat(withdrawalRequestForm.paidAmount) : undefined,
          profit: withdrawalRequestForm.profit ? parseFloat(withdrawalRequestForm.profit) : undefined,
          adminNotes: withdrawalRequestForm.adminNotes
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Обновляем локальное состояние
        setWithdrawalRequests(prev => prev.map(request => 
          request.id === selectedWithdrawalRequest.id 
            ? data.withdrawalRequest
            : request
        ))
        setShowWithdrawalRequestModal(false)
        setSelectedWithdrawalRequest(null)
        setWithdrawalRequestForm({ action: '', paidAmount: '', profit: '', adminNotes: '' })
        toast.success(data.message)
      } else {
        const errorData = await response.json()
        toast.error(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Ошибка обновления запроса на вывод:', error)
      toast.error('Ошибка обновления запроса на вывод')
    }
  }

  const handleCreateNetwork = () => {
    setSelectedNetwork(null)
    setNetworkForm({
      name: '',
      displayName: '',
      isActive: true
    })
    setShowNetworkModal(true)
  }

  const handleEditNetwork = (network: Network) => {
    setSelectedNetwork(network)
    setNetworkForm({
      name: network.name,
      displayName: network.displayName,
      isActive: network.isActive
    })
    setShowNetworkModal(true)
  }

  const handleSubmitNetwork = async () => {
    if (!networkForm.name || !networkForm.displayName) {
      toast.error('Заполните все поля')
      return
    }

    try {
      const url = selectedNetwork ? '/api/admin/networks' : '/api/admin/networks'
      const method = selectedNetwork ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(selectedNetwork && { id: selectedNetwork.id }),
          name: networkForm.name,
          displayName: networkForm.displayName,
          isActive: networkForm.isActive
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (selectedNetwork) {
          // Обновляем существующую сеть
          setNetworks(prev => prev.map(network => 
            network.id === selectedNetwork.id 
              ? data.network
              : network
          ))
        } else {
          // Добавляем новую сеть
          setNetworks(prev => [data.network, ...prev])
        }
        setShowNetworkModal(false)
        setSelectedNetwork(null)
        setNetworkForm({ name: '', displayName: '', isActive: true })
        toast.success(data.message)
      } else {
        const errorData = await response.json()
        toast.error(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Ошибка сохранения сети:', error)
      toast.error('Ошибка сохранения сети')
    }
  }

  const handleDeleteNetwork = async (networkId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту сеть?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/networks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: networkId }),
      })

      if (response.ok) {
        const data = await response.json()
        setNetworks(prev => prev.filter(network => network.id !== networkId))
        toast.success(data.message)
      } else {
        const errorData = await response.json()
        toast.error(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Ошибка удаления сети:', error)
      toast.error('Ошибка удаления сети')
    }
  }

  const handleCreateNetworkPair = () => {
    setCreateNetworkPairForm({
      fromNetworkId: '',
      toNetworkId: '',
      profitPercent: '',
      isActive: true,
      customFromNetwork: { name: '', displayName: '' },
      customToNetwork: { name: '', displayName: '' },
      useCustomFromNetwork: false,
      useCustomToNetwork: false
    })
    setShowCreateNetworkPairModal(true)
  }

  const handleSubmitCreateNetworkPair = async () => {
    // Проверяем обязательные поля
    if (!createNetworkPairForm.profitPercent) {
      toast.error('Заполните доходность')
      return
    }

    // Проверяем, что выбраны или созданы обе сети
    const fromNetworkId = createNetworkPairForm.useCustomFromNetwork ? null : createNetworkPairForm.fromNetworkId
    const toNetworkId = createNetworkPairForm.useCustomToNetwork ? null : createNetworkPairForm.toNetworkId

    if (!fromNetworkId && !createNetworkPairForm.useCustomFromNetwork) {
      toast.error('Выберите или создайте исходную сеть')
      return
    }

    if (!toNetworkId && !createNetworkPairForm.useCustomToNetwork) {
      toast.error('Выберите или создайте целевую сеть')
      return
    }

    // Проверяем пользовательские сети
    if (createNetworkPairForm.useCustomFromNetwork && (!createNetworkPairForm.customFromNetwork.name || !createNetworkPairForm.customFromNetwork.displayName)) {
      toast.error('Заполните данные для пользовательской исходной сети')
      return
    }

    if (createNetworkPairForm.useCustomToNetwork && (!createNetworkPairForm.customToNetwork.name || !createNetworkPairForm.customToNetwork.displayName)) {
      toast.error('Заполните данные для пользовательской целевой сети')
      return
    }

    try {
      let finalFromNetworkId = fromNetworkId
      let finalToNetworkId = toNetworkId

      // Создаем пользовательские сети если нужно
      if (createNetworkPairForm.useCustomFromNetwork) {
        const networkResponse = await fetch('/api/admin/networks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: createNetworkPairForm.customFromNetwork.name,
            displayName: createNetworkPairForm.customFromNetwork.displayName
          }),
        })

        if (networkResponse.ok) {
          const networkData = await networkResponse.json()
          finalFromNetworkId = networkData.network.id
          setNetworks(prev => [networkData.network, ...prev])
        } else {
          const errorData = await networkResponse.json()
          toast.error(`Ошибка создания исходной сети: ${errorData.error}`)
          return
        }
      }

      if (createNetworkPairForm.useCustomToNetwork) {
        const networkResponse = await fetch('/api/admin/networks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: createNetworkPairForm.customToNetwork.name,
            displayName: createNetworkPairForm.customToNetwork.displayName
          }),
        })

        if (networkResponse.ok) {
          const networkData = await networkResponse.json()
          finalToNetworkId = networkData.network.id
          setNetworks(prev => [networkData.network, ...prev])
        } else {
          const errorData = await networkResponse.json()
          toast.error(`Ошибка создания целевой сети: ${errorData.error}`)
          return
        }
      }

      // Проверяем, что сети не одинаковые
      if (finalFromNetworkId === finalToNetworkId) {
        toast.error('Исходная и целевая сети не могут быть одинаковыми')
        return
      }

      // Создаем сетевую пару
      const response = await fetch('/api/admin/network-pairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromNetworkId: finalFromNetworkId,
          toNetworkId: finalToNetworkId,
          profitPercent: parseFloat(createNetworkPairForm.profitPercent),
          isActive: createNetworkPairForm.isActive
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setNetworkPairs(prev => [data.networkPair, ...prev])
        setShowCreateNetworkPairModal(false)
        setCreateNetworkPairForm({
          fromNetworkId: '',
          toNetworkId: '',
          profitPercent: '',
          isActive: true,
          customFromNetwork: { name: '', displayName: '' },
          customToNetwork: { name: '', displayName: '' },
          useCustomFromNetwork: false,
          useCustomToNetwork: false
        })
        toast.success(data.message)
      } else {
        const errorData = await response.json()
        toast.error(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Ошибка создания сетевой пары:', error)
      toast.error('Ошибка создания сетевой пары')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'BLOCKED': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'INACTIVE': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Активен'
      case 'PENDING': return 'Ожидает активации'
      case 'BLOCKED': return 'Заблокирован'
      case 'INACTIVE': return 'Неактивен'
      default: return 'Неизвестно'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl gradient-text">Загрузка админ панели...</div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text mb-2">Админ панель</h1>
          <p className="text-gray-200 text-sm sm:text-base lg:text-lg">Управление пользователями, кошельками и токенами</p>
        </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="card-stat">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Всего пользователей</CardTitle>
            <Users className="h-4 w-4 text-purple-400 icon-glow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white neon-text">{users.length}</div>
            <p className="text-xs text-gray-400">
              {users.filter(u => u.status === 'ACTIVE').length} активных
            </p>
          </CardContent>
        </Card>

        <Card className="card-stat">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Ожидают активации</CardTitle>
            <UserCheck className="h-4 w-4 text-yellow-400 icon-glow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white neon-text">
              {users.filter(u => u.status === 'PENDING').length}
            </div>
            <p className="text-xs text-gray-400">Новых регистраций</p>
          </CardContent>
        </Card>

        <Card className="card-stat">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Активные кошельки</CardTitle>
            <Wallet className="h-4 w-4 text-green-400 icon-glow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white neon-text">
              {wallets.filter(w => w.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-gray-400">Назначенных кошельков</p>
          </CardContent>
        </Card>

        <Card className="card-stat">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Доступные токены</CardTitle>
            <Key className="h-4 w-4 text-blue-400 icon-glow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white neon-text">
              {tokens.length}
            </div>
            <p className="text-xs text-gray-400">Для регистрации</p>
          </CardContent>
        </Card>
      </div>

      {/* Навигация по разделам */}
      <div className="flex flex-wrap gap-2 border-b border-gray-700">
        {[
          { id: 'users', label: 'Пользователи', icon: Users },
          { id: 'wallets', label: 'Кошельки', icon: Wallet },
          { id: 'tokens', label: 'Токены', icon: Key },
          { id: 'wallet-requests', label: 'Запросы кошельков', icon: UserCheck },
          { id: 'network-pairs', label: 'Сетевые пары', icon: Network },
          { id: 'insurance-deposits', label: 'Страховые депозиты', icon: Shield },
          { id: 'withdrawal-requests', label: 'Запросы на вывод', icon: DollarSign },
          { id: 'metrics', label: 'Метрики', icon: BarChart3 },
          { id: 'stats', label: 'Статистика', icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-500 text-purple-400 neon-text'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Содержимое разделов */}
      {activeTab === 'users' && (
        <Card className="neon-card">
          <CardHeader>
            <CardTitle className="gradient-text">Управление пользователями</CardTitle>
            <CardDescription className="text-gray-300">
              Активация и блокировка пользователей
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-medium text-white">{user.email}</div>
                      <div className="text-sm text-gray-400">{user.telegram}</div>
                      <div className="text-xs text-gray-500">
                        Зарегистрирован: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <Badge className={getStatusColor(user.status)}>
                      {getStatusText(user.status)}
                    </Badge>
                    {user.status === 'PENDING' && (
                      <Button 
                        onClick={() => handleActivateUser(user.id)}
                        className="neon-button w-full sm:w-auto"
                        size="sm"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Активировать
                      </Button>
                    )}
                    {user.status === 'ACTIVE' && (
                      <Button 
                        onClick={() => handleBlockUser(user.id)}
                        variant="outline"
                        className="neon-input text-white w-full sm:w-auto"
                        size="sm"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Заблокировать
                      </Button>
                    )}
                    {user.status === 'BLOCKED' && (
                      <Button 
                        onClick={() => handleUnblockUser(user.id)}
                        variant="outline"
                        className="neon-input text-white w-full sm:w-auto"
                        size="sm"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Разблокировать
                      </Button>
                    )}
                    {user.status === 'ACTIVE' && (
                      <Button 
                        onClick={() => handleAddWallet(user)}
                        className="neon-button w-full sm:w-auto"
                        size="sm"
                      >
                        <Wallet className="h-4 w-4 mr-1" />
                        Добавить кошелек
                      </Button>
                    )}
                    <Button 
                      onClick={() => handleViewUserDetails(user)}
                      variant="outline" 
                      className="neon-input text-white w-full sm:w-auto" 
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Детали
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'wallets' && (
        <Card className="neon-card">
          <CardHeader>
            <CardTitle className="gradient-text">Управление кошельками</CardTitle>
            <CardDescription className="text-gray-300">
              Назначение кошельков пользователям
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Назначенные кошельки</h3>
                <Button className="neon-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить кошелек
                </Button>
              </div>
              {wallets.map(wallet => (
                <div key={wallet.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3 sm:space-y-0">
                  <div>
                    <div className="font-medium text-white">{wallet.address || 'Не назначен'}</div>
                    <div className="text-sm text-gray-400">Сеть: {wallet.network}</div>
                    {wallet.user && (
                      <div className="text-xs text-gray-500">
                        Пользователь: {wallet.user.email} {wallet.user.telegram && `(${wallet.user.telegram})`}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Баланс</div>
                      <div className="font-bold text-white">{wallet.balance} USDT</div>
                    </div>
                    <Badge className={getStatusColor(wallet.status)}>
                      {wallet.status === 'ACTIVE' ? 'Активен' : 'Неактивен'}
                    </Badge>
                    <Button 
                      onClick={() => handleManageBalance(wallet)}
                      className="neon-button w-full sm:w-auto" 
                      size="sm"
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Баланс
                    </Button>
                    <Button 
                      onClick={() => handleLogTransaction(wallet)}
                      variant="outline" 
                      className="neon-input text-white w-full sm:w-auto" 
                      size="sm"
                    >
                      <Activity className="h-4 w-4 mr-1" />
                      Транзакция
                    </Button>
                    <Button 
                      onClick={() => handleWalletSettings(wallet)}
                      variant="outline" 
                      className="neon-input text-white w-full sm:w-auto" 
                      size="sm"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Настроить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'tokens' && (
        <Card className="neon-card">
          <CardHeader>
            <CardTitle className="gradient-text">Токены регистрации</CardTitle>
            <CardDescription className="text-gray-300">
              Создание и управление токенами для регистрации
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Доступные токены</h3>
                <Button onClick={handleCreateToken} className="neon-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Создать токен
                </Button>
              </div>
              {tokens.map(token => (
                <div key={token.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3 sm:space-y-0">
                  <div>
                    <div className="font-mono text-white">{token.token}</div>
                    <div className="text-sm text-gray-400">Создан: {new Date(token.createdAt).toLocaleDateString()}</div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 w-full sm:w-auto text-center">
                    Доступен
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'wallet-requests' && (
        <Card className="neon-card">
          <CardHeader>
            <CardTitle className="gradient-text">Запросы кошельков</CardTitle>
            <CardDescription className="text-gray-300">
              Обработка запросов пользователей на добавление кошельков
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Ожидающие запросы</h3>
                <div className="text-sm text-gray-400">
                  Всего: {walletRequests.length} | Ожидают: {walletRequests.filter(r => r.status === 'PENDING').length}
                </div>
              </div>
              
              {walletRequests.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Нет запросов кошельков</p>
                  <p className="text-sm text-gray-500">Запросы от пользователей будут отображаться здесь</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {walletRequests.map(request => (
                    <div key={request.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${
                              request.status === 'PENDING' ? 'bg-yellow-500' :
                              request.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <div>
                              <p className="font-medium text-white">{request.address}</p>
                              <p className="text-sm text-gray-400">
                                {request.network} • {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="ml-6 space-y-2">
                            <div className="text-sm text-gray-300">
                              <span className="font-medium">Пользователь:</span> {request.user.email}
                              {request.user.telegram && (
                                <span className="ml-2 text-gray-400">({request.user.telegram})</span>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-300">
                              <span className="font-medium">Тип кошелька:</span> 
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                request.type === 'DEPOSIT' 
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
                              }`}>
                                {request.type === 'DEPOSIT' ? 'Для пополнения' : 'Для приема'}
                              </span>
                            </div>
                            
                            {request.description && (
                              <div className="text-sm text-gray-300">
                                <span className="font-medium">Описание:</span> {request.description}
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(request.status)}>
                                {getStatusText(request.status)}
                              </Badge>
                              <Badge className={getStatusColor(request.user.status)}>
                                {getStatusText(request.user.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {request.status === 'PENDING' && (
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:ml-4">
                            <Button
                              onClick={() => handleWalletRequestAction(request.id, 'APPROVED')}
                              className="neon-button w-full sm:w-auto"
                              size="sm"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Одобрить
                            </Button>
                            <Button
                              onClick={() => handleWalletRequestAction(request.id, 'REJECTED')}
                              variant="outline"
                              className="neon-input text-white w-full sm:w-auto"
                              size="sm"
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Отклонить
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'network-pairs' && (
        <Card className="neon-card">
          <CardHeader>
            <CardTitle className="gradient-text">Сетевые пары</CardTitle>
            <CardDescription className="text-gray-300">
              Управление доходностью и статусом сетевых пар
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Доступные связки сетей</h3>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-400">
                    Всего: {networkPairs.length} | Активных: {networkPairs.filter(p => p.isActive).length}
                  </div>
                  <Button onClick={handleCreateNetworkPair} className="neon-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить пару
                  </Button>
                </div>
              </div>
              
              {networkPairs.length === 0 ? (
                <div className="text-center py-8">
                  <Network className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Нет сетевых пар</p>
                  <p className="text-sm text-gray-500">Сетевые пары будут отображаться здесь</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {networkPairs.map((pair) => (
                    <div key={pair.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3 md:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-blue-400 border-blue-400">
                              {pair.fromNetwork.displayName}
                            </Badge>
                            <span className="text-gray-400">↔</span>
                            <Badge variant="outline" className="text-green-400 border-green-400">
                              {pair.toNetwork.displayName}
                            </Badge>
                          </div>
                          <Badge variant={pair.isActive ? "default" : "secondary"} className={pair.isActive ? "bg-green-600" : "bg-gray-600"}>
                            {pair.isActive ? "Активна" : "Неактивна"}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <span className="text-sm text-gray-400">Доходность: </span>
                          <span className="text-lg font-semibold text-green-400">{pair.profitPercent}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditNetworkPair(pair)}
                          className="w-full md:w-auto"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Редактировать
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'insurance-deposits' && (
        <div className="space-y-6">
          {/* Запросы на страховые взносы */}
          <Card className="neon-card">
            <CardHeader>
              <CardTitle className="gradient-text">Запросы на страховые взносы</CardTitle>
              <CardDescription className="text-gray-300">
                Новые запросы от пользователей на пополнение страхового баланса
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {depositRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Нет запросов на страховые взносы</p>
                    <p className="text-sm text-gray-500">Новые запросы будут отображаться здесь</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {depositRequests.map((request) => (
                      <div key={request.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3 md:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${
                              request.status === 'PENDING' ? 'bg-yellow-500' :
                              request.status === 'PROCESSING' ? 'bg-blue-500' :
                              request.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <div>
                              <p className="font-medium text-white">{request.user.email}</p>
                              <p className="text-sm text-gray-400">
                                {request.user.telegram && `@${request.user.telegram} • `}
                                {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="ml-6 space-y-2">
                            <div className="text-sm text-gray-300">
                              <span className="text-gray-400">Сеть:</span> {request.fromNetwork}
                            </div>
                            <div className="text-sm text-gray-300">
                              <span className="text-gray-400">Статус:</span> 
                              <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                                request.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                request.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-400' :
                                request.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {request.status === 'PENDING' ? 'Ожидает' :
                                 request.status === 'PROCESSING' ? 'В обработке' :
                                 request.status === 'COMPLETED' ? 'Завершен' : 'Отклонен'}
                              </span>
                            </div>
                            {request.adminWalletAddress && (
                              <div className="text-sm text-gray-300">
                                <span className="text-gray-400">Кошелек админа:</span> {request.adminWalletAddress}
                              </div>
                            )}
                            {request.amount > 0 && (
                              <div className="text-sm text-gray-300">
                                <span className="text-gray-400">Сумма:</span> {request.amount} USDT
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          {request.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAssignWallet(request.id)}
                                className="neon-button"
                              >
                                Назначить кошелек
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectDepositRequest(request.id)}
                                className="text-red-400 border-red-400 hover:bg-red-400/10"
                              >
                                Отклонить
                              </Button>
                            </>
                          )}
                          {request.status === 'PROCESSING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSetDepositAmount(request.id)}
                                className="neon-button"
                              >
                                Установить сумму
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteDepositRequest(request.id)}
                                className="text-green-400 border-green-400 hover:bg-green-400/10"
                              >
                                Начислить баланс
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Пользователи со страховыми депозитами */}
          <Card className="neon-card">
            <CardHeader>
              <CardTitle className="gradient-text">Пользователи со страховыми депозитами</CardTitle>
              <CardDescription className="text-gray-300">
                Управление страховыми депозитами пользователей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-white">Пользователи со страховыми депозитами</h3>
                  <div className="text-sm text-gray-400">
                    Всего: {insuranceDeposits.length} | С депозитом: {insuranceDeposits.filter(u => u.insuranceDepositAmount && u.insuranceDepositAmount > 0).length}
                  </div>
                </div>
              
              {insuranceDeposits.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Нет пользователей</p>
                  <p className="text-sm text-gray-500">Пользователи будут отображаться здесь</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insuranceDeposits.map((user) => {
                    const isDepositPaid = user.insuranceDepositAmount 
                      ? user.insuranceDepositPaid >= user.insuranceDepositAmount 
                      : true
                    const remainingAmount = user.insuranceDepositAmount 
                      ? Math.max(0, user.insuranceDepositAmount - user.insuranceDepositPaid)
                      : 0

                    return (
                      <div key={user.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3 md:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${
                              isDepositPaid ? 'bg-green-500' : 'bg-orange-500'
                            }`} />
                            <div>
                              <p className="font-medium text-white">{user.email}</p>
                              <p className="text-sm text-gray-400">
                                {user.telegram && `@${user.telegram} • `}
                                {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="ml-6 space-y-2">
                            <div className="text-sm text-gray-300">
                              <span className="font-medium">Статус:</span> 
                              <Badge className={getStatusColor(user.status)}>
                                {getStatusText(user.status)}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-300">
                              <span className="font-medium">Страховой депозит:</span> 
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                isDepositPaid 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              }`}>
                                {isDepositPaid ? 'Оплачен' : 'Не оплачен'}
                              </span>
                            </div>

                            {user.insuranceDepositAmount && user.insuranceDepositAmount > 0 && (
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-400">Требуется:</span>
                                  <div className="font-semibold text-white">{user.insuranceDepositAmount} USDT</div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Оплачено:</span>
                                  <div className="font-semibold text-green-400">{user.insuranceDepositPaid} USDT</div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Остаток:</span>
                                  <div className="font-semibold text-orange-400">{remainingAmount} USDT</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditInsuranceDeposit(user)}
                            className="w-full md:w-auto"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Редактировать
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {activeTab === 'withdrawal-requests' && (
        <Card className="neon-card">
          <CardHeader>
            <CardTitle className="gradient-text">Запросы на вывод</CardTitle>
            <CardDescription className="text-gray-300">
              Управление запросами пользователей на вывод средств
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Запросы на вывод средств</h3>
                <div className="text-sm text-gray-400">
                  Всего: {withdrawalRequests.length} | Ожидают: {withdrawalRequests.filter(r => r.status === 'PENDING').length} | В работе: {withdrawalRequests.filter(r => r.status === 'IN_WORK').length}
                </div>
              </div>
              
              {withdrawalRequests.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Нет запросов на вывод</p>
                  <p className="text-sm text-gray-500">Запросы от пользователей будут отображаться здесь</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawalRequests.map((request) => (
                    <div key={request.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${
                              request.status === 'PENDING' ? 'bg-yellow-500' :
                              request.status === 'IN_WORK' ? 'bg-blue-500' :
                              request.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <div>
                              <p className="font-medium text-white">{request.wallet.address}</p>
                              <p className="text-sm text-gray-400">
                                {request.wallet.network} • {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="ml-6 space-y-2">
                            <div className="text-sm text-gray-300">
                              <span className="font-medium">Пользователь:</span> {request.user.email}
                              {request.user.telegram && (
                                <span className="ml-2 text-gray-400">({request.user.telegram})</span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Сумма запроса:</span>
                                <div className="font-semibold text-white">{request.amount} USDT</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Оплачено:</span>
                                <div className="font-semibold text-green-400">{request.paidAmount} USDT</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Остаток:</span>
                                <div className="font-semibold text-orange-400">{request.remainingAmount} USDT</div>
                              </div>
                              {request.profit && (
                                <div>
                                  <span className="text-gray-400">Доход:</span>
                                  <div className="font-semibold text-purple-400">{request.profit} USDT</div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(request.status)}>
                                {request.status === 'PENDING' ? 'Ожидает' :
                                 request.status === 'IN_WORK' ? 'В работе' :
                                 request.status === 'COMPLETED' ? 'Завершен' : 'Отклонен'}
                              </Badge>
                              <Badge className={getStatusColor(request.user.status)}>
                                {getStatusText(request.user.status)}
                              </Badge>
                            </div>

                            {request.adminNotes && (
                              <div className="text-sm text-gray-300">
                                <span className="font-medium">Заметки админа:</span> {request.adminNotes}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-2 lg:ml-4">
                          <Button
                            onClick={() => handleManageWithdrawalRequest(request)}
                            className="neon-button w-full lg:w-auto"
                            size="sm"
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Управлять
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'networks' && (
        <Card className="neon-card">
          <CardHeader>
            <CardTitle className="gradient-text">Управление сетями</CardTitle>
            <CardDescription className="text-gray-300">
              Добавление и редактирование сетей для создания сетевых пар
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Доступные сети</h3>
                <Button onClick={handleCreateNetwork} className="neon-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить сеть
                </Button>
              </div>
              
              {networks.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Сети не найдены</p>
                  <p className="text-sm text-gray-500">Добавьте первую сеть для создания сетевых пар</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {networks.map((network) => (
                    <div key={network.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${network.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                          <span className="text-white font-medium">{network.displayName}</span>
                          <span className="text-gray-400 text-sm">({network.name})</span>
                        </div>
                        <Badge className={network.isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                          {network.isActive ? 'Активна' : 'Неактивна'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleEditNetwork(network)}
                          className="neon-button"
                          size="sm"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Редактировать
                        </Button>
                        <Button
                          onClick={() => handleDeleteNetwork(network.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <Card className="neon-card">
            <CardHeader>
              <CardTitle className="gradient-text">Управление метриками пользователей</CardTitle>
              <CardDescription className="text-gray-300">
                Ручное управление балансами и транзакциями пользователей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Кошельки с балансами</h3>
                  <div className="grid gap-4">
                    {wallets.map(wallet => (
                      <div key={wallet.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3 sm:space-y-0">
                        <div>
                          <div className="font-medium text-white">{wallet.address || 'Не назначен'}</div>
                          <div className="text-sm text-gray-400">Сеть: {wallet.network}</div>
                          {wallet.user && (
                            <div className="text-xs text-gray-500">
                              Пользователь: {wallet.user.email} {wallet.user.telegram && `(${wallet.user.telegram})`}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Баланс</div>
                            <div className="font-bold text-white text-lg">{wallet.balance} USDT</div>
                          </div>
                          <Button 
                            onClick={() => handleManageBalance(wallet)}
                            className="neon-button w-full sm:w-auto" 
                            size="sm"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Управлять балансом
                          </Button>
                          <Button 
                            onClick={() => handleLogTransaction(wallet)}
                            variant="outline" 
                            className="neon-input text-white w-full sm:w-auto" 
                            size="sm"
                          >
                            <Activity className="h-4 w-4 mr-1" />
                            Записать транзакцию
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="neon-card">
            <CardHeader>
              <CardTitle className="gradient-text">Статистика пользователей</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Всего пользователей:</span>
                  <span className="text-white font-bold">{users.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Активных:</span>
                  <span className="text-green-400 font-bold">{users.filter(u => u.status === 'ACTIVE').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Ожидают активации:</span>
                  <span className="text-yellow-400 font-bold">{users.filter(u => u.status === 'PENDING').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Заблокированных:</span>
                  <span className="text-red-400 font-bold">{users.filter(u => u.status === 'BLOCKED').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="neon-card">
            <CardHeader>
              <CardTitle className="gradient-text">Статистика кошельков</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Всего кошельков:</span>
                  <span className="text-white font-bold">{wallets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Активных:</span>
                  <span className="text-green-400 font-bold">{wallets.filter(w => w.status === 'ACTIVE').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Неактивных:</span>
                  <span className="text-red-400 font-bold">{wallets.filter(w => w.status === 'INACTIVE').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Модальное окно добавления кошелька */}
      {showAddWalletModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Добавить кошелек для {selectedUser.email}
            </h3>
            
            {walletTypeSelection === 'select' && (
              <div className="space-y-4">
                <p className="text-gray-300 mb-4">Выберите тип кошелька:</p>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={() => {
                      setWalletTypeSelection('deposit')
                      setWalletForm(prev => ({ ...prev, type: 'DEPOSIT' }))
                    }}
                    className="neon-button h-12 text-left justify-start"
                  >
                    <DollarSign className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-semibold">Для пополнения</div>
                      <div className="text-sm opacity-80">Админ назначает лимиты и сеть</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setWalletTypeSelection('receive')
                      setWalletForm(prev => ({ ...prev, type: 'RECEIVE' }))
                    }}
                    className="neon-button h-12 text-left justify-start"
                  >
                    <ArrowDownLeft className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-semibold">Для приема</div>
                      <div className="text-sm opacity-80">Пользователь указывает адрес</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {walletTypeSelection === 'deposit' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Button
                    onClick={() => setWalletTypeSelection('select')}
                    variant="outline"
                    size="sm"
                    className="neon-input text-white"
                  >
                    ← Назад
                  </Button>
                  <h4 className="text-lg font-semibold text-white">Кошелек для пополнения</h4>
                </div>
                
                <div>
                  <Label htmlFor="deposit-network" className="text-gray-300">Сеть</Label>
                  <select
                    id="deposit-network"
                    value={walletForm.network}
                    onChange={(e) => setWalletForm(prev => ({ ...prev, network: e.target.value }))}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="TRC20">TRC20 (Tron)</option>
                    <option value="BEP20">BEP20 (Binance Smart Chain)</option>
                    <option value="ERC20">ERC20 (Ethereum)</option>
                    <option value="POLYGON">POLYGON</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="min-amount" className="text-gray-300">Минимальная сумма (USDT)</Label>
                  <Input
                    id="min-amount"
                    type="number"
                    step="0.01"
                    value={walletForm.minAmount}
                    onChange={(e) => setWalletForm(prev => ({ ...prev, minAmount: e.target.value }))}
                    className="neon-input text-white"
                    placeholder="Минимальная сумма"
                  />
                </div>

                <div>
                  <Label htmlFor="max-amount" className="text-gray-300">Максимальная сумма (USDT)</Label>
                  <Input
                    id="max-amount"
                    type="number"
                    step="0.01"
                    value={walletForm.maxAmount}
                    onChange={(e) => setWalletForm(prev => ({ ...prev, maxAmount: e.target.value }))}
                    className="neon-input text-white"
                    placeholder="Максимальная сумма"
                  />
                </div>

                <div>
                  <Label htmlFor="daily-limit" className="text-gray-300">Дневной лимит (USDT)</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    step="0.01"
                    value={walletForm.dailyLimit}
                    onChange={(e) => setWalletForm(prev => ({ ...prev, dailyLimit: e.target.value }))}
                    className="neon-input text-white"
                    placeholder="Дневной лимит"
                  />
                </div>
              </div>
            )}

            {walletTypeSelection === 'receive' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Button
                    onClick={() => setWalletTypeSelection('select')}
                    variant="outline"
                    size="sm"
                    className="neon-input text-white"
                  >
                    ← Назад
                  </Button>
                  <h4 className="text-lg font-semibold text-white">Кошелек для приема</h4>
                </div>
                
                <div>
                  <Label htmlFor="receive-address" className="text-gray-300">Адрес кошелька</Label>
                  <Input
                    id="receive-address"
                    value={walletForm.address}
                    onChange={(e) => setWalletForm(prev => ({ ...prev, address: e.target.value }))}
                    className="neon-input text-white"
                    placeholder="Введите адрес кошелька"
                  />
                </div>
                
                <div>
                  <Label htmlFor="receive-network" className="text-gray-300">Сеть</Label>
                  <select
                    id="receive-network"
                    value={walletForm.network}
                    onChange={(e) => setWalletForm(prev => ({ ...prev, network: e.target.value }))}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="TRC20">TRC20 (Tron)</option>
                    <option value="BEP20">BEP20 (Binance Smart Chain)</option>
                    <option value="ERC20">ERC20 (Ethereum)</option>
                    <option value="POLYGON">POLYGON</option>
                  </select>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowAddWalletModal(false)
                  setWalletTypeSelection('select')
                }}
                variant="outline"
                className="neon-input text-white"
              >
                Отмена
              </Button>
              {walletTypeSelection !== 'select' && (
                <Button
                  onClick={handleSubmitWallet}
                  className="neon-button"
                  disabled={
                    walletTypeSelection === 'deposit' 
                      ? !walletForm.network || !walletForm.minAmount || !walletForm.maxAmount || !walletForm.dailyLimit
                      : !walletForm.address || !walletForm.network
                  }
                >
                  Добавить кошелек
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно управления балансом */}
      {showBalanceModal && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Управление балансом
            </h3>
            <p className="text-gray-300 mb-4">
              Кошелек: {selectedWallet.address} ({selectedWallet.network})
            </p>
            <p className="text-gray-300 mb-4">
              Текущий баланс: <span className="font-bold text-white">{selectedWallet.balance} USDT</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="balance-amount" className="text-gray-300">Сумма</Label>
                <Input
                  id="balance-amount"
                  type="number"
                  step="0.01"
                  value={balanceForm.amount}
                  onChange={(e) => setBalanceForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="neon-input text-white"
                  placeholder="Введите сумму"
                />
              </div>
              
              <div>
                <Label htmlFor="balance-type" className="text-gray-300">Тип операции</Label>
                <select
                  id="balance-type"
                  value={balanceForm.type}
                  onChange={(e) => setBalanceForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ADD">Пополнить баланс</option>
                  <option value="SUBTRACT">Списать с баланса</option>
                </select>
              </div>

              <div>
                <Label htmlFor="balance-description" className="text-gray-300">Описание (необязательно)</Label>
                <Input
                  id="balance-description"
                  value={balanceForm.description}
                  onChange={(e) => setBalanceForm(prev => ({ ...prev, description: e.target.value }))}
                  className="neon-input text-white"
                  placeholder="Описание операции"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button
                onClick={() => setShowBalanceModal(false)}
                variant="outline"
                className="neon-input text-white"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmitBalance}
                className="neon-button"
                disabled={!balanceForm.amount}
              >
                {balanceForm.type === 'ADD' ? 'Пополнить' : 'Списать'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно записи транзакции */}
      {showTransactionModal && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Записать транзакцию
            </h3>
            <p className="text-gray-300 mb-4">
              Кошелек: {selectedWallet.address} ({selectedWallet.network})
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="transaction-type" className="text-gray-300">Тип транзакции</Label>
                <select
                  id="transaction-type"
                  value={transactionForm.type}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="INCOMING">Входящая</option>
                  <option value="OUTGOING">Исходящая</option>
                </select>
              </div>

              <div>
                <Label htmlFor="transaction-amount" className="text-gray-300">Сумма (USDT)</Label>
                <Input
                  id="transaction-amount"
                  type="number"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="neon-input text-white"
                  placeholder="Введите сумму"
                />
              </div>

              <div>
                <Label htmlFor="transaction-from" className="text-gray-300">Откуда (адрес отправителя)</Label>
                <Input
                  id="transaction-from"
                  value={transactionForm.fromAddress}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, fromAddress: e.target.value }))}
                  className="neon-input text-white"
                  placeholder="Адрес отправителя"
                />
              </div>

              <div>
                <Label htmlFor="transaction-to" className="text-gray-300">Куда (адрес получателя)</Label>
                <Input
                  id="transaction-to"
                  value={transactionForm.toAddress}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, toAddress: e.target.value }))}
                  className="neon-input text-white"
                  placeholder="Адрес получателя"
                />
              </div>

              <div>
                <Label htmlFor="transaction-description" className="text-gray-300">Описание</Label>
                <Input
                  id="transaction-description"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                  className="neon-input text-white"
                  placeholder="Описание транзакции"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transaction-block" className="text-gray-300">Номер блока</Label>
                  <Input
                    id="transaction-block"
                    value={transactionForm.blockNumber}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, blockNumber: e.target.value }))}
                    className="neon-input text-white"
                    placeholder="Номер блока"
                  />
                </div>
                <div>
                  <Label htmlFor="transaction-fee" className="text-gray-300">Комиссия (USDT)</Label>
                  <Input
                    id="transaction-fee"
                    type="number"
                    step="0.01"
                    value={transactionForm.fee}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, fee: e.target.value }))}
                    className="neon-input text-white"
                    placeholder="Комиссия"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transaction-gas-used" className="text-gray-300">Использовано газа</Label>
                  <Input
                    id="transaction-gas-used"
                    value={transactionForm.gasUsed}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, gasUsed: e.target.value }))}
                    className="neon-input text-white"
                    placeholder="Использовано газа"
                  />
                </div>
                <div>
                  <Label htmlFor="transaction-gas-price" className="text-gray-300">Цена газа</Label>
                  <Input
                    id="transaction-gas-price"
                    value={transactionForm.gasPrice}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, gasPrice: e.target.value }))}
                    className="neon-input text-white"
                    placeholder="Цена газа"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button
                onClick={() => setShowTransactionModal(false)}
                variant="outline"
                className="neon-input text-white"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmitTransaction}
                className="neon-button"
                disabled={!transactionForm.amount}
              >
                Записать транзакцию
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для ввода адреса кошелька при одобрении */}
      {showApproveModal && selectedWalletRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Одобрить запрос на кошелек пополнения
            </h3>
            <p className="text-gray-300 mb-4">
              Пользователь: {selectedWalletRequest.user.email}
            </p>
            <p className="text-gray-300 mb-4">
              Сеть: {selectedWalletRequest.network}
            </p>
            <p className="text-gray-300 mb-4">
              Тип: Для пополнения
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="wallet-address-approve" className="text-gray-300">Адрес кошелька для пополнения</Label>
                <Input
                  id="wallet-address-approve"
                  value={approveWalletAddress}
                  onChange={(e) => setApproveWalletAddress(e.target.value)}
                  className="neon-input text-white"
                  placeholder="Введите адрес кошелька"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowApproveModal(false)
                  setSelectedWalletRequest(null)
                  setApproveWalletAddress('')
                }}
                variant="outline"
                className="neon-input text-white"
              >
                Отмена
              </Button>
              <Button
                onClick={handleApproveWithAddress}
                className="neon-button"
                disabled={!approveWalletAddress.trim()}
              >
                Одобрить с адресом
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования сетевой пары */}
      {showEditNetworkPairModal && selectedNetworkPair && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Редактировать сетевую пару
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Сетевая пара</Label>
                <div className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    {selectedNetworkPair.fromNetwork.displayName}
                  </Badge>
                  <span className="text-gray-400">↔</span>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    {selectedNetworkPair.toNetwork.displayName}
                  </Badge>
                </div>
              </div>

              <div>
                <Label htmlFor="profitPercent" className="text-gray-300 mb-2 block">
                  Доходность (%)
                </Label>
                <Input
                  id="profitPercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={networkPairForm.profitPercent}
                  onChange={(e) => setNetworkPairForm(prev => ({ ...prev, profitPercent: e.target.value }))}
                  className="neon-input text-white"
                  placeholder="Введите доходность"
                />
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Статус</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={networkPairForm.isActive}
                      onChange={() => setNetworkPairForm(prev => ({ ...prev, isActive: true }))}
                      className="text-green-500"
                    />
                    <span className="text-gray-300">Активна</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={!networkPairForm.isActive}
                      onChange={() => setNetworkPairForm(prev => ({ ...prev, isActive: false }))}
                      className="text-red-500"
                    />
                    <span className="text-gray-300">Неактивна</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowEditNetworkPairModal(false)
                  setSelectedNetworkPair(null)
                }}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmitNetworkPair}
                className="neon-button w-full sm:w-auto"
                disabled={!networkPairForm.profitPercent}
              >
                Сохранить изменения
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно деталей пользователя */}
      {showUserDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Детали пользователя</h3>
              <button
                onClick={() => setShowUserDetailsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 text-sm">Email</Label>
                <p className="text-white font-medium">{selectedUser.email}</p>
              </div>
              

              <div>
                <Label className="text-gray-300 text-sm">Telegram</Label>
                <p className="text-white font-medium">{selectedUser.telegram || 'Не указан'}</p>
              </div>

              <div>
                <Label className="text-gray-300 text-sm">Роль</Label>
                <p className="text-white font-medium">{selectedUser.role}</p>
              </div>

              <div>
                <Label className="text-gray-300 text-sm">Статус</Label>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={selectedUser.status === 'ACTIVE' ? 'default' : 'destructive'}
                    className={selectedUser.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}
                  >
                    {selectedUser.status === 'ACTIVE' ? 'Активен' : 
                     selectedUser.status === 'BLOCKED' ? 'Заблокирован' : 
                     selectedUser.status === 'PENDING' ? 'Ожидает активации' : selectedUser.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 text-sm">Дата регистрации</Label>
                <p className="text-white font-medium">
                  {new Date(selectedUser.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button
                onClick={() => setShowUserDetailsModal(false)}
                variant="outline"
                className="neon-input text-white"
              >
                Закрыть
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования страхового депозита */}
      {showInsuranceDepositModal && selectedInsuranceUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Редактировать страховой депозит
            </h3>
            <p className="text-gray-300 mb-4">
              Пользователь: {selectedInsuranceUser.email}
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="insurance-deposit-amount" className="text-gray-300 mb-2 block">
                  Размер страхового депозита (USDT)
                </Label>
                <Input
                  id="insurance-deposit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={insuranceDepositForm.amount}
                  onChange={(e) => setInsuranceDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="neon-input text-white"
                  placeholder="Введите размер депозита"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Оставьте пустым, чтобы убрать требование страхового депозита
                </p>
              </div>

              <div className="p-3 bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-300 mb-2">Текущее состояние:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Требуется:</span>
                    <span className="text-white">{selectedInsuranceUser.insuranceDepositAmount || 0} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Оплачено:</span>
                    <span className="text-green-400">{selectedInsuranceUser.insuranceDepositPaid} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Остаток:</span>
                    <span className="text-orange-400">
                      {Math.max(0, (selectedInsuranceUser.insuranceDepositAmount || 0) - selectedInsuranceUser.insuranceDepositPaid)} USDT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowInsuranceDepositModal(false)
                  setSelectedInsuranceUser(null)
                  setInsuranceDepositForm({ amount: '' })
                }}
                variant="outline"
                className="neon-input text-white"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmitInsuranceDeposit}
                className="neon-button"
              >
                Сохранить изменения
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно управления запросом на вывод */}
      {showWithdrawalRequestModal && selectedWithdrawalRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Управление запросом на вывод
            </h3>
            <p className="text-gray-300 mb-4">
              Пользователь: {selectedWithdrawalRequest.user.email}
            </p>
            <p className="text-gray-300 mb-4">
              Кошелек: {selectedWithdrawalRequest.wallet.address} ({selectedWithdrawalRequest.wallet.network})
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="withdrawal-action" className="text-gray-300 mb-2 block">
                  Действие
                </Label>
                <select
                  id="withdrawal-action"
                  value={withdrawalRequestForm.action}
                  onChange={(e) => setWithdrawalRequestForm(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Выберите действие</option>
                  <option value="APPROVE">Одобрить (начать работу)</option>
                  <option value="REJECT">Отклонить</option>
                  <option value="UPDATE_PAYMENT">Обновить выплату</option>
                  <option value="COMPLETE">Завершить работу</option>
                </select>
              </div>

              {withdrawalRequestForm.action === 'UPDATE_PAYMENT' && (
                <div>
                  <Label htmlFor="paid-amount" className="text-gray-300 mb-2 block">
                    Оплаченная сумма (USDT)
                  </Label>
                  <Input
                    id="paid-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedWithdrawalRequest.amount}
                    value={withdrawalRequestForm.paidAmount}
                    onChange={(e) => setWithdrawalRequestForm(prev => ({ ...prev, paidAmount: e.target.value }))}
                    className="neon-input text-white"
                    placeholder="Введите оплаченную сумму"
                  />
                </div>
              )}

              {withdrawalRequestForm.action === 'COMPLETE' && (
                <div>
                  <Label htmlFor="profit-amount" className="text-gray-300 mb-2 block">
                    Доход пользователя (USDT)
                  </Label>
                  <Input
                    id="profit-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={withdrawalRequestForm.profit}
                    onChange={(e) => setWithdrawalRequestForm(prev => ({ ...prev, profit: e.target.value }))}
                    className="neon-input text-white"
                    placeholder="Введите доход пользователя"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="admin-notes" className="text-gray-300 mb-2 block">
                  Заметки админа
                </Label>
                <textarea
                  id="admin-notes"
                  value={withdrawalRequestForm.adminNotes}
                  onChange={(e) => setWithdrawalRequestForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  rows={3}
                  placeholder="Введите заметки"
                />
              </div>

              <div className="p-3 bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-300 mb-2">Текущее состояние:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Сумма запроса:</span>
                    <span className="text-white">{selectedWithdrawalRequest.amount} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Оплачено:</span>
                    <span className="text-green-400">{selectedWithdrawalRequest.paidAmount} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Остаток:</span>
                    <span className="text-orange-400">{selectedWithdrawalRequest.remainingAmount} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Статус:</span>
                    <span className="text-white">{selectedWithdrawalRequest.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowWithdrawalRequestModal(false)
                  setSelectedWithdrawalRequest(null)
                  setWithdrawalRequestForm({ action: '', paidAmount: '', profit: '', adminNotes: '' })
                }}
                variant="outline"
                className="neon-input text-white"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmitWithdrawalRequest}
                className="neon-button"
                disabled={!withdrawalRequestForm.action}
              >
                Выполнить действие
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно управления сетями */}
      {showNetworkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {selectedNetwork ? 'Редактировать сеть' : 'Добавить сеть'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="network-name" className="text-gray-300 mb-2 block">
                  Название сети (код)
                </Label>
                <Input
                  id="network-name"
                  value={networkForm.name}
                  onChange={(e) => setNetworkForm(prev => ({ ...prev, name: e.target.value }))}
                  className="neon-input text-white"
                  placeholder="Например: TRC20"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Уникальный код сети (например, TRC20, BEP20, ERC20)
                </p>
              </div>

              <div>
                <Label htmlFor="network-display-name" className="text-gray-300 mb-2 block">
                  Отображаемое название
                </Label>
                <Input
                  id="network-display-name"
                  value={networkForm.displayName}
                  onChange={(e) => setNetworkForm(prev => ({ ...prev, displayName: e.target.value }))}
                  className="neon-input text-white"
                  placeholder="Например: TRC20 (Tron)"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Название для отображения пользователям
                </p>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Статус</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={networkForm.isActive}
                      onChange={() => setNetworkForm(prev => ({ ...prev, isActive: true }))}
                      className="text-green-500"
                    />
                    <span className="text-gray-300">Активна</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={!networkForm.isActive}
                      onChange={() => setNetworkForm(prev => ({ ...prev, isActive: false }))}
                      className="text-red-500"
                    />
                    <span className="text-gray-300">Неактивна</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowNetworkModal(false)
                  setSelectedNetwork(null)
                  setNetworkForm({ name: '', displayName: '', isActive: true })
                }}
                variant="outline"
                className="neon-input text-white"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmitNetwork}
                className="neon-button"
                disabled={!networkForm.name || !networkForm.displayName}
              >
                {selectedNetwork ? 'Сохранить изменения' : 'Добавить сеть'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания сетевой пары */}
      {showCreateNetworkPairModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Создать сетевую пару
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="from-network" className="text-gray-300 mb-2 block">
                  Исходная сеть
                </Label>
                
                {/* Переключатель между существующей и пользовательской сетью */}
                <div className="flex space-x-4 mb-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fromNetworkType"
                      checked={!createNetworkPairForm.useCustomFromNetwork}
                      onChange={() => setCreateNetworkPairForm(prev => ({ 
                        ...prev, 
                        useCustomFromNetwork: false,
                        customFromNetwork: { name: '', displayName: '' }
                      }))}
                      className="text-purple-500"
                    />
                    <span className="text-gray-300">Существующая</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fromNetworkType"
                      checked={createNetworkPairForm.useCustomFromNetwork}
                      onChange={() => setCreateNetworkPairForm(prev => ({ 
                        ...prev, 
                        useCustomFromNetwork: true,
                        fromNetworkId: ''
                      }))}
                      className="text-purple-500"
                    />
                    <span className="text-gray-300">Создать новую</span>
                  </label>
                </div>

                {!createNetworkPairForm.useCustomFromNetwork ? (
                  <select
                    id="from-network"
                    value={createNetworkPairForm.fromNetworkId}
                    onChange={(e) => setCreateNetworkPairForm(prev => ({ ...prev, fromNetworkId: e.target.value }))}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Выберите исходную сеть</option>
                    {networks.filter(network => network.isActive).map(network => (
                      <option key={network.id} value={network.id}>
                        {network.displayName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={createNetworkPairForm.customFromNetwork.name}
                      onChange={(e) => setCreateNetworkPairForm(prev => ({ 
                        ...prev, 
                        customFromNetwork: { ...prev.customFromNetwork, name: e.target.value }
                      }))}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="Название сети (например: SOLANA)"
                    />
                    <input
                      type="text"
                      value={createNetworkPairForm.customFromNetwork.displayName}
                      onChange={(e) => setCreateNetworkPairForm(prev => ({ 
                        ...prev, 
                        customFromNetwork: { ...prev.customFromNetwork, displayName: e.target.value }
                      }))}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="Отображаемое название (например: SOLANA (Solana))"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="to-network" className="text-gray-300 mb-2 block">
                  Целевая сеть
                </Label>
                
                {/* Переключатель между существующей и пользовательской сетью */}
                <div className="flex space-x-4 mb-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="toNetworkType"
                      checked={!createNetworkPairForm.useCustomToNetwork}
                      onChange={() => setCreateNetworkPairForm(prev => ({ 
                        ...prev, 
                        useCustomToNetwork: false,
                        customToNetwork: { name: '', displayName: '' }
                      }))}
                      className="text-purple-500"
                    />
                    <span className="text-gray-300">Существующая</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="toNetworkType"
                      checked={createNetworkPairForm.useCustomToNetwork}
                      onChange={() => setCreateNetworkPairForm(prev => ({ 
                        ...prev, 
                        useCustomToNetwork: true,
                        toNetworkId: ''
                      }))}
                      className="text-purple-500"
                    />
                    <span className="text-gray-300">Создать новую</span>
                  </label>
                </div>

                {!createNetworkPairForm.useCustomToNetwork ? (
                  <select
                    id="to-network"
                    value={createNetworkPairForm.toNetworkId}
                    onChange={(e) => setCreateNetworkPairForm(prev => ({ ...prev, toNetworkId: e.target.value }))}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Выберите целевую сеть</option>
                    {networks.filter(network => network.isActive && network.id !== createNetworkPairForm.fromNetworkId).map(network => (
                      <option key={network.id} value={network.id}>
                        {network.displayName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={createNetworkPairForm.customToNetwork.name}
                      onChange={(e) => setCreateNetworkPairForm(prev => ({ 
                        ...prev, 
                        customToNetwork: { ...prev.customToNetwork, name: e.target.value }
                      }))}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="Название сети (например: AVAX)"
                    />
                    <input
                      type="text"
                      value={createNetworkPairForm.customToNetwork.displayName}
                      onChange={(e) => setCreateNetworkPairForm(prev => ({ 
                        ...prev, 
                        customToNetwork: { ...prev.customToNetwork, displayName: e.target.value }
                      }))}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="Отображаемое название (например: AVAX (Avalanche))"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="profit-percent" className="text-gray-300 mb-2 block">
                  Доходность (%)
                </Label>
                <Input
                  id="profit-percent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={createNetworkPairForm.profitPercent}
                  onChange={(e) => setCreateNetworkPairForm(prev => ({ ...prev, profitPercent: e.target.value }))}
                  className="neon-input text-white"
                  placeholder="Введите доходность"
                />
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Статус</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={createNetworkPairForm.isActive}
                      onChange={() => setCreateNetworkPairForm(prev => ({ ...prev, isActive: true }))}
                      className="text-green-500"
                    />
                    <span className="text-gray-300">Активна</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={!createNetworkPairForm.isActive}
                      onChange={() => setCreateNetworkPairForm(prev => ({ ...prev, isActive: false }))}
                      className="text-red-500"
                    />
                    <span className="text-gray-300">Неактивна</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowCreateNetworkPairModal(false)
                  setCreateNetworkPairForm({
                    fromNetworkId: '',
                    toNetworkId: '',
                    profitPercent: '',
                    isActive: true,
                    customFromNetwork: { name: '', displayName: '' },
                    customToNetwork: { name: '', displayName: '' },
                    useCustomFromNetwork: false,
                    useCustomToNetwork: false
                  })
                }}
                variant="outline"
                className="neon-input text-white"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmitCreateNetworkPair}
                className="neon-button"
                disabled={
                  !createNetworkPairForm.profitPercent ||
                  (!createNetworkPairForm.useCustomFromNetwork && !createNetworkPairForm.fromNetworkId) ||
                  (!createNetworkPairForm.useCustomToNetwork && !createNetworkPairForm.toNetworkId) ||
                  (createNetworkPairForm.useCustomFromNetwork && (!createNetworkPairForm.customFromNetwork.name || !createNetworkPairForm.customFromNetwork.displayName)) ||
                  (createNetworkPairForm.useCustomToNetwork && (!createNetworkPairForm.customToNetwork.name || !createNetworkPairForm.customToNetwork.displayName))
                }
              >
                Создать пару
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно настроек кошелька */}
      {showWalletSettingsModal && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Настройки кошелька
            </h3>
            <p className="text-gray-300 mb-4">
              Кошелек: {selectedWallet.address} ({selectedWallet.network})
            </p>
            <p className="text-gray-300 mb-4">
              Текущий статус: <span className="font-bold text-white">
                {selectedWallet.status === 'ACTIVE' ? 'Активен' : 'Неактивен'}
              </span>
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="text-white font-semibold mb-2">Доступные действия:</h4>
                <ul className="text-gray-300 space-y-2">
                  <li>• Изменить статус кошелька</li>
                  <li>• Управлять балансом</li>
                  <li>• Просмотреть транзакции</li>
                  <li>• Назначить пользователя</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
                <h4 className="text-blue-300 font-semibold mb-2">Информация о кошельке:</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <div>Сеть: {selectedWallet.network}</div>
                  <div>Тип: {selectedWallet.type}</div>
                  <div>Баланс: {selectedWallet.balance} USDT</div>
                  {selectedWallet.user && (
                    <div>Пользователь: {selectedWallet.user.email}</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button
                onClick={() => setShowWalletSettingsModal(false)}
                variant="outline"
                className="neon-input text-white"
              >
                Закрыть
              </Button>
              <Button
                onClick={() => {
                  setShowWalletSettingsModal(false)
                  handleManageBalance(selectedWallet)
                }}
                className="neon-button"
              >
                Управлять балансом
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  )
}
