const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')

// Подключаемся к SQLite базе
const db = new sqlite3.Database('./prisma/dev.db')

async function exportData() {
  console.log('🚀 Экспортируем данные из SQLite...')
  
  try {
    // Экспортируем пользователей
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM User', (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
    
    // Экспортируем кошельки
    const wallets = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM Wallet', (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
    
    // Экспортируем запросы кошельков
    const walletRequests = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM WalletRequest', (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
    
    // Экспортируем платежи
    const payments = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM Payment', (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
    
    // Экспортируем транзакции
    const transactions = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM WalletTransaction', (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
    
    // Экспортируем сетевые пары
    const networkPairs = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM NetworkPair', (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
    
    // Экспортируем сессии
    const sessions = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM Session', (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
    
    const exportData = {
      users,
      wallets,
      walletRequests,
      payments,
      transactions,
      networkPairs,
      sessions
    }
    
    // Сохраняем в JSON файл
    fs.writeFileSync('./data-export.json', JSON.stringify(exportData, null, 2))
    
    console.log(`📊 Экспортировано данных:`)
    console.log(`   - Пользователи: ${users.length}`)
    console.log(`   - Кошельки: ${wallets.length}`)
    console.log(`   - Запросы кошельков: ${walletRequests.length}`)
    console.log(`   - Платежи: ${payments.length}`)
    console.log(`   - Транзакции: ${transactions.length}`)
    console.log(`   - Сетевые пары: ${networkPairs.length}`)
    console.log(`   - Сессии: ${sessions.length}`)
    console.log('✅ Данные экспортированы в data-export.json')
    
  } catch (error) {
    console.error('❌ Ошибка экспорта:', error)
  } finally {
    db.close()
  }
}

exportData()
