import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      database: 'unknown',
      environment: 'unknown'
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
    }
  }

  try {
    // Проверяем подключение к базе данных
    await prisma.$queryRaw`SELECT 1`
    healthCheck.services.database = 'ok'
  } catch (error) {
    healthCheck.services.database = 'error'
    healthCheck.status = 'error'
  }

  // Проверяем переменные окружения
  const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET']
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingEnvVars.length > 0) {
    healthCheck.services.environment = 'error'
    healthCheck.status = 'error'
  } else {
    healthCheck.services.environment = 'ok'
  }

  const statusCode = healthCheck.status === 'ok' ? 200 : 500

  return NextResponse.json(healthCheck, { status: statusCode })
}
