import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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

    // Получаем только неиспользованные токены регистрации (временные пользователи)
    const tokens = await prisma.user.findMany({
      where: {
        email: {
          contains: 'temp-'
        },
        status: 'PENDING'
      },
      select: {
        id: true,
        token: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ tokens })
  } catch (error) {
    console.error('Admin tokens fetch error:', error)
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

    // Создаем новый токен регистрации
    const token = `TOKEN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    const newToken = await prisma.user.create({
      data: {
        email: `temp-${token}@example.com`,
        password: await bcrypt.hash('temp', 12), // Хешированный временный пароль
        token,
        role: 'USER',
        status: 'PENDING',
      },
      select: {
        id: true,
        token: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ token: newToken })
  } catch (error) {
    console.error('Admin token creation error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
