const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initNetworkPairs() {
  try {
    console.log('🔄 Инициализация сетевых пар...')
    
    // Получаем все сети
    const networks = await prisma.network.findMany({
      where: { isActive: true }
    })
    
    console.log('📋 Найдено сетей:', networks.length)
    
    // Создаем пары между всеми сетями
    for (let i = 0; i < networks.length; i++) {
      for (let j = 0; j < networks.length; j++) {
        if (i !== j) {
          const fromNetwork = networks[i]
          const toNetwork = networks[j]
          
          // Проверяем, существует ли уже такая пара
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
                profitPercent: 5.0, // 5% прибыль по умолчанию
                isActive: true
              }
            })
            console.log(`✅ Пара создана: ${fromNetwork.name} → ${toNetwork.name}`)
          } else {
            console.log(`✅ Пара уже существует: ${fromNetwork.name} → ${toNetwork.name}`)
          }
        }
      }
    }
    
    console.log('✅ Инициализация сетевых пар завершена!')
    
  } catch (error) {
    console.error('❌ Ошибка инициализации сетевых пар:', error)
  } finally {
    await prisma.$disconnect()
  }
}

initNetworkPairs()
