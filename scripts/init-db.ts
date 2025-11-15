import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Инициализация базы данных...')

  // Сначала создаем сети
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
  }

  console.log('Сети созданы:', createdNetworks.length)

  // Создаем сетевые пары
  const networkPairs = await Promise.all([
    prisma.networkPair.upsert({
      where: { id: 'pair-1' },
      update: {},
      create: {
        id: 'pair-1',
        fromNetworkId: createdNetworks.find(n => n.name === 'TRC20')!.id,
        toNetworkId: createdNetworks.find(n => n.name === 'BEP20')!.id,
        profitPercent: 2.5,
        isActive: true,
      },
    }),
    prisma.networkPair.upsert({
      where: { id: 'pair-2' },
      update: {},
      create: {
        id: 'pair-2',
        fromNetworkId: createdNetworks.find(n => n.name === 'BEP20')!.id,
        toNetworkId: createdNetworks.find(n => n.name === 'ERC20')!.id,
        profitPercent: 3.2,
        isActive: true,
      },
    }),
    prisma.networkPair.upsert({
      where: { id: 'pair-3' },
      update: {},
      create: {
        id: 'pair-3',
        fromNetworkId: createdNetworks.find(n => n.name === 'ERC20')!.id,
        toNetworkId: createdNetworks.find(n => n.name === 'POLYGON')!.id,
        profitPercent: 1.8,
        isActive: true,
      },
    }),
    prisma.networkPair.upsert({
      where: { id: 'pair-4' },
      update: {},
      create: {
        id: 'pair-4',
        fromNetworkId: createdNetworks.find(n => n.name === 'TRC20')!.id,
        toNetworkId: createdNetworks.find(n => n.name === 'ERC20')!.id,
        profitPercent: 2.8,
        isActive: false,
      },
    }),
  ])

  console.log('Сетевые пары созданы:', networkPairs.length)

  // Создаем тестового администратора
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

  console.log('Администратор создан:', admin.email)

  // Создаем несколько тестовых токенов для регистрации
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

  console.log('\nТокены для регистрации:')
  registrationTokens.forEach(token => {
    console.log(`- ${token}`)
  })

  console.log('Токены регистрации созданы:', registrationTokens.length)

  console.log('Инициализация завершена!')
  console.log('\nДанные для входа:')
  console.log('Email: admin@crypto.com')
  console.log('Password: admin123')
  console.log('\nТокены для регистрации:')
  registrationTokens.forEach(token => console.log(`- ${token}`))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
