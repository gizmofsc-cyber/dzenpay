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
    const status = searchParams.get('status')

    // Строим фильтр
    const where: any = {
      userId: user.id
    }

    if (status && status !== 'all') {
      where.status = status
    }

    // Получаем выплаты с пагинацией
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          wallet: {
            select: {
              address: true,
              network: true
            }
          },
          networkPair: {
            select: {
              fromNetwork: true,
              toNetwork: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.payment.count({ where })
    ])

    // Вычисляем статистику
    const [totalAmount, totalProfit, completedCount, pendingCount] = await Promise.all([
      prisma.payment.aggregate({
        where: { userId: user.id },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { userId: user.id },
        _sum: { profit: true }
      }),
      prisma.payment.count({
        where: { 
          userId: user.id,
          status: 'COMPLETED'
        }
      }),
      prisma.payment.count({
        where: { 
          userId: user.id,
          status: 'PENDING'
        }
      })
    ])

    // Форматируем данные для фронтенда
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      profit: payment.profit,
      status: payment.status,
      transferTime: payment.transferTime,
      createdAt: payment.createdAt,
      wallet: {
        address: payment.wallet.address,
        network: `${payment.networkPair.fromNetwork} → ${payment.networkPair.toNetwork}`
      }
    }))

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalAmount: totalAmount._sum.amount || 0,
        totalProfit: totalProfit._sum.profit || 0,
        completedPayments: completedCount,
        pendingPayments: pendingCount
      }
    })
  } catch (error) {
    console.error('Get user payments error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
