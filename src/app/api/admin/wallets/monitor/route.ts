import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { getWalletBalance } from '@/lib/blockchain'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {

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

    const { walletIds } = await request.json()

    if (!walletIds || !Array.isArray(walletIds)) {
      return NextResponse.json(
        { error: 'Неверные параметры' },
        { status: 400 }
      )
    }

    const results = []

    for (const walletId of walletIds) {
      try {
        // Получаем кошелек
        const wallet = await prisma.wallet.findUnique({
          where: { id: walletId },
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

        if (!wallet) {
          results.push({
            walletId,
            success: false,
            error: 'Кошелек не найден'
          })
          continue
        }

        // Проверяем, что у кошелька есть адрес
        if (!wallet.address) {
          results.push({
            walletId,
            success: false,
            error: 'У кошелька нет адреса'
          })
          continue
        }

        // Получаем баланс с блокчейна
        const blockchainBalance = await getWalletBalance(wallet.address, wallet.network)

        // Обновляем баланс в базе данных
        const updatedWallet = await prisma.wallet.update({
          where: { id: walletId },
          data: {
            balance: blockchainBalance.balance,
            lastChecked: new Date()
          }
        })

        results.push({
          walletId,
          success: true,
          wallet: updatedWallet,
          blockchainBalance
        })
      } catch (error) {
        results.push({
          walletId,
          success: false,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Wallet monitoring error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

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

    // Получаем статистику по всем кошелькам
    const [totalWallets, activeWallets, totalBalance, recentTransactions] = await Promise.all([
      prisma.wallet.count(),
      prisma.wallet.count({ where: { status: 'ACTIVE' } }),
      prisma.wallet.aggregate({
        _sum: { balance: true }
      }),
      prisma.walletTransaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Последние 24 часа
          }
        }
      })
    ])

    // Получаем кошельки с низким балансом
    const lowBalanceWallets = await prisma.wallet.findMany({
      where: {
        balance: {
          lt: 100 // Менее 100 USDT
        },
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegram: true
          }
        }
      },
      orderBy: { balance: 'asc' },
      take: 10
    })

    // Получаем последние транзакции
    const latestTransactions = await prisma.walletTransaction.findMany({
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                telegram: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({
      statistics: {
        totalWallets,
        activeWallets,
        totalBalance: totalBalance._sum.balance || 0,
        recentTransactions
      },
      lowBalanceWallets,
      latestTransactions
    })
  } catch (error) {
    console.error('Wallet monitoring stats error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
