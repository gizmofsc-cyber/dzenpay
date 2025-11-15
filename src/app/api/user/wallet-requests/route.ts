import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'


// Получить запросы кошельков пользователя
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/user/wallet-requests called')
    const sessionToken = request.cookies.get('session-token')?.value
    console.log('Session token:', sessionToken ? 'present' : 'missing')

    if (!sessionToken) {
      console.log('No session token found')
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 401 }
      )
    }

    const user = await validateSession(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Недействительная сессия' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Строим фильтр
    const where: any = {
      userId: user.id
    }

    if (status && status !== 'all') {
      where.status = status
    }

    // Получаем запросы кошельков пользователя
    const walletRequests = await prisma.walletRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ walletRequests })
  } catch (error) {
    console.error('Get wallet requests error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создать запрос на добавление кошелька
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/user/wallet-requests called')
    const sessionToken = request.cookies.get('session-token')?.value
    console.log('Session token:', sessionToken ? 'present' : 'missing')

    if (!sessionToken) {
      console.log('No session token found')
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 401 }
      )
    }

    const user = await validateSession(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Недействительная сессия' },
        { status: 401 }
      )
    }

    const { address, network, type, description } = await request.json()

    console.log('Received data:', { address, network, type, description })

    if (!network || !type) {
      return NextResponse.json(
        { error: 'Сеть и тип обязательны' },
        { status: 400 }
      )
    }

    // Для кошельков приема и вывода адрес обязателен
    if ((type === 'RECEIVE' || type === 'WITHDRAWAL') && !address) {
      return NextResponse.json(
        { error: 'Адрес обязателен для кошельков приема и вывода' },
        { status: 400 }
      )
    }

    if (!['DEPOSIT', 'RECEIVE', 'WITHDRAWAL'].includes(type)) {
      return NextResponse.json(
        { error: 'Тип должен быть DEPOSIT, RECEIVE или WITHDRAWAL' },
        { status: 400 }
      )
    }

    // Проверяем, что у пользователя нет активного кошелька с таким адресом (для кошельков приема и вывода)
    if ((type === 'RECEIVE' || type === 'WITHDRAWAL') && address) {
      const existingWallet = await prisma.wallet.findFirst({
        where: {
          address,
          userId: user.id,
          status: 'ACTIVE'
        }
      })

      if (existingWallet) {
        return NextResponse.json(
          { error: 'У вас уже есть активный кошелек с таким адресом' },
          { status: 400 }
        )
      }

      // Проверяем, что нет активного запроса с таким адресом
      const existingRequest = await prisma.walletRequest.findFirst({
        where: {
          address,
          userId: user.id,
          status: 'PENDING'
        }
      })

      if (existingRequest) {
        return NextResponse.json(
          { error: 'У вас уже есть активный запрос с таким адресом' },
          { status: 400 }
        )
      }
    }

    // Для кошельков вывода создаем WithdrawalRequest, для остальных - WalletRequest
    if (type === 'WITHDRAWAL') {
      console.log('Creating withdrawal request for type:', type)
      console.log('Description:', description)
      
      // Извлекаем сумму из описания
      const amountMatch = description?.match(/Сумма: ([\d.]+) USDT/)
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0
      
      console.log('Extracted amount:', amount)
      
      if (amount <= 0) {
        console.log('Invalid amount:', amount)
        return NextResponse.json(
          { error: 'Неверная сумма для вывода' },
          { status: 400 }
        )
      }

      // Проверяем баланс пользователя
      const userWallets = await prisma.wallet.findMany({
        where: { userId: user.id },
        select: { balance: true }
      })
      const userBalance = userWallets.reduce((sum, wallet) => sum + wallet.balance, 0)

      if (amount > userBalance) {
        return NextResponse.json(
          { error: 'Недостаточно средств на балансе' },
          { status: 400 }
        )
      }

      // Создаем кошелек для вывода и списываем средства в транзакции
      const result = await prisma.$transaction(async (tx) => {
        // Создаем кошелек для вывода
        const wallet = await tx.wallet.create({
          data: {
            address,
            network,
            type: 'WITHDRAWAL',
            status: 'INACTIVE', // Сначала неактивен, пока админ не одобрит
            userId: user.id,
            balance: 0,
            dailyLimit: 0,
            monthlyLimit: 0
          }
        })

        // Создаем запрос на вывод
        const withdrawalRequest = await tx.withdrawalRequest.create({
          data: {
            walletId: wallet.id,
            userId: user.id,
            amount,
            remainingAmount: amount,
            status: 'PENDING'
          }
        })

        // Списываем средства с кошельков пользователя
        let remainingAmount = amount
        const userWalletsForDeduction = await tx.wallet.findMany({
          where: {
            userId: user.id,
            balance: { gt: 0 }
          },
          orderBy: { balance: 'desc' }
        })

        for (const userWallet of userWalletsForDeduction) {
          if (remainingAmount <= 0) break

          const deductionAmount = Math.min(remainingAmount, userWallet.balance)

          await tx.wallet.update({
            where: { id: userWallet.id },
            data: { balance: userWallet.balance - deductionAmount }
          })

          // Создаем транзакцию для отслеживания списания
          await tx.walletTransaction.create({
            data: {
              walletId: userWallet.id,
              type: 'OUTGOING',
              amount: deductionAmount,
              balance: userWallet.balance - deductionAmount,
              status: 'COMPLETED',
              fromAddress: userWallet.address,
              toAddress: 'WITHDRAWAL_REQUEST',
              hash: `WITHDRAWAL_${withdrawalRequest.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }
          })

          remainingAmount -= deductionAmount
        }

        return { wallet, withdrawalRequest }
      })

      const { wallet, withdrawalRequest } = result

      console.log('Withdrawal request created successfully:', withdrawalRequest.id)
      console.log('Wallet created:', wallet.id)

      return NextResponse.json({ 
        message: 'Запрос на вывод средств отправлен администратору',
        withdrawalRequest 
      })
    } else {
      // Создаем запрос на добавление кошелька (для DEPOSIT и RECEIVE)
      const walletRequest = await prisma.walletRequest.create({
        data: {
          address: address || null, // Для кошельков пополнения адрес может быть null
          network,
          type,
          description: description || null,
          userId: user.id,
          status: 'PENDING'
        }
      })

      return NextResponse.json({ 
        message: 'Запрос на добавление кошелька отправлен администратору',
        walletRequest 
      })
    }
  } catch (error) {
    console.error('Create wallet request error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
