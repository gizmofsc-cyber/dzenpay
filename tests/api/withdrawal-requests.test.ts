import type { NextRequest } from 'next/server'

const prismaMock = {
  wallet: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  },
  user: {
    findUnique: jest.fn()
  },
  withdrawalRequest: {
    findFirst: jest.fn(),
    create: jest.fn()
  },
  walletTransaction: {
    create: jest.fn()
  },
  $transaction: jest.fn()
}

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}))

jest.mock('@/lib/auth', () => ({
  validateSession: jest.fn()
}))

const { POST: createWithdrawal } = require('@/app/api/user/withdrawal-requests/route') as {
  POST: (request: NextRequest) => Promise<Response>
}

const { validateSession } = jest.requireMock('@/lib/auth') as {
  validateSession: jest.Mock
}

const buildRequest = (body: Record<string, unknown>, sessionToken = 'test-token') => {
  return {
    json: async () => body,
    cookies: {
      get: (name: string) =>
        name === 'session-token' && sessionToken
          ? { name, value: sessionToken }
          : undefined
    }
  } as unknown as NextRequest
}

const resetMocks = () => {
  Object.values(prismaMock).forEach((value) => {
    if (typeof value === 'function') {
      value.mockReset?.()
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach((fn) => fn.mockReset?.())
    }
  })
  validateSession.mockReset()

  prismaMock.withdrawalRequest.findFirst.mockResolvedValue(null)
}

describe('POST /api/user/withdrawal-requests', () => {
  beforeEach(() => {
    resetMocks()
    prismaMock.$transaction.mockImplementation(async (cb) =>
      cb({
        wallet: prismaMock.wallet,
        withdrawalRequest: prismaMock.withdrawalRequest,
        walletTransaction: prismaMock.walletTransaction
      })
    )
  })

  it('возвращает 404, если кошелек не найден или не принадлежит пользователю', async () => {
    prismaMock.wallet.findFirst.mockResolvedValue(null)
    validateSession.mockResolvedValue({ id: 'user-404' })

    const request = buildRequest({ walletId: 'wallet-1', amount: 100 })
    const response = await createWithdrawal(request)
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error).toMatch(/wallet not found/i)
    expect(prismaMock.wallet.findFirst).toHaveBeenCalledTimes(1)
  })

  it('не учитывает страховой депозит в доступном балансе', async () => {
    const user = { id: 'user-1', insuranceDepositAmount: 500, insuranceDepositPaid: 500 }

    prismaMock.wallet.findFirst.mockResolvedValue({
      id: 'wallet-1',
      userId: user.id,
      type: 'WITHDRAWAL',
      status: 'ACTIVE'
    })

    prismaMock.wallet.findMany.mockResolvedValue([
      { id: 'wallet-1', balance: 0, type: 'WITHDRAWAL' }
    ])

    prismaMock.user.findUnique.mockResolvedValue(user)
    prismaMock.withdrawalRequest.findFirst.mockResolvedValue(null)

    validateSession.mockResolvedValue(user)

    const request = buildRequest({ walletId: 'wallet-1', amount: 100 })
    const response = await createWithdrawal(request)
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toMatch(/insufficient balance/i)

    expect(prismaMock.wallet.update).not.toHaveBeenCalled()
    expect(prismaMock.walletTransaction.create).not.toHaveBeenCalled()
  })

  it('списывает средства и создает запрос только после проверки условий', async () => {
    const user = { id: 'user-2', insuranceDepositAmount: 500, insuranceDepositPaid: 500 }
    const wallets = [
      { id: 'wallet-a', userId: user.id, balance: 300, type: 'WITHDRAWAL', status: 'ACTIVE', address: '0x-a', network: 'TRC20' },
      { id: 'wallet-b', userId: user.id, balance: 200, type: 'WITHDRAWAL', status: 'ACTIVE', address: '0x-b', network: 'TRC20' }
    ]

    prismaMock.wallet.findFirst.mockResolvedValue(wallets[0])
    prismaMock.wallet.findMany
      .mockResolvedValueOnce(wallets) // для расчета баланса
      .mockResolvedValueOnce(wallets) // внутри транзакции

    prismaMock.user.findUnique.mockResolvedValue(user)
    prismaMock.withdrawalRequest.findFirst.mockResolvedValue(null)

    prismaMock.withdrawalRequest.create.mockImplementation(async ({ data }) => ({
      ...data,
      id: 'wr-1',
      wallet: {
        id: wallets[0].id,
        address: wallets[0].address,
        network: wallets[0].network,
        type: wallets[0].type
      }
    }))

    const walletUpdates: Array<{ id: string; balance: number }> = []

    prismaMock.wallet.update.mockImplementation(async ({ where, data }) => {
      walletUpdates.push({ id: where.id, balance: data.balance })
      return { id: where.id, ...data }
    })

    prismaMock.walletTransaction.create.mockImplementation(async ({ data }) => data)

    validateSession.mockResolvedValue(user)

    const request = buildRequest({ walletId: wallets[0].id, amount: 400 })
    const response = await createWithdrawal(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.withdrawalRequest.amount).toBe(400)
    expect(prismaMock.withdrawalRequest.create).toHaveBeenCalledTimes(1)

    expect(walletUpdates).toHaveLength(2)
    expect(walletUpdates).toEqual(
      expect.arrayContaining([
        { id: wallets[0].id, balance: 0 },
        { id: wallets[1].id, balance: 100 }
      ])
    )

    expect(prismaMock.walletTransaction.create).toHaveBeenCalledTimes(2)
  })
})

