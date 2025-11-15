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

    // Проверяем, что пользователь - админ
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Получаем все кошельки с информацией о пользователях
    const wallets = await prisma.wallet.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegram: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ wallets })
  } catch (error) {
    console.error('Admin wallets fetch error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

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

    const { userId, address, network, type } = await request.json()

    if (!userId || !address || !network || !type) {
      return NextResponse.json(
        { error: 'Неверные параметры' },
        { status: 400 }
      )
    }

    if (!['DEPOSIT', 'RECEIVE'].includes(type)) {
      return NextResponse.json(
        { error: 'Тип должен быть DEPOSIT или RECEIVE' },
        { status: 400 }
      )
    }

    // Создаем новый кошелек для пользователя
    const newWallet = await prisma.wallet.create({
      data: {
        address,
        network,
        type,
        userId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegram: true,
          }
        }
      }
    })

    return NextResponse.json({ wallet: newWallet })
  } catch (error) {
    console.error('Admin wallet creation error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

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

    const { walletId, status } = await request.json()

    if (!walletId || !status) {
      return NextResponse.json(
        { error: 'Неверные параметры' },
        { status: 400 }
      )
    }

    // Обновляем статус кошелька
    const updatedWallet = await prisma.wallet.update({
      where: { id: walletId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegram: true,
          }
        }
      }
    })

    return NextResponse.json({ wallet: updatedWallet })
  } catch (error) {
    console.error('Admin wallet update error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
