import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'


// Получить запросы пополнения пользователя
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/user/deposit-requests called')
    const sessionToken = request.cookies.get('session-token')?.value
    console.log('Session token:', sessionToken ? 'present' : 'missing')

    if (!sessionToken) {
      console.log('No session token found')
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 401 }
      )
    }

    const user = await validateSession(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Недействительная сессия' },
        { status: 401 }
      )
    }

    const depositRequests = await prisma.depositRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    // Получаем кошелек пользователя для проверки баланса
    const userDepositWallet = await prisma.wallet.findFirst({
      where: {
        userId: user.id,
        type: 'DEPOSIT'
      }
    })

    // Обновляем статус запросов на основе фактического баланса кошелька
    const updatedDepositRequests = depositRequests.map(request => {
      // Если запрос в статусе COMPLETED, но баланс кошелька 0 - меняем на PROCESSING
      if (request.status === 'COMPLETED' && userDepositWallet && userDepositWallet.balance === 0) {
        return { ...request, status: 'PROCESSING' }
      }
      return request
    })

    return NextResponse.json({ depositRequests: updatedDepositRequests })
  } catch (error) {
    console.error('Get deposit requests error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создать запрос на пополнение
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/user/deposit-requests called')
    const sessionToken = request.cookies.get('session-token')?.value
    console.log('Session token:', sessionToken ? 'present' : 'missing')

    if (!sessionToken) {
      console.log('No session token found')
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 401 }
      )
    }

    const user = await validateSession(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Недействительная сессия' },
        { status: 401 }
      )
    }

    const { amount, fromNetwork, toNetwork } = await request.json()

    if (!amount || !fromNetwork || !toNetwork) {
      return NextResponse.json(
        { error: 'Сумма и сети обязательны' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Сумма должна быть больше 0' },
        { status: 400 }
      )
    }

    // Находим доступный кошелек админа для пополнения
    const adminWallet = await prisma.wallet.findFirst({
      where: {
        type: 'DEPOSIT',
        status: 'ACTIVE',
        network: fromNetwork
      },
      include: {
        user: {
          select: {
            email: true,
            telegram: true
          }
        }
      }
    })

    if (!adminWallet) {
      return NextResponse.json(
        { error: `Нет доступных кошельков для сети ${fromNetwork}` },
        { status: 400 }
      )
    }

    // Создаем запрос пополнения
    const depositRequest = await prisma.depositRequest.create({
      data: {
        amount,
        fromNetwork,
        toNetwork,
        adminWalletAddress: adminWallet.address,
        userId: user.id,
        status: 'PENDING'
      }
    })

    console.log('Created deposit request:', depositRequest.id)

    return NextResponse.json({
      message: 'Запрос на пополнение создан',
      depositRequest: {
        id: depositRequest.id,
        amount: depositRequest.amount,
        fromNetwork: depositRequest.fromNetwork,
        toNetwork: depositRequest.toNetwork,
        adminWalletAddress: depositRequest.adminWalletAddress,
        status: depositRequest.status,
        createdAt: depositRequest.createdAt
      }
    })
  } catch (error) {
    console.error('Create deposit request error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
