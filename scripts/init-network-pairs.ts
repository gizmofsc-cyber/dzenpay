import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initNetworkPairs() {
  try {
    console.log('Инициализация сетевых пар...')

    // Сначала создаем сети, если их нет
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

    // Создаем сетевые пары, если их еще нет
    const networkPairs = [
      {
        fromNetworkName: 'TRC20',
        toNetworkName: 'BEP20',
        profitPercent: 2.5,
        isActive: true
      },
      {
        fromNetworkName: 'BEP20',
        toNetworkName: 'ERC20',
        profitPercent: 3.2,
        isActive: true
      },
      {
        fromNetworkName: 'ERC20',
        toNetworkName: 'POLYGON',
        profitPercent: 1.8,
        isActive: true
      },
      {
        fromNetworkName: 'TRC20',
        toNetworkName: 'ERC20',
        profitPercent: 2.8,
        isActive: false
      }
    ]

    for (const pair of networkPairs) {
      const fromNetwork = createdNetworks.find(n => n.name === pair.fromNetworkName)!
      const toNetwork = createdNetworks.find(n => n.name === pair.toNetworkName)!

      const existingPair = await prisma.networkPair.findFirst({
        where: {
          fromNetworkId: fromNetwork.id,
          toNetworkId: toNetwork.id
        }
      })

      if (!existingPair) {
        await prisma.networkPair.create({
          data: {
            fromNetworkId: fromNetwork.id,
            toNetworkId: toNetwork.id,
            profitPercent: pair.profitPercent,
            isActive: pair.isActive
          }
        })
        console.log(`Создана сетевая пара: ${pair.fromNetworkName} ↔ ${pair.toNetworkName} (${pair.profitPercent}%)`)
      } else {
        console.log(`Сетевая пара уже существует: ${pair.fromNetworkName} ↔ ${pair.toNetworkName}`)
      }
    }

    console.log('Инициализация сетевых пар завершена!')
  } catch (error) {
    console.error('Ошибка инициализации сетевых пар:', error)
  } finally {
    await prisma.$disconnect()
  }
}

initNetworkPairs()
