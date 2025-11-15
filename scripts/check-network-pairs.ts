import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkNetworkPairs() {
  try {
    console.log('Проверяем сетевые пары в базе данных...')

    const networkPairs = await prisma.networkPair.findMany({
      include: {
        fromNetwork: true,
        toNetwork: true
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`Найдено сетевых пар: ${networkPairs.length}`)
    
    networkPairs.forEach((pair, index) => {
      console.log(`${index + 1}. ${pair.fromNetwork.displayName} ↔ ${pair.toNetwork.displayName} (${pair.profitPercent}%) - ${pair.isActive ? 'Активна' : 'Неактивна'}`)
    })

    if (networkPairs.length === 0) {
      console.log('Сетевых пар не найдено! Создаем тестовые данные...')
      
      // Сначала создаем сети
      const networks = [
        { name: 'TRC20', displayName: 'TRON (TRC20)', isActive: true },
        { name: 'BEP20', displayName: 'BSC (BEP20)', isActive: true },
        { name: 'ERC20', displayName: 'Ethereum (ERC20)', isActive: true },
        { name: 'POLYGON', displayName: 'Polygon', isActive: true }
      ]

      const createdNetworks = []
      for (const network of networks) {
        const created = await prisma.network.upsert({
          where: { name: network.name },
          update: {},
          create: network
        })
        createdNetworks.push(created)
        console.log(`Создана сеть: ${created.displayName}`)
      }

      // Теперь создаем пары сетей
      const testPairs = [
        {
          fromNetworkId: createdNetworks.find(n => n.name === 'TRC20')!.id,
          toNetworkId: createdNetworks.find(n => n.name === 'BEP20')!.id,
          profitPercent: 2.5,
          isActive: true
        },
        {
          fromNetworkId: createdNetworks.find(n => n.name === 'BEP20')!.id,
          toNetworkId: createdNetworks.find(n => n.name === 'ERC20')!.id,
          profitPercent: 3.2,
          isActive: true
        },
        {
          fromNetworkId: createdNetworks.find(n => n.name === 'ERC20')!.id,
          toNetworkId: createdNetworks.find(n => n.name === 'POLYGON')!.id,
          profitPercent: 1.8,
          isActive: true
        },
        {
          fromNetworkId: createdNetworks.find(n => n.name === 'TRC20')!.id,
          toNetworkId: createdNetworks.find(n => n.name === 'ERC20')!.id,
          profitPercent: 2.8,
          isActive: false
        }
      ]

      for (const pair of testPairs) {
        await prisma.networkPair.create({
          data: pair
        })
        const fromNetwork = createdNetworks.find(n => n.id === pair.fromNetworkId)!
        const toNetwork = createdNetworks.find(n => n.id === pair.toNetworkId)!
        console.log(`Создана сетевая пара: ${fromNetwork.displayName} ↔ ${toNetwork.displayName}`)
      }
    }
  } catch (error) {
    console.error('Ошибка проверки сетевых пар:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkNetworkPairs()
