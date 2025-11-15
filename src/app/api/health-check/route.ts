import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Health check called')
    
    // Проверяем переменные окружения
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
    }
    
    console.log('📋 Environment check:', envCheck)
    
    // Проверяем подключение к базе данных
    let dbStatus = 'DISCONNECTED'
    let userCount = 0
    
    try {
      await prisma.$connect()
      dbStatus = 'CONNECTED'
      
      // Проверяем количество пользователей
      userCount = await prisma.user.count()
      console.log('✅ Database connected, users count:', userCount)
      
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError)
      dbStatus = 'ERROR'
    } finally {
      await prisma.$disconnect()
    }
    
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        status: dbStatus,
        userCount
      },
      adminCredentials: {
        email: 'admin10@gmail.com',
        password: 'datmuf-Bajjyk-6wupde'
      }
    }
    
    console.log('✅ Health check completed:', healthStatus)
    
    return NextResponse.json(healthStatus)
    
  } catch (error) {
    console.error('❌ Health check error:', error)
    
    return NextResponse.json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
      }
    }, { status: 500 })
  }
}
