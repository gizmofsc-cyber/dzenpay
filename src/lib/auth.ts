import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function generateToken(): Promise<string> {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export async function createSession(userId: string): Promise<string> {
  const token = await generateToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  return token
}

export async function validateSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session.user
}

export async function deleteSession(token: string) {
  await prisma.session.delete({
    where: { token },
  })
}
