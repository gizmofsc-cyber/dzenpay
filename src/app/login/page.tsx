'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Вход выполнен успешно!')
        // Небольшая задержка для установки cookie
        setTimeout(() => {
          router.push('/dashboard')
        }, 100)
      } else {
        toast.error(data.error || 'Ошибка входа')
      }
    } catch (error) {
      toast.error('Ошибка сети')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center gradient-text">
                Вход в систему
              </CardTitle>
              <CardDescription className="text-center text-gray-300">
                Введите свои данные для входа
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Введите ваш email"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-gray-300">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Введите пароль"
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Вход...' : 'Войти'}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-300">
                  Нет аккаунта?{' '}
                  <Link href="/register" className="text-purple-400 hover:text-purple-300 hover:underline transition-colors">
                    Зарегистрироваться
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
