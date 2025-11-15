import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /api/admin/users вызван');
    
    const prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
    
    console.log('1. Подключаемся к базе данных...');
    await prisma.$connect();
    console.log('✅ Подключение успешно');
    
    console.log('2. Выполняем запрос пользователей...');
    const users = await prisma.user.findMany({
      where: {
        NOT: {
          email: {
            contains: 'temp-'
          }
        }
      },
      select: {
        id: true,
        email: true,
        telegram: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Найдено пользователей: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.status})`);
    });

    console.log('3. Отключаемся от базы данных...');
    await prisma.$disconnect();
    console.log('✅ Отключение успешно');

    return NextResponse.json({ users })
    
  } catch (error) {
    console.error('❌ Admin users fetch error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('🔍 PATCH /api/admin/users вызван');
    
    const { userId, status } = await request.json()
    console.log('📦 Полученные данные:', { userId, status });

    if (!userId || !status) {
      console.log('❌ Неверные параметры');
      return NextResponse.json(
        { error: 'Неверные параметры' },
        { status: 400 }
      )
    }

    const prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
    
    console.log('1. Подключаемся к базе данных...');
    await prisma.$connect();
    console.log('✅ Подключение успешно');
    
    console.log('2. Обновляем статус пользователя в БД...');
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        telegram: true,
        role: true,
        status: true,
        createdAt: true,
      }
    });

    console.log('✅ Пользователь обновлен в БД:', updatedUser.email, '->', updatedUser.status);

    // Реферальная система удалена

    console.log('3. Отключаемся от базы данных...');
    await prisma.$disconnect();
    console.log('✅ Отключение успешно');

    return NextResponse.json({ user: updatedUser });
    
  } catch (error) {
    console.error('❌ Admin user update error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
