'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Footer from './Footer'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user?.status === 'PENDING') {
      router.push('/pending')
    } else if (!loading && user?.status === 'BLOCKED') {
      router.push('/blocked')
    } else if (!loading && user?.role === 'USER' && window.location.pathname.startsWith('/admin')) {
      // Обычный пользователь не может зайти на админку
      router.push('/dashboard')
    }
    // Админы могут свободно переключаться между страницами
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Sidebar />
      <div className="lg:pl-64 flex-1 flex flex-col">
        <main className="lg:absolute lg:top-0 lg:left-64 lg:right-0 lg:p-0 lg:m-0 pt-16 lg:pt-0 flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
        <div className="lg:hidden">
          <Footer />
        </div>
      </div>
    </div>
  )
}
