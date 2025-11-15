import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

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

    const { userId, address, network } = await request.json()

    if (!userId || !address || !network) {
      return NextResponse.json(
        { error: 'Неверные параметры' },
        { status: 400 }
      )
    }

    // Проверяем, что пользователь существует
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Создаем кошелек для пользователя
    const newWallet = await prisma.wallet.create({
      data: {
        address,
        network,
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
    console.error('Admin wallet assignment error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
