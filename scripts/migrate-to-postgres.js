const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// SQLite клиент для чтения данных
const sqliteClient = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
})

// PostgreSQL клиент для записи данных
const postgresClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function migrateData() {
  console.log('🚀 Начинаем миграцию данных...')
  
  try {
    // Подключаемся к PostgreSQL
    await postgresClient.$connect()
    console.log('✅ Подключение к PostgreSQL установлено')
    
    // Читаем данные из SQLite
    console.log('📖 Читаем данные из SQLite...')
    
    const users = await sqliteClient.user.findMany()
    const wallets = await sqliteClient.wallet.findMany()
    const walletRequests = await sqliteClient.walletRequest.findMany()
    const payments = await sqliteClient.payment.findMany()
    const transactions = await sqliteClient.walletTransaction.findMany()
    const networkPairs = await sqliteClient.networkPair.findMany()
    const sessions = await sqliteClient.session.findMany()
    
    console.log(`📊 Найдено данных:`)
    console.log(`   - Пользователи: ${users.length}`)
    console.log(`   - Кошельки: ${wallets.length}`)
    console.log(`   - Запросы кошельков: ${walletRequests.length}`)
    console.log(`   - Платежи: ${payments.length}`)
    console.log(`   - Транзакции: ${transactions.length}`)
    console.log(`   - Сетевые пары: ${networkPairs.length}`)
    console.log(`   - Сессии: ${sessions.length}`)
    
    // Мигрируем данные в PostgreSQL
    console.log('🔄 Мигрируем данные в PostgreSQL...')
    
    // Пользователи
    for (const user of users) {
      await postgresClient.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      })
    }
    console.log('✅ Пользователи мигрированы')
    
    // Кошельки
    for (const wallet of wallets) {
      await postgresClient.wallet.upsert({
        where: { id: wallet.id },
        update: wallet,
        create: wallet
      })
    }
    console.log('✅ Кошельки мигрированы')
    
    // Запросы кошельков
    for (const request of walletRequests) {
      await postgresClient.walletRequest.upsert({
        where: { id: request.id },
        update: request,
        create: request
      })
    }
    console.log('✅ Запросы кошельков мигрированы')
    
    // Платежи
    for (const payment of payments) {
      await postgresClient.payment.upsert({
        where: { id: payment.id },
        update: payment,
        create: payment
      })
    }
    console.log('✅ Платежи мигрированы')
    
    // Транзакции
    for (const transaction of transactions) {
      await postgresClient.walletTransaction.upsert({
        where: { id: transaction.id },
        update: transaction,
        create: transaction
      })
    }
    console.log('✅ Транзакции мигрированы')
    
    // Сетевые пары
    for (const pair of networkPairs) {
      await postgresClient.networkPair.upsert({
        where: { id: pair.id },
        update: pair,
        create: pair
      })
    }
    console.log('✅ Сетевые пары мигрированы')
    
    // Сессии
    for (const session of sessions) {
      await postgresClient.session.upsert({
        where: { id: session.id },
        update: session,
        create: session
      })
    }
    console.log('✅ Сессии мигрированы')
    
    console.log('🎉 Миграция завершена успешно!')
    
  } catch (error) {
    console.error('❌ Ошибка миграции:', error)
  } finally {
    await sqliteClient.$disconnect()
    await postgresClient.$disconnect()
  }
}

// Запускаем миграцию
migrateData()
