import type { NextRequest } from 'next/server'

const prismaMock = {
  wallet: {
    aggregate: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn()
  },
  walletTransaction: {
    aggregate: jest.fn(),
    findMany: jest.fn()
  }
}

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}))

jest.mock('@/lib/auth', () => ({
  validateSession: jest.fn()
}))

const { GET: getStats } = require('@/app/api/user/stats/route') as {
  GET: (request: NextRequest) => Promise<Response>
}

const { validateSession } = jest.requireMock('@/lib/auth') as {
  validateSession: jest.Mock
}

const buildRequest = (sessionToken?: string) => {
  return {
    cookies: {
      get: (name: string) =>
        name === 'session-token' && sessionToken
          ? { name, value: sessionToken }
          : undefined
    }
  } as unknown as NextRequest
}

const resetMocks = () => {
  Object.values(prismaMock).forEach((group) => {
    Object.values(group).forEach((fn) => fn.mockReset())
  })
  validateSession.mockReset()
}

describe('GET /api/user/stats', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('возвращает 401 если нет сессии', async () => {
    const response = await getStats(buildRequest())
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error).toMatch(/не найдена/i)
  })

  it('возвращает агрегированную статистику и корректные данные по страховому депозиту', async () => {
    const user = {
      id: 'user-1',
      insuranceDepositAmount: 1000,
      insuranceDepositPaid: 750
    }

    validateSession.mockResolvedValue(user)

    prismaMock.wallet.aggregate.mockResolvedValue({
      _sum: { balance: 2000 },
      _count: 4
    })

    prismaMock.wallet.count.mockResolvedValue(3)
    prismaMock.wallet.findFirst.mockResolvedValue({ balance: 700 })

    prismaMock.wallet.findMany
      .mockResolvedValueOnce([
        { id: 'w1' },
        { id: 'w2' }
      ])
      .mockResolvedValueOnce([
        { id: 'w1', network: 'TRC20' },
        { id: 'w2', network: 'BEP20' }
      ])

    prismaMock.walletTransaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: 5 }) // incoming
      .mockResolvedValueOnce({ _sum: { amount: 300 }, _count: 3 }) // outgoing
      .mockResolvedValue({ _sum: { amount: 100 }, _count: 1 }) // per-network aggregation

    prismaMock.walletTransaction.findMany.mockResolvedValue([
      {
        id: 'tx1',
        amount: 200,
        type: 'INCOMING',
        createdAt: new Date(),
        wallet: { network: 'TRC20' }
      }
    ])

    const response = await getStats(buildRequest('token-123'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.walletStats).toEqual({
      totalBalance: 2000,
      totalWallets: 4,
      activeWallets: 3
    })

    expect(payload.transactionStats.last30Days).toEqual({
      incoming: { amount: 500, count: 5 },
      outgoing: { amount: 300, count: 3 },
      netAmount: 200
    })

    expect(payload.transactionStats.recentTransactions).toHaveLength(1)

    expect(payload.insuranceDeposit).toEqual({
      amount: 1000,
      paid: 750
    })
  })
})


