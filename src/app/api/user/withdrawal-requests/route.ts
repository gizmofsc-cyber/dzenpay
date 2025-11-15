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

    const withdrawalRequests = await prisma.withdrawalRequest.findMany({
      where: { userId: user.id },
      include: {
        wallet: {
          select: {
            id: true,
            address: true,
            network: true,
            type: true
          }
        },
        earnings: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ withdrawalRequests })
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await validateSession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { walletId, amount } = await request.json()

    if (!walletId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid wallet ID or amount' }, { status: 400 })
    }

    // Проверяем, что кошелек принадлежит пользователю и является кошельком для вывода
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: user.id,
        type: 'WITHDRAWAL',
        status: 'ACTIVE'
      }
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found or not available for withdrawal' }, { status: 404 })
    }

    // Проверяем баланс пользователя (только кошельки для вывода, не страховой депозит)
    const userWallets = await prisma.wallet.findMany({
      where: { 
        userId: user.id,
        type: 'WITHDRAWAL' // Только кошельки для вывода
      },
      select: { balance: true }
    })

    const userBalance = userWallets.reduce((sum, wallet) => sum + wallet.balance, 0)

    if (amount > userBalance) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Проверяем страховой депозит
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        insuranceDepositAmount: true,
        insuranceDepositPaid: true
      }
    })

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isInsuranceDepositPaid = userData.insuranceDepositAmount 
      ? userData.insuranceDepositPaid >= userData.insuranceDepositAmount 
      : true

    if (!isInsuranceDepositPaid) {
      return NextResponse.json({ error: 'Insurance deposit must be paid before creating withdrawal requests' }, { status: 400 })
    }

    // Проверяем, что кошелек не находится в работе
    const existingRequest = await prisma.withdrawalRequest.findFirst({
      where: {
        walletId: walletId,
        status: {
          in: ['PENDING', 'IN_WORK']
        }
      }
    })

    if (existingRequest) {
      return NextResponse.json({ error: 'Wallet is already in use for another withdrawal request' }, { status: 400 })
    }

    // Создаем запрос на вывод и списываем средства с баланса
    const withdrawalRequest = await prisma.$transaction(async (tx) => {
      // Создаем запрос на вывод
      const request = await tx.withdrawalRequest.create({
        data: {
          walletId: walletId,
          amount: amount,
          remainingAmount: amount,
          userId: user.id
        },
        include: {
          wallet: {
            select: {
              id: true,
              address: true,
              network: true,
              type: true
            }
          }
        }
      })

      // Списываем средства с кошельков пользователя (исключая кошелек для пополнения - страховой депозит)
      let remainingAmount = amount
      const userWalletsForDeduction = await tx.wallet.findMany({
        where: { 
          userId: user.id,
          balance: { gt: 0 },
          type: 'WITHDRAWAL' // Только кошельки для вывода, не страховой депозит
        },
        orderBy: { balance: 'desc' }
      })

      for (const wallet of userWalletsForDeduction) {
        if (remainingAmount <= 0) break

        const deductionAmount = Math.min(remainingAmount, wallet.balance)
        
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: wallet.balance - deductionAmount }
        })

        // Создаем транзакцию для отслеживания списания
        await tx.walletTransaction.create({
          data: {
            hash: `WITHDRAWAL_${request.id}_${Date.now()}`,
            walletId: wallet.id,
            type: 'OUTGOING',
            amount: deductionAmount,
            balance: wallet.balance - deductionAmount,
            status: 'COMPLETED',
            fromAddress: wallet.address,
            toAddress: 'WITHDRAWAL_REQUEST'
          }
        })

        remainingAmount -= deductionAmount
      }

      return request
    })

    return NextResponse.json({
      message: 'Withdrawal request created successfully',
      withdrawalRequest
    })
  } catch (error) {
    console.error('Error creating withdrawal request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
