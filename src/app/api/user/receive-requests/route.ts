import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'


// Получить запросы приема пользователя
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/user/receive-requests called')
    const sessionToken = request.cookies.get('session-token')?.value
    console.log('Session token:', sessionToken ? 'present' : 'missing')

    if (!sessionToken) {
      console.log('No session token found')
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

    const receiveRequests = await prisma.receiveRequest.findMany({
      where: { userId: user.id },
      include: {
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
    console.error('Get receive requests error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создать запрос на готовность к приему
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/user/receive-requests called')
    const sessionToken = request.cookies.get('session-token')?.value
    console.log('Session token:', sessionToken ? 'present' : 'missing')

    if (!sessionToken) {
      console.log('No session token found')
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

    const { walletId } = await request.json()

    if (!walletId) {
      return NextResponse.json(
        { error: 'ID кошелька обязателен' },
        { status: 400 }
      )
    }

    // Проверяем, что кошелек принадлежит пользователю и имеет тип RECEIVE
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: user.id,
        type: 'RECEIVE',
        status: 'ACTIVE'
      }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Кошелек не найден или недоступен' },
        { status: 400 }
      )
    }

    // Проверяем, нет ли уже активного запроса для этого кошелька
    const existingRequest = await prisma.receiveRequest.findFirst({
      where: {
        walletId,
        status: {
          in: ['PENDING', 'READY', 'PROCESSING']
        }
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Для этого кошелька уже есть активный запрос' },
        { status: 400 }
      )
    }

    // Создаем запрос готовности к приему
    const receiveRequest = await prisma.receiveRequest.create({
      data: {
        walletId,
        userId: user.id,
        status: 'PENDING'
      },
      include: {
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

    console.log('Created receive request:', receiveRequest.id)

    return NextResponse.json({
      message: 'Запрос на готовность к приему создан',
      receiveRequest
    })
  } catch (error) {
    console.error('Create receive request error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
