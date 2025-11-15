const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function importData() {
  console.log('🚀 Импортируем данные в PostgreSQL...')
  
  try {
    // Читаем экспортированные данные
    const data = JSON.parse(fs.readFileSync('./data-export.json', 'utf8'))
    
    console.log(`📊 Импортируем данные:`)
    console.log(`   - Пользователи: ${data.users.length}`)
    console.log(`   - Кошельки: ${data.wallets.length}`)
    console.log(`   - Запросы кошельков: ${data.walletRequests.length}`)
    console.log(`   - Платежи: ${data.payments.length}`)
    console.log(`   - Транзакции: ${data.transactions.length}`)
    console.log(`   - Сетевые пары: ${data.networkPairs.length}`)
    console.log(`   - Сессии: ${data.sessions.length}`)
    
    // Импортируем пользователей
    for (const user of data.users) {
      const userData = {
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      }
      await prisma.user.upsert({
        where: { id: user.id },
        update: userData,
        create: userData
      })
    }
    console.log('✅ Пользователи импортированы')
    
    // Импортируем кошельки
    for (const wallet of data.wallets) {
      const walletData = {
        ...wallet,
        createdAt: new Date(wallet.createdAt),
        updatedAt: new Date(wallet.updatedAt),
        lastChecked: wallet.lastChecked ? new Date(wallet.lastChecked) : null
      }
      await prisma.wallet.upsert({
        where: { id: wallet.id },
        update: walletData,
        create: walletData
      })
    }
    console.log('✅ Кошельки импортированы')
    
    // Импортируем запросы кошельков
    for (const request of data.walletRequests) {
      const requestData = {
        ...request,
        createdAt: new Date(request.createdAt),
        updatedAt: new Date(request.updatedAt)
      }
      await prisma.walletRequest.upsert({
        where: { id: request.id },
        update: requestData,
        create: requestData
      })
    }
    console.log('✅ Запросы кошельков импортированы')
    
    // Импортируем платежи
    for (const payment of data.payments) {
      const paymentData = {
        ...payment,
        createdAt: new Date(payment.createdAt),
        updatedAt: new Date(payment.updatedAt),
        transferTime: payment.transferTime ? new Date(payment.transferTime) : null
      }
      await prisma.payment.upsert({
        where: { id: payment.id },
        update: paymentData,
        create: paymentData
      })
    }
    console.log('✅ Платежи импортированы')
    
    // Импортируем транзакции
    for (const transaction of data.transactions) {
      const transactionData = {
        ...transaction,
        createdAt: new Date(transaction.createdAt),
        updatedAt: new Date(transaction.updatedAt)
      }
      await prisma.walletTransaction.upsert({
        where: { id: transaction.id },
        update: transactionData,
        create: transactionData
      })
    }
    console.log('✅ Транзакции импортированы')
    
    // Импортируем сетевые пары
    for (const pair of data.networkPairs) {
      const pairData = {
        ...pair,
        isActive: Boolean(pair.isActive),
        createdAt: new Date(pair.createdAt),
        updatedAt: new Date(pair.updatedAt)
      }
      await prisma.networkPair.upsert({
        where: { id: pair.id },
        update: pairData,
        create: pairData
      })
    }
    console.log('✅ Сетевые пары импортированы')
    
    // Импортируем сессии
    for (const session of data.sessions) {
      const sessionData = {
        ...session,
        createdAt: new Date(session.createdAt),
        expiresAt: new Date(session.expiresAt)
      }
      await prisma.session.upsert({
        where: { id: session.id },
        update: sessionData,
        create: sessionData
      })
    }
    console.log('✅ Сессии импортированы')
    
    console.log('🎉 Импорт завершен успешно!')
    
  } catch (error) {
    console.error('❌ Ошибка импорта:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importData()
