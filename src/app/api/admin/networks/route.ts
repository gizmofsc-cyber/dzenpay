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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const networks = await prisma.network.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ networks })
  } catch (error) {
    console.error('Error fetching networks:', error)
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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, displayName } = await request.json()

    if (!name || !displayName) {
      return NextResponse.json({ error: 'Name and display name are required' }, { status: 400 })
    }

    // Проверяем, что сеть с таким именем не существует
    const existingNetwork = await prisma.network.findUnique({
      where: { name }
    })

    if (existingNetwork) {
      return NextResponse.json({ error: 'Network with this name already exists' }, { status: 400 })
    }

    const network = await prisma.network.create({
      data: {
        name,
        displayName
      }
    })

    return NextResponse.json({
      message: 'Network created successfully',
      network
    })
  } catch (error) {
    console.error('Error creating network:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await validateSession(sessionToken)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, displayName, isActive } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Network ID is required' }, { status: 400 })
    }

    const network = await prisma.network.findUnique({
      where: { id }
    })

    if (!network) {
      return NextResponse.json({ error: 'Network not found' }, { status: 404 })
    }

    const updatedNetwork = await prisma.network.update({
      where: { id },
      data: {
        displayName: displayName !== undefined ? displayName : network.displayName,
        isActive: isActive !== undefined ? isActive : network.isActive
      }
    })

    return NextResponse.json({
      message: 'Network updated successfully',
      network: updatedNetwork
    })
  } catch (error) {
    console.error('Error updating network:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await validateSession(sessionToken)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Network ID is required' }, { status: 400 })
    }

    // Проверяем, что сеть не используется в сетевых парах
    const networkPairs = await prisma.networkPair.findMany({
      where: {
        OR: [
          { fromNetworkId: id },
          { toNetworkId: id }
        ]
      }
    })

    if (networkPairs.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete network that is used in network pairs' 
      }, { status: 400 })
    }

    await prisma.network.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Network deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting network:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
