import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  email: z.string().email('Неверный формат email'),
  telegram: z.string().optional(),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  token: z.string().min(1, 'Токен обязателен'),
  referralCode: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 НАЧАЛО РЕГИСТРАЦИИ API')
    
    const body = await request.json()
    console.log('📦 Полученные данные:', body)
    
    const { email, telegram, password, token, referralCode } = registerSchema.parse(body)
    
    console.log('🚀 НАЧАЛО РЕГИСТРАЦИИ:')
    console.log('   - Email:', email)
    console.log('   - Telegram:', telegram)
    console.log('   - Token:', token)
    console.log('   - ReferralCode:', referralCode)

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли токен для регистрации
    const tokenUser = await prisma.user.findUnique({
      where: { token },
    })

    if (!tokenUser) {
      return NextResponse.json(
        { error: 'Неверный токен регистрации' },
        { status: 400 }
      )
    }

    // Проверяем, что это токен для регистрации (временный пользователь)
    if (!tokenUser.email.startsWith('temp-') || tokenUser.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Токен уже использован' },
        { status: 400 }
      )
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword(password)

    // Реферальная система удалена

    // Создаем пользователя, заменяя временный токен
    console.log('🔄 Обновляем пользователя с токеном:', token)
    const user = await prisma.user.update({
      where: { token },
      data: {
        email,
        telegram,
        password: hashedPassword,
        status: 'PENDING',
        role: 'USER',
      },
    })
    console.log('✅ Пользователь обновлен успешно:', user.email)

    // Реферальная система удалена

    return NextResponse.json({
      message: 'Регистрация успешна. Ожидайте активации аккаунта администратором.',
      userId: user.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('❌ Registration error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
