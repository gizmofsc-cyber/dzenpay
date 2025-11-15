import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createSession } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const loginSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(1, 'Пароль обязателен'),
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/auth/login called')
    
    const body = await request.json()
    console.log('📦 Request body received:', { email: body.email, password: '[HIDDEN]' })
    
    const { email, password } = loginSchema.parse(body)
    console.log('✅ Request validation passed')

    // Проверяем подключение к базе данных
    console.log('🔗 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Находим пользователя
    console.log('🔍 Searching for user:', email)
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log('❌ User not found:', email)
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    console.log('✅ User found:', { id: user.id, email: user.email, status: user.status })

    // Проверяем пароль
    console.log('🔐 Verifying password...')
    const isValidPassword = await verifyPassword(password, user.password)
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', email)
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    console.log('✅ Password verified successfully')

    // Проверяем статус пользователя
    if (user.status === 'PENDING') {
      console.log('⚠️ User account pending:', email)
      return NextResponse.json(
        { error: 'Аккаунт ожидает активации администратором' },
        { status: 403 }
      )
    }

    if (user.status === 'BLOCKED') {
      console.log('🚫 User account blocked:', email)
      return NextResponse.json(
        { error: 'Аккаунт заблокирован' },
        { status: 403 }
      )
    }

    // Создаем сессию
    console.log('🎫 Creating session for user:', user.id)
    const sessionToken = await createSession(user.id)
    console.log('✅ Session created successfully')

    const response = NextResponse.json({
      message: 'Вход успешен',
      user: {
        id: user.id,
        email: user.email,
        telegram: user.telegram,
        role: user.role,
        status: user.status,
      },
    })

    // Устанавливаем cookie с токеном сессии
    response.cookies.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 дней
    })

    console.log('✅ Login successful for user:', email)
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ Validation error:', error.errors)
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('❌ Login error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database disconnected')
  }
}
