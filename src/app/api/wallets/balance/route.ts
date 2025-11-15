import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { getWalletBalance, getWalletTransactions } from '@/lib/blockchain'

const prisma = new PrismaClient()

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

    const { searchParams } = new URL(request.url)
    const walletId = searchParams.get('walletId')

    if (!walletId) {
      return NextResponse.json(
        { error: 'ID кошелька обязателен' },
        { status: 400 }
      )
    }

    // Проверяем, что кошелек принадлежит пользователю
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: user.id
      }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Кошелек не найден' },
        { status: 404 }
      )
    }

    // Проверяем, что у кошелька есть адрес
    if (!wallet.address) {
      return NextResponse.json(
        { error: 'У кошелька нет адреса' },
        { status: 400 }
      )
    }

    // Получаем баланс с блокчейна
    const blockchainBalance = await getWalletBalance(wallet.address, wallet.network)

    // Обновляем баланс в базе данных
    const updatedWallet = await prisma.wallet.update({
      where: { id: walletId },
      data: {
        balance: blockchainBalance.balance,
        lastChecked: new Date()
      }
    })

    // Получаем последние транзакции
    const transactions = await getWalletTransactions(wallet.address, wallet.network, 10)

    // Сохраняем новые транзакции в базу данных
    for (const tx of transactions) {
      await prisma.walletTransaction.upsert({
        where: { hash: tx.hash },
        update: {
          status: tx.status,
          balance: blockchainBalance.balance
        },
        create: {
          hash: tx.hash,
          type: tx.type,
          amount: tx.amount,
          balance: blockchainBalance.balance,
          fromAddress: tx.fromAddress,
          toAddress: tx.toAddress,
          blockNumber: tx.blockNumber,
          gasUsed: tx.gasUsed,
          gasPrice: tx.gasPrice,
          fee: tx.fee,
          status: tx.status,
          walletId: wallet.id,
          createdAt: new Date(tx.timestamp)
        }
      })
    }

    // Получаем историю транзакций из базы данных
    const walletTransactions = await prisma.walletTransaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({
      wallet: updatedWallet,
      transactions: walletTransactions
    })
  } catch (error) {
    console.error('Wallet balance update error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
