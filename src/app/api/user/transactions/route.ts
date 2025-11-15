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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // 'INCOMING', 'OUTGOING', or 'all'

    // Получаем все кошельки пользователя
    const userWallets = await prisma.wallet.findMany({
      where: { userId: user.id },
      select: { id: true }
    })

    const walletIds = userWallets.map(wallet => wallet.id)

    if (walletIds.length === 0) {
      return NextResponse.json({
        transactions: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          pages: 0
        },
        stats: {
          totalIncoming: 0,
          totalOutgoing: 0,
          totalTransactions: 0
        }
      })
    }

    // Строим фильтр
    const where: any = {
      walletId: { in: walletIds }
    }

    if (type && type !== 'all') {
      where.type = type
    }

    // Получаем транзакции с пагинацией
    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        include: {
          wallet: {
            select: {
              address: true,
              network: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.walletTransaction.count({ where })
    ])

    // Вычисляем статистику
    const [totalIncoming, totalOutgoing, totalTransactions] = await Promise.all([
      prisma.walletTransaction.aggregate({
        where: { 
          walletId: { in: walletIds },
          type: 'INCOMING'
        },
        _sum: { amount: true }
      }),
      prisma.walletTransaction.aggregate({
        where: { 
          walletId: { in: walletIds },
          type: 'OUTGOING'
        },
        _sum: { amount: true }
      }),
      prisma.walletTransaction.count({
        where: { walletId: { in: walletIds } }
      })
    ])

    // Форматируем данные для фронтенда
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      hash: transaction.hash,
      type: transaction.type,
      amount: transaction.amount,
      balance: transaction.balance,
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      blockNumber: transaction.blockNumber,
      gasUsed: transaction.gasUsed,
      gasPrice: transaction.gasPrice,
      fee: transaction.fee,
      status: transaction.status,
      createdAt: transaction.createdAt,
      wallet: {
        address: transaction.wallet.address,
        network: transaction.wallet.network,
        type: transaction.wallet.type
      }
    }))

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalIncoming: totalIncoming._sum.amount || 0,
        totalOutgoing: totalOutgoing._sum.amount || 0,
        totalTransactions
      }
    })
  } catch (error) {
    console.error('Get user transactions error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}