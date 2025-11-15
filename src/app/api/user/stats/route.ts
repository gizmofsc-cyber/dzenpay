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

    // Получаем статистику кошельков
    const walletStats = await prisma.wallet.aggregate({
      where: { userId: user.id },
      _sum: { balance: true },
      _count: true
    })

    const activeWalletsCount = await prisma.wallet.count({
      where: { 
        userId: user.id,
        status: 'ACTIVE'
      }
    })

    // Получаем баланс кошелька DEPOSIT для страхового взноса
    const depositWallet = await prisma.wallet.findFirst({
      where: { 
        userId: user.id,
        type: 'DEPOSIT'
      },
      select: { balance: true }
    })

    // Получаем статистику транзакций за последние 30 дней
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    // Сначала получаем кошельки пользователя
    const userWallets = await prisma.wallet.findMany({
      where: { userId: user.id },
      select: { id: true }
    })
    
    const walletIds = userWallets.map(w => w.id)
    
    const [incomingStats, outgoingStats, recentTransactions] = await Promise.all([
      prisma.walletTransaction.aggregate({
        where: {
          walletId: { in: walletIds },
          type: 'INCOMING',
          createdAt: { gte: thirtyDaysAgo }
        },
        _sum: { amount: true },
        _count: true
      }),
      prisma.walletTransaction.aggregate({
        where: {
          walletId: { in: walletIds },
          type: 'OUTGOING',
          createdAt: { gte: thirtyDaysAgo }
        },
        _sum: { amount: true },
        _count: true
      }),
      prisma.walletTransaction.findMany({
        where: {
          walletId: { in: walletIds },
          createdAt: { gte: thirtyDaysAgo }
        },
        include: {
          wallet: {
            select: {
              network: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    // Получаем статистику по сетям через отдельные запросы
    const walletNetworks = await prisma.wallet.findMany({
      where: { userId: user.id },
      select: { id: true, network: true }
    })

    const networkBreakdown: Record<string, { totalAmount: number; transactionCount: number }> = {}
    
    // Для каждой сети получаем статистику транзакций
    for (const wallet of walletNetworks) {
      const walletStats = await prisma.walletTransaction.aggregate({
        where: {
          walletId: wallet.id,
          createdAt: { gte: thirtyDaysAgo }
        },
        _sum: { amount: true },
        _count: true
      })

      if (!networkBreakdown[wallet.network]) {
        networkBreakdown[wallet.network] = { totalAmount: 0, transactionCount: 0 }
      }
      networkBreakdown[wallet.network].totalAmount += walletStats._sum.amount || 0
      networkBreakdown[wallet.network].transactionCount += walletStats._count
    }

    return NextResponse.json({
      walletStats: {
        totalBalance: walletStats._sum.balance || 0,
        totalWallets: walletStats._count,
        activeWallets: activeWalletsCount
      },
      transactionStats: {
        last30Days: {
          incoming: {
            amount: incomingStats._sum.amount || 0,
            count: incomingStats._count
          },
          outgoing: {
            amount: outgoingStats._sum.amount || 0,
            count: outgoingStats._count
          },
          netAmount: (incomingStats._sum.amount || 0) - (outgoingStats._sum.amount || 0)
        },
        networkBreakdown,
        recentTransactions
      },
      insuranceDeposit: {
        amount: user.insuranceDepositAmount ?? 0,
        paid: user.insuranceDepositPaid || 0
      }
    })
  } catch (error) {
    console.error('Get user stats error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
