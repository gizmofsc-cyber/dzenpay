import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    const walletId = searchParams.get('walletId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // 'INCOMING' or 'OUTGOING'

    if (!walletId) {
      return NextResponse.json(
        { error: 'ID кошелька обязателен' },
        { status: 400 }
      )
    }

    // Проверяем, что кошелек принадлежит пользователю
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: user.id
      }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Кошелек не найден' },
        { status: 404 }
      )
    }

    // Строим фильтр
    const where: any = { walletId }
    if (type) {
      where.type = type
    }

    // Получаем транзакции с пагинацией
    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.walletTransaction.count({ where })
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Wallet transactions error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
