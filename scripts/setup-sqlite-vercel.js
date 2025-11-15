// Альтернативное решение - использовать SQLite на Vercel
// через внешний сервис типа Turso или PlanetScale

const { PrismaClient } = require('@prisma/client')

// Для Turso (SQLite в облаке)
const tursoClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TURSO_DATABASE_URL
    }
  }
})

// Для PlanetScale (MySQL совместимый)
const planetScaleClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PLANETSCALE_DATABASE_URL
    }
  }
})

async function setupDatabase() {
  console.log('🚀 Настраиваем базу данных для Vercel...')
  
  try {
    // Проверяем доступность Turso
    if (process.env.TURSO_DATABASE_URL) {
      await tursoClient.$connect()
      console.log('✅ Turso подключен')
      await tursoClient.$disconnect()
    }
    
    // Проверяем доступность PlanetScale
    if (process.env.PLANETSCALE_DATABASE_URL) {
      await planetScaleClient.$connect()
      console.log('✅ PlanetScale подключен')
      await planetScaleClient.$disconnect()
    }
    
    console.log('🎉 База данных готова!')
    
  } catch (error) {
    console.error('❌ Ошибка настройки:', error)
  }
}

setupDatabase()
