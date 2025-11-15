import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateSession } from '@/lib/auth'

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

    // Получаем все сетевые пары с информацией о сетях
    const networkPairs = await prisma.networkPair.findMany({
      include: {
        fromNetwork: true,
        toNetwork: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ networkPairs })
  } catch (error) {
    console.error('Ошибка получения сетевых пар:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const body = await request.json()
    const { id, profitPercent, isActive } = body

    if (!id || profitPercent === undefined || isActive === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Обновляем сетевую пару
    const updatedNetworkPair = await prisma.networkPair.update({
      where: { id },
      data: {
        profitPercent: parseFloat(profitPercent),
        isActive: Boolean(isActive)
      },
      include: {
        fromNetwork: true,
        toNetwork: true
      }
    })

    return NextResponse.json({ 
      message: 'Network pair updated successfully',
      networkPair: updatedNetworkPair 
    })
  } catch (error) {
    console.error('Ошибка обновления сетевой пары:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const body = await request.json()
    const { fromNetworkId, toNetworkId, profitPercent, isActive = true } = body

    if (!fromNetworkId || !toNetworkId || profitPercent === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Проверяем, что сети существуют
    const fromNetwork = await prisma.network.findUnique({ where: { id: fromNetworkId } })
    const toNetwork = await prisma.network.findUnique({ where: { id: toNetworkId } })

    if (!fromNetwork || !toNetwork) {
      return NextResponse.json({ error: 'One or both networks not found' }, { status: 400 })
    }

    // Проверяем, не существует ли уже такая пара
    const existingPair = await prisma.networkPair.findFirst({
      where: {
        fromNetworkId,
        toNetworkId
      }
    })

    if (existingPair) {
      return NextResponse.json({ error: 'Network pair already exists' }, { status: 400 })
    }

    // Создаем новую сетевую пару
    const newNetworkPair = await prisma.networkPair.create({
      data: {
        fromNetworkId,
        toNetworkId,
        profitPercent: parseFloat(profitPercent),
        isActive: Boolean(isActive)
      },
      include: {
        fromNetwork: true,
        toNetwork: true
      }
    })

    return NextResponse.json({ 
      message: 'Network pair created successfully',
      networkPair: newNetworkPair 
    })
  } catch (error) {
    console.error('Ошибка создания сетевой пары:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing network pair ID' }, { status: 400 })
    }

    // Удаляем сетевую пару
    await prisma.networkPair.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Network pair deleted successfully' })
  } catch (error) {
    console.error('Ошибка удаления сетевой пары:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}