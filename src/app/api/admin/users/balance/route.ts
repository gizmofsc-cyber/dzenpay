import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'


// Получить баланс пользователя
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

    if (!userId) {
      return NextResponse.json(
        { error: 'ID пользователя обязателен' },
        { status: 400 }
      )
    }

    // Получаем пользователя с его кошельками
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: targetUser })
  } catch (error) {
    console.error('Get user balance error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Обновить баланс пользователя
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

    const { userId, walletId, amount, type, description } = await request.json()

    if (!userId || !walletId || !amount || !type) {
      return NextResponse.json(
        { error: 'Неверные параметры' },
        { status: 400 }
      )
    }

    // Проверяем, что кошелек принадлежит пользователю
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: userId
      }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Кошелек не найден' },
        { status: 404 }
      )
    }

    // Вычисляем новый баланс
    const newBalance = type === 'ADD' 
      ? wallet.balance + amount 
      : wallet.balance - amount

    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Недостаточно средств на кошельке' },
        { status: 400 }
      )
    }

    // Обновляем баланс кошелька
    const updatedWallet = await prisma.wallet.update({
      where: { id: walletId },
      data: { balance: newBalance }
    })

    // Создаем запись о транзакции
    const transaction = await prisma.walletTransaction.create({
      data: {
        hash: `ADMIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: type === 'ADD' ? 'INCOMING' : 'OUTGOING',
        amount: amount,
        balance: newBalance,
        fromAddress: type === 'ADD' ? 'ADMIN' : (wallet.address || 'UNKNOWN'),
        toAddress: type === 'ADD' ? (wallet.address || 'UNKNOWN') : 'ADMIN',
        blockNumber: 'ADMIN',
        gasUsed: '0',
        gasPrice: '0',
        fee: 0,
        status: 'CONFIRMED',
        walletId: walletId
      }
    })

    return NextResponse.json({ 
      wallet: updatedWallet, 
      transaction,
      message: type === 'ADD' ? 'Баланс пополнен' : 'Баланс списан'
    })
  } catch (error) {
    console.error('Update user balance error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
