import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {

  try {
    const sessionToken = request.cookies.get('session-token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await validateSession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем баланс пользователя только из кошельков для вывода (исключая страховой депозит)
    const wallets = await prisma.wallet.findMany({
      where: { 
        userId: user.id,
        type: 'WITHDRAWAL' // Только кошельки для вывода
      },
      select: { balance: true }
    })

    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)

    return NextResponse.json({ 
      balance: totalBalance,
      currency: 'USDT'
    })
  } catch (error) {
    console.error('Error fetching user balance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
