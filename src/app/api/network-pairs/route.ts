import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Получаем только активные сетевые пары для пользователей с информацией о сетях
    const networkPairs = await prisma.networkPair.findMany({
      where: {
        isActive: true
      },
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
