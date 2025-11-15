import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {

  try {
    const sessionToken = request.cookies.get('session-token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await validateSession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем все активные сети
    const networks = await prisma.network.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ networks })
  } catch (error) {
    console.error('Error fetching networks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await validateSession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, displayName } = await request.json()

    if (!name || !displayName) {
      return NextResponse.json({ error: 'Name and display name are required' }, { status: 400 })
    }

    // Проверяем, что сеть с таким именем не существует
    const existingNetwork = await prisma.network.findUnique({
      where: { name }
    })

    if (existingNetwork) {
      return NextResponse.json({ error: 'Network with this name already exists' }, { status: 400 })
    }

    // Создаем новую сеть (по умолчанию неактивна, требует одобрения админа)
    const network = await prisma.network.create({
      data: {
        name,
        displayName,
        isActive: false // Пользовательские сети требуют одобрения админа
      }
    })

    return NextResponse.json({
      message: 'Network created successfully and sent for admin approval',
      network
    })
  } catch (error) {
    console.error('Error creating network:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
