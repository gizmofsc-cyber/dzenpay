const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetDatabase() {
  try {
    console.log('🔄 Начинаем сброс базы данных...')
    
    // Удаляем все данные, кроме админа
    console.log('1. Удаляем всех пользователей кроме админа...')
    await prisma.user.deleteMany({
      where: {
        NOT: {
          email: 'admin@crypto.com'
        }
      }
    })
    
    console.log('2. Удаляем все кошельки...')
    await prisma.wallet.deleteMany({})
    
    console.log('3. Удаляем все сессии...')
    await prisma.session.deleteMany({})
    
    console.log('4. Удаляем все запросы кошельков...')
    await prisma.walletRequest.deleteMany({})
    
    console.log('5. Удаляем все запросы пополнения...')
    await prisma.depositRequest.deleteMany({})
    
    console.log('6. Удаляем все запросы получения...')
    await prisma.receiveRequest.deleteMany({})
    
    console.log('7. Удаляем все запросы вывода...')
    await prisma.withdrawalRequest.deleteMany({})
    
    console.log('8. Удаляем все реферальные связи...')
    await prisma.referral.deleteMany({})
    
    console.log('9. Удаляем все доходы кошельков...')
    await prisma.walletEarning.deleteMany({})
    
    console.log('10. Удаляем все платежи...')
    await prisma.payment.deleteMany({})
    
    console.log('11. Удаляем все тикеты поддержки...')
    await prisma.supportTicket.deleteMany({})
    
    // Сбрасываем страховые депозиты админа
    console.log('12. Сбрасываем страховые депозиты админа...')
    await prisma.user.update({
      where: { email: 'admin@crypto.com' },
      data: {
        insuranceDepositAmount: null,
        insuranceDepositPaid: 0,
        referralCodeUsed: null
      }
    })
    
    console.log('✅ База данных успешно сброшена!')
    console.log('📊 Сохранен только админ: admin@crypto.com')
    
  } catch (error) {
    console.error('❌ Ошибка при сбросе базы данных:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetDatabase()
