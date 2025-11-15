const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function initVercelDatabase() {
  try {
    console.log('Инициализация базы данных для Vercel...')

    // Проверяем подключение
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Подключение к базе данных успешно')

    // Создаем сети
    const networks = [
      { id: 'network-trc20', name: 'TRC20', displayName: 'TRON (TRC20)', isActive: true },
      { id: 'network-bep20', name: 'BEP20', displayName: 'BSC (BEP20)', isActive: true },
      { id: 'network-erc20', name: 'ERC20', displayName: 'Ethereum (ERC20)', isActive: true },
      { id: 'network-polygon', name: 'POLYGON', displayName: 'Polygon', isActive: true }
    ]

    const createdNetworks = []
    for (const network of networks) {
      const created = await prisma.network.upsert({
        where: { id: network.id },
        update: {},
        create: network
      })
      createdNetworks.push(created)
      console.log(`✅ Создана сеть: ${created.displayName}`)
    }

    // Создаем сетевые пары
    const networkPairs = [
      {
        id: 'pair-1',
        fromNetworkId: createdNetworks.find(n => n.name === 'TRC20').id,
        toNetworkId: createdNetworks.find(n => n.name === 'BEP20').id,
        profitPercent: 2.5,
        isActive: true,
      },
      {
        id: 'pair-2',
        fromNetworkId: createdNetworks.find(n => n.name === 'BEP20').id,
        toNetworkId: createdNetworks.find(n => n.name === 'ERC20').id,
        profitPercent: 3.2,
        isActive: true,
      },
      {
        id: 'pair-3',
        fromNetworkId: createdNetworks.find(n => n.name === 'ERC20').id,
        toNetworkId: createdNetworks.find(n => n.name === 'POLYGON').id,
        profitPercent: 1.8,
        isActive: true,
      },
    ]

    for (const pair of networkPairs) {
      await prisma.networkPair.upsert({
        where: { id: pair.id },
        update: {},
        create: pair
      })
      const fromNetwork = createdNetworks.find(n => n.id === pair.fromNetworkId)
      const toNetwork = createdNetworks.find(n => n.id === pair.toNetworkId)
      console.log(`✅ Создана сетевая пара: ${fromNetwork.displayName} ↔ ${toNetwork.displayName}`)
    }

    // Создаем администратора
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@crypto.com' },
      update: {},
      create: {
        email: 'admin@crypto.com',
        password: hashedPassword,
        token: 'ADMIN-TOKEN-2024',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    })

    console.log('✅ Администратор создан:', admin.email)

    // Создаем тестовые токены для регистрации
    const registrationTokens = [
      'TOKEN-001-2024',
      'TOKEN-002-2024',
      'TOKEN-003-2024',
      'TOKEN-004-2024',
      'TOKEN-005-2024',
    ]

    for (const token of registrationTokens) {
      await prisma.user.upsert({
        where: { token },
        update: {},
        create: {
          email: `temp-${token}@example.com`,
          password: await bcrypt.hash('temp', 12),
          token,
          role: 'USER',
          status: 'PENDING',
        },
      })
    }

    console.log('✅ Токены регистрации созданы:', registrationTokens.length)
    console.log('\n🎉 Инициализация базы данных завершена!')
    console.log('\n📋 Данные для входа:')
    console.log('Email: admin@crypto.com')
    console.log('Password: admin123')
    console.log('\n🔑 Токены для регистрации:')
    registrationTokens.forEach(token => console.log(`- ${token}`))

  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Запускаем инициализацию
initVercelDatabase()
  .then(() => {
    console.log('✅ Скрипт завершен успешно')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Скрипт завершен с ошибкой:', error)
    process.exit(1)
  })
