import { NextRequest, NextResponse } from 'next/server'
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

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        telegram: user.telegram,
        role: user.role,
        status: user.status,
      },
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
