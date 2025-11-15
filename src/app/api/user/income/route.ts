import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {

  try {
    console.log('GET /api/user/income called')
    const sessionToken = request.cookies.get('session-token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await validateSession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User found:', user.email)

    // Получаем заработки пользователя по кошелькам вывода
    const walletEarnings = await prisma.walletEarning.findMany({
      where: { userId: user.id },
      include: {
        wallet: {
          select: {
            id: true,
            address: true,
            network: true,
            type: true
          }
        },
        withdrawalRequest: {
          select: {
            id: true,
            amount: true,
            profit: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Реферальная система удалена


    // Группируем заработки по кошелькам
    const earningsByWallet = walletEarnings.reduce((acc, earning) => {
      const walletId = earning.walletId
      if (!acc[walletId]) {
        acc[walletId] = {
          wallet: earning.wallet,
          totalEarnings: 0,
          earnings: []
        }
      }
      acc[walletId].totalEarnings += earning.amount
      acc[walletId].earnings.push(earning)
      return acc
    }, {} as Record<string, any>)

    // Вычисляем общую статистику
    const totalWalletEarnings = walletEarnings.reduce((sum, earning) => sum + earning.amount, 0)

    console.log('Wallet earnings found:', walletEarnings.length)
    console.log('Total wallet earnings:', totalWalletEarnings)
    console.log('Earnings by wallet:', Object.keys(earningsByWallet).length)

    return NextResponse.json({
      totalEarnings: totalWalletEarnings,
      totalWalletEarnings,
      earningsByWallet: Object.values(earningsByWallet),
      walletEarnings
    })
  } catch (error) {
    console.error('Error fetching income data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
