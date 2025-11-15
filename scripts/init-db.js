const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function initDatabase() {
  try {
    console.log('🔄 Инициализация базы данных...')
    
    // Проверяем, есть ли уже админ
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (existingAdmin) {
      console.log('✅ Админ уже существует:', existingAdmin.email)
      return
    }
    
    // Создаем админа
    const hashedPassword = await bcrypt.hash('datmuf-Bajjyk-6wupde', 10)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin10@gmail.com',
        password: hashedPassword,
        token: 'admin-token-' + Date.now(),
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    })
    
    console.log('✅ Админ создан:', admin.email)
    
    // Создаем базовые сети
    const networks = [
      { name: 'TRC20', displayName: 'TRC20 (TRON)', isActive: true },
      { name: 'BEP20', displayName: 'BEP20 (BSC)', isActive: true },
      { name: 'ERC20', displayName: 'ERC20 (Ethereum)', isActive: true },
      { name: 'POLYGON', displayName: 'POLYGON', isActive: true }
    ]
    
    for (const network of networks) {
      const existingNetwork = await prisma.network.findFirst({
        where: { name: network.name }
      })
      
      if (!existingNetwork) {
        await prisma.network.create({
          data: network
        })
        console.log('✅ Сеть создана:', network.name)
      } else {
        console.log('✅ Сеть уже существует:', network.name)
      }
    }
    
    console.log('✅ Инициализация завершена!')
    
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error)
  } finally {
    await prisma.$disconnect()
  }
}

initDatabase()
