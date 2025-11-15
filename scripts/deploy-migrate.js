const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting database migration...')
  
  try {
    // Проверяем подключение
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Выполняем миграции
    const { execSync } = require('child_process')
    execSync('npx prisma db push', { stdio: 'inherit' })
    console.log('✅ Database schema updated successfully')
    
    // Создаем админа если его нет
    const adminExists = await prisma.user.findFirst({
      where: { email: 'admin@crypto.com' }
    })
    
    if (!adminExists) {
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('admin123', 10)
      
      await prisma.user.create({
        data: {
          email: 'admin@crypto.com',
          password: hashedPassword,
          token: 'admin-token-' + Date.now(),
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      console.log('✅ Admin user created: admin@crypto.com / admin123')
    } else {
      console.log('ℹ️ Admin user already exists')
    }
    
    // Создаем тестовые сетевые пары
    const networkPairs = [
      { fromNetwork: 'TRC20', toNetwork: 'BEP20', profitPercent: 2.5 },
      { fromNetwork: 'BEP20', toNetwork: 'ERC20', profitPercent: 3.0 },
      { fromNetwork: 'ERC20', toNetwork: 'POLYGON', profitPercent: 1.8 },
      { fromNetwork: 'TRC20', toNetwork: 'ERC20', profitPercent: 4.2 }
    ]
    
    for (const pair of networkPairs) {
      const exists = await prisma.networkPair.findFirst({
        where: {
          fromNetwork: pair.fromNetwork,
          toNetwork: pair.toNetwork
        }
      })
      
      if (!exists) {
        await prisma.networkPair.create({
          data: pair
        })
        console.log(`✅ Created network pair: ${pair.fromNetwork} → ${pair.toNetwork}`)
      }
    }
    
    console.log('🎉 Database setup completed successfully!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
