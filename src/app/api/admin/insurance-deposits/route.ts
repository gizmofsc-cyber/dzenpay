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

    // Получаем всех пользователей с их страховыми депозитами
    const users = await prisma.user.findMany({
      where: {
        NOT: {
          email: {
            contains: 'temp-'
          }
        }
      },
      select: {
        id: true,
        email: true,
        telegram: true,
        role: true,
        status: true,
        insuranceDepositAmount: true,
        insuranceDepositPaid: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Admin insurance deposits fetch error:', error)
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

    const { userId, insuranceDepositAmount } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'ID пользователя не указан' },
        { status: 400 }
      )
    }

    // Обновляем размер страхового депозита
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        insuranceDepositAmount: insuranceDepositAmount || null
      },
      select: {
        id: true,
        email: true,
        telegram: true,
        role: true,
        status: true,
        insuranceDepositAmount: true,
        insuranceDepositPaid: true,
        createdAt: true
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Admin insurance deposit update error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}