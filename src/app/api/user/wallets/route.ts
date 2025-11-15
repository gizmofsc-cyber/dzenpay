import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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

    // Получаем кошельки пользователя
    const wallets = await prisma.wallet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    // Вычисляем общую статистику
    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
    const activeWallets = wallets.filter(wallet => wallet.status === 'ACTIVE').length

    return NextResponse.json({
      wallets,
      statistics: {
        totalBalance,
        activeWallets,
        totalWallets: wallets.length
      }
    })
  } catch (error) {
    console.error('Get user wallets error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Сессия не найдена' }, { status: 401 })
    }

    const user = await validateSession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Недействительная сессия' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const walletId = searchParams.get('id')

    if (!walletId) {
      return NextResponse.json({ error: 'ID кошелька не указан' }, { status: 400 })
    }

    // Проверяем, что кошелек принадлежит пользователю
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: user.id
      }
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Кошелек не найден' }, { status: 404 })
    }

    // Проверяем, нет ли активных запросов на вывод для этого кошелька
    const activeWithdrawalRequests = await prisma.withdrawalRequest.findMany({
      where: {
        walletId: walletId,
        status: {
          in: ['PENDING', 'PROCESSING']
        }
      }
    })

    if (activeWithdrawalRequests.length > 0) {
      return NextResponse.json({ 
        error: 'Невозможно удалить кошелек с активными запросами на вывод' 
      }, { status: 400 })
    }

    // Удаляем кошелек
    await prisma.wallet.delete({
      where: { id: walletId }
    })

    return NextResponse.json({ message: 'Кошелек успешно удален' })
  } catch (error) {
    console.error('Delete user wallet error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}