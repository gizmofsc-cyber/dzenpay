const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTest3Referral() {
  console.log('🔧 Создаем реферальную связь для test3@gmail.com...');
  
  // Находим админа
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@crypto.com' }
  });
  
  if (!admin) {
    console.log('❌ Админ не найден');
    return;
  }
  
  // Находим test3@gmail.com
  const user = await prisma.user.findFirst({
    where: { email: 'test3@gmail.com' }
  });
  
  if (!user) {
    console.log('❌ Пользователь test3@gmail.com не найден');
    return;
  }
  
  console.log('✅ Админ найден:', admin.email);
  console.log('✅ Пользователь найден:', user.email);
  
  // Создаем реферальную связь
  const referralCode = 'admin@crypto.com';
  const newReferral = await prisma.referral.create({
    data: {
      referralCode,
      referrerId: admin.id,
      referredUserId: user.id,
      commissionPercent: 15.0,
      totalEarnings: 0
    }
  });
  
  console.log('✅ Реферальная связь создана:', newReferral.id);
  
  // Проверяем результат
  const allReferrals = await prisma.referral.findMany({
    where: { referrerId: admin.id },
    include: {
      referredUser: { select: { email: true } }
    }
  });
  
  console.log(`\n📊 Всего рефералов у админа: ${allReferrals.length}`);
  allReferrals.forEach(ref => {
    console.log(`   - ${ref.referredUser.email} (код: ${ref.referralCode})`);
  });
  
  await prisma.$disconnect();
}

fixTest3Referral().catch(console.error);
