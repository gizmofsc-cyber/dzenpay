'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  DollarSign,
  Users,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Settings,
  UserCheck,
  Key,
  Activity,
  TrendingUp,
} from 'lucide-react'

const userNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Выплаты', href: '/payments', icon: CreditCard },
  { name: 'Кошельки', href: '/wallets', icon: Wallet },
  { name: 'Доходность', href: '/income', icon: TrendingUp },
  { name: 'Финансы', href: '/finances', icon: DollarSign },
  { name: 'Поддержка', href: '/support', icon: HelpCircle },
]

const adminNavigation = [
  { name: 'Админ панель', href: '/admin', icon: Settings },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Выплаты', href: '/payments', icon: CreditCard },
  { name: 'Кошельки', href: '/wallets', icon: Wallet },
  { name: 'Доходность', href: '/income', icon: TrendingUp },
  { name: 'Финансы', href: '/finances', icon: DollarSign },
  { name: 'Поддержка', href: '/support', icon: HelpCircle },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  
  // Выбираем навигацию в зависимости от роли пользователя
  const navigation = user?.role === 'ADMIN' ? adminNavigation : userNavigation

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 rounded-lg bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {isOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'neon-sidebar fixed inset-y-0 left-0 z-40 w-64 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <h1 className="text-xl font-bold">Crypto Platform</h1>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300',
                    isActive
                      ? 'neon-button text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/30 hover:shadow-md'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-600/30">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:text-white hover:bg-gray-700/30 transition-all duration-300"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Выйти
            </button>
          </div>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
