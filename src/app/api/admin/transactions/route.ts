import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'


// Получить транзакции пользователя
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
    const userId = searchParams.get('userId')
    const walletId = searchParams.get('walletId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Строим фильтр
    const where: any = {}
    if (walletId) {
      where.walletId = walletId
    } else if (userId) {
      where.wallet = {
        userId: userId
      }
    }

    // Получаем транзакции с пагинацией
    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
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
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создать транзакцию
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

    const { 
      walletId, 
      type, 
      amount, 
      fromAddress, 
      toAddress, 
      description,
      blockNumber,
      gasUsed,
      gasPrice,
      fee 
    } = await request.json()

    if (!walletId || !type || !amount) {
      return NextResponse.json(
        { error: 'Неверные параметры' },
        { status: 400 }
      )
    }

    // Получаем кошелек
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Кошелек не найден' },
        { status: 404 }
      )
    }

    // Вычисляем новый баланс
    const newBalance = type === 'INCOMING' 
      ? wallet.balance + amount 
      : wallet.balance - amount

    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Недостаточно средств на кошельке' },
        { status: 400 }
      )
    }

    // Обновляем баланс кошелька
    await prisma.wallet.update({
      where: { id: walletId },
      data: { balance: newBalance }
    })

    // Создаем транзакцию
    const transaction = await prisma.walletTransaction.create({
      data: {
        hash: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: type,
        amount: amount,
        balance: newBalance,
        fromAddress: fromAddress || null,
        toAddress: toAddress || null,
        blockNumber: blockNumber || null,
        gasUsed: gasUsed || null,
        gasPrice: gasPrice || null,
        fee: fee || 0,
        status: 'CONFIRMED',
        walletId: walletId
      },
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
      }
    })

    return NextResponse.json({ 
      transaction,
      message: 'Транзакция создана успешно'
    })
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
