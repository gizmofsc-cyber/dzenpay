import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {

  try {
    const sessionToken = request.cookies.get('session-token')?.value

    if (!sessionToken) {
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

    // Проверяем, что пользователь - админ
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Получаем все запросы на депозиты (страховые взносы)
    const depositRequests = await prisma.depositRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegram: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ requests: depositRequests })
  } catch (error) {
    console.error('Admin deposit requests fetch error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value

    if (!sessionToken) {
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

    // Проверяем, что пользователь - админ
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { requestId, action, adminWalletAddress, amount } = await request.json()

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Неверные параметры' },
        { status: 400 }
      )
    }

    let updatedRequest

    if (action === 'assign_wallet') {
      // Назначаем кошелек для пополнения
      if (!adminWalletAddress) {
        return NextResponse.json(
          { error: 'Адрес кошелька не указан' },
          { status: 400 }
        )
      }

      updatedRequest = await prisma.depositRequest.update({
        where: { id: requestId },
        data: {
          adminWalletAddress,
          status: 'PROCESSING'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              telegram: true,
              status: true
            }
          }
        }
      })

      // Создаем кошелек для пользователя
      await prisma.wallet.create({
        data: {
          address: null, // Будет заполнен после пополнения
          network: updatedRequest.fromNetwork,
          type: 'DEPOSIT',
          status: 'ACTIVE',
          userId: updatedRequest.userId
        }
      })

    } else if (action === 'set_amount') {
      // Устанавливаем сумму страхового взноса
      if (!amount || amount <= 0) {
        return NextResponse.json(
          { error: 'Неверная сумма' },
          { status: 400 }
        )
      }

      updatedRequest = await prisma.depositRequest.update({
        where: { id: requestId },
        data: {
          amount: parseFloat(amount),
          status: 'PROCESSING' // Остается в обработке до пополнения
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              telegram: true,
              status: true
            }
          }
        }
      })

      // Обновляем страховой депозит пользователя
      await prisma.user.update({
        where: { id: updatedRequest.userId },
        data: {
          insuranceDepositAmount: parseFloat(amount),
          insuranceDepositPaid: 0 // Пользователь еще не оплатил
        }
      })

    } else if (action === 'complete') {
      // Завершаем запрос после пополнения кошелька
      updatedRequest = await prisma.depositRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              telegram: true,
              status: true
            }
          }
        }
      })

      // Обновляем баланс кошелька пользователя
      const depositWallet = await prisma.wallet.findFirst({
        where: {
          userId: updatedRequest.userId,
          type: 'DEPOSIT'
        }
      })

      if (depositWallet && updatedRequest.amount) {
        await prisma.wallet.update({
          where: { id: depositWallet.id },
          data: {
            balance: updatedRequest.amount
          }
        })

        // Обновляем страховой депозит пользователя
        await prisma.user.update({
          where: { id: updatedRequest.userId },
          data: {
            insuranceDepositPaid: updatedRequest.amount
          }
        })
      }

    } else if (action === 'reject') {
      // Отклоняем запрос
      updatedRequest = await prisma.depositRequest.update({
        where: { id: requestId },
        data: {
          status: 'CANCELLED'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              telegram: true,
              status: true
            }
          }
        }
      })
    }

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error('Admin deposit request update error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}