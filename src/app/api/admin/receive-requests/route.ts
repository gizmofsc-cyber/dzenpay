import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'


// Получить все запросы приема
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const receiveRequests = await prisma.receiveRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegram: true
          }
        },
        wallet: {
          select: {
            id: true,
            address: true,
            network: true,
            type: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ receiveRequests })
  } catch (error) {
    console.error('Get admin receive requests error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Обновить статус запроса приема
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID и статус обязательны' },
        { status: 400 }
      )
    }

    const receiveRequest = await prisma.receiveRequest.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegram: true
          }
        },
        wallet: {
          select: {
            id: true,
            address: true,
            network: true,
            type: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Статус запроса обновлен',
      receiveRequest
    })
  } catch (error) {
    console.error('Update receive request error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
