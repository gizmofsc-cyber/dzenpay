'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Проверяем наличие токена сессии в cookies
        const sessionToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('session='))
          ?.split('=')[1]

        if (sessionToken) {
          // Есть токен, проверяем роль пользователя
          const response = await fetch('/api/auth/me')
          if (response.ok) {
            const data = await response.json()
            const user = data.user

            // Перенаправляем в зависимости от роли
            if (user.role === 'ADMIN') {
              router.push('/admin')
            } else {
              router.push('/dashboard')
            }
          } else {
            // Невалидная сессия, идем на логин
            router.push('/login')
          }
        } else {
          // Нет токена, перенаправляем на логин
          router.push('/login')
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndRedirect()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return null
}
