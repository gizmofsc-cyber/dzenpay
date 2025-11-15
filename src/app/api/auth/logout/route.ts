import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value

    if (sessionToken) {
      await deleteSession(sessionToken)
    }

    const response = NextResponse.json({ message: 'Выход успешен' })
    response.cookies.delete('session-token')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
