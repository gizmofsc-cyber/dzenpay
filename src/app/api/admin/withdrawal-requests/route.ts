import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {

  try {
    console.log('GET /api/admin/withdrawal-requests called')
    const sessionToken = request.cookies.get('session-token')?.value
    if (!sessionToken) {
      console.log('No session token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await validateSession(sessionToken)
    if (!user || user.role !== 'ADMIN') {
      console.log('User not admin or not found:', user?.role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Admin user found:', user.email)

    const withdrawalRequests = await prisma.withdrawalRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegram: true,
            status: true
          }
        },
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

    console.log('Found withdrawal requests:', withdrawalRequests.length)
    console.log('Withdrawal requests:', withdrawalRequests)

    return NextResponse.json({ withdrawalRequests })
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('PATCH /api/admin/withdrawal-requests called')
    const sessionToken = request.cookies.get('session-token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await validateSession(sessionToken)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId, action, paidAmount, profit, adminNotes } = await request.json()
    
    console.log('Received data:', { requestId, action, paidAmount, profit, adminNotes })

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 })
    }

    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
      include: {
        wallet: true,
        user: true
      }
    })

    if (!withdrawalRequest) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 })
    }

    let updatedRequest

    switch (action) {
      case 'APPROVE':
        updatedRequest = await prisma.withdrawalRequest.update({
          where: { id: requestId },
          data: {
            status: 'IN_WORK'
          },
          include: {
            wallet: true,
            user: true,
            earnings: true
          }
        })

        // Обновляем статус кошелька на "в работе"
        await prisma.wallet.update({
          where: { id: withdrawalRequest.walletId },
          data: { status: 'IN_WORK' }
        })
        break

      case 'REJECT':
        // Возвращаем баланс на кошелек пользователя
        await prisma.wallet.update({
          where: { id: withdrawalRequest.walletId },
          data: {
            balance: {
              increment: withdrawalRequest.amount
            },
            status: 'ACTIVE' // Возвращаем кошелек в активное состояние
          }
        })

        updatedRequest = await prisma.withdrawalRequest.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED',
            adminNotes: adminNotes
          },
          include: {
            wallet: true,
            user: true,
            earnings: true
          }
        })
        break

      case 'UPDATE_PAYMENT':
        if (paidAmount === undefined || paidAmount < 0) {
          return NextResponse.json({ error: 'Invalid paid amount' }, { status: 400 })
        }

        const newPaidAmount = Math.min(paidAmount, withdrawalRequest.amount)
        const newRemainingAmount = withdrawalRequest.amount - newPaidAmount

        updatedRequest = await prisma.withdrawalRequest.update({
          where: { id: requestId },
          data: {
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            adminNotes: adminNotes
          },
          include: {
            wallet: true,
            user: true,
            earnings: true
          }
        })
        break

      case 'COMPLETE':
        console.log('Completing withdrawal request:', requestId)
        console.log('Profit amount:', profit)
        console.log('Admin notes:', adminNotes)
        console.log('User ID:', withdrawalRequest.userId)
        
        if (profit === undefined || profit < 0) {
          console.log('Invalid profit amount:', profit)
          return NextResponse.json({ error: 'Invalid profit amount' }, { status: 400 })
        }

        updatedRequest = await prisma.withdrawalRequest.update({
          where: { id: requestId },
          data: {
            status: 'COMPLETED',
            profit: profit,
            adminNotes: adminNotes
          },
          include: {
            wallet: true,
            user: true,
            earnings: true
          }
        })

        // Создаем запись о заработке пользователя (без реферальных комиссий)
        console.log('Creating wallet earning for user:', withdrawalRequest.userId, 'amount:', profit)
        await prisma.walletEarning.create({
          data: {
            walletId: withdrawalRequest.walletId,
            userId: withdrawalRequest.userId,
            amount: profit,
            withdrawalRequestId: requestId
          }
        })
        console.log('User wallet earning created successfully')

        // Возвращаем кошелек в активное состояние
        await prisma.wallet.update({
          where: { id: withdrawalRequest.walletId },
          data: { status: 'ACTIVE' }
        })
        
        console.log('Withdrawal request completed successfully:', updatedRequest.id)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Withdrawal request updated successfully',
      withdrawalRequest: updatedRequest
    })
  } catch (error) {
    console.error('Error updating withdrawal request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
