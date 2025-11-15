import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const { network } = await request.json()

    if (!network) {
      return NextResponse.json(
        { error: 'Сеть не указана' },
        { status: 400 }
      )
    }

    // Проверяем, есть ли уже активный запрос на страховой взнос
    const existingRequest = await prisma.depositRequest.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['PENDING', 'PROCESSING']
        }
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'У вас уже есть активный запрос на страховой взнос' },
        { status: 400 }
      )
    }

    // Создаем запрос на страховой взнос
    const depositRequest = await prisma.depositRequest.create({
      data: {
        userId: user.id,
        amount: 0, // Сумма будет назначена админом
        fromNetwork: network,
        toNetwork: network, // Для страхового взноса сети одинаковые
        status: 'PENDING',
        adminWalletAddress: null, // Будет назначен админом
        userWalletAddress: null, // Будет назначен админом
        transactionHash: null
      }
    })

    return NextResponse.json({ 
      success: true,
      request: depositRequest
    })

  } catch (error) {
    console.error('Ошибка создания запроса на страховой взнос:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

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

    // Получаем запросы на страховой взнос пользователя
    const depositRequests = await prisma.depositRequest.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ 
      requests: depositRequests
    })

  } catch (error) {
    console.error('Ошибка получения запросов на страховой взнос:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}