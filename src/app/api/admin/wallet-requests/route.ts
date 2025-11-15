import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'


// Получить все запросы кошельков для админа
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value

    if (!sessionToken) {
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

    // Проверяем, что пользователь - админ
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Строим фильтр
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }

    // Получаем все запросы кошельков с информацией о пользователях
    const walletRequests = await prisma.walletRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegram: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ walletRequests })
  } catch (error) {
    console.error('Admin wallet requests fetch error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Обработать запрос кошелька (одобрить/отклонить)
export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value

    if (!sessionToken) {
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

    // Проверяем, что пользователь - админ
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { requestId, action, walletAddress } = await request.json()

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Неверные параметры' },
        { status: 400 }
      )
    }

    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json(
        { error: 'Неверное действие' },
        { status: 400 }
      )
    }

    // Получаем запрос кошелька
    const walletRequest = await prisma.walletRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegram: true
          }
        }
      }
    })

    if (!walletRequest) {
      return NextResponse.json(
        { error: 'Запрос не найден' },
        { status: 404 }
      )
    }

    if (walletRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Запрос уже обработан' },
        { status: 400 }
      )
    }

    // Обновляем статус запроса
    const updatedRequest = await prisma.walletRequest.update({
      where: { id: requestId },
      data: { status: action },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegram: true
          }
        }
      }
    })

    // Если запрос одобрен, создаем кошелек
    if (action === 'APPROVED') {
      // Для кошельков пополнения адрес должен быть передан отдельно
      const finalWalletAddress = walletRequest.type === 'DEPOSIT' 
        ? walletAddress 
        : walletRequest.address

      if (!finalWalletAddress) {
        return NextResponse.json(
          { error: 'Адрес кошелька обязателен' },
          { status: 400 }
        )
      }

      const newWallet = await prisma.wallet.create({
        data: {
          address: finalWalletAddress,
          network: walletRequest.network,
          type: walletRequest.type,
          userId: walletRequest.userId,
          status: 'ACTIVE',
          balance: 0
        }
      })

      return NextResponse.json({ 
        message: 'Запрос одобрен и кошелек создан',
        walletRequest: updatedRequest,
        wallet: newWallet
      })
    }

    return NextResponse.json({ 
      message: 'Запрос отклонен',
      walletRequest: updatedRequest
    })
  } catch (error) {
    console.error('Admin wallet request update error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
