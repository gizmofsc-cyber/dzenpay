'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    telegram: '',
    password: '',
    confirmPassword: '',
    token: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Реферальная система удалена

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          telegram: formData.telegram,
          password: formData.password,
          token: formData.token,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        router.push('/login')
      } else {
        toast.error(data.error || 'Ошибка регистрации')
      }
    } catch (error) {
      toast.error('Ошибка сети')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center gradient-text">
                Регистрация
              </CardTitle>
              <CardDescription className="text-center text-gray-300">
                Создайте новый аккаунт
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="telegram">Telegram</Label>
                  <Input
                    id="telegram"
                    name="telegram"
                    type="text"
                    value={formData.telegram}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Пароль *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Подтвердите пароль *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="token">Токен регистрации *</Label>
                  <Input
                    id="token"
                    name="token"
                    type="text"
                    value={formData.token}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    placeholder="Получите у администратора"
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Нет токена? Обратитесь к администратору: 
                    <a 
                      href="https://t.me/alltimez" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 ml-1 underline"
                    >
                      @alltimez
                    </a>
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Уже есть аккаунт?{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    Войти
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
