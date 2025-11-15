'use client'

import Link from 'next/link'
import { 
  Github, 
  Twitter, 
  Mail,
  MessageCircle
} from 'lucide-react'

export default function AuthFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 border-t border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Логотип и описание */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CP</span>
              </div>
              <h3 className="text-xl font-bold text-white">Crypto Platform</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Надежная платформа для управления криптовалютными кошельками и транзакциями.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Быстрые ссылки */}
          <div>
            <h4 className="text-white font-semibold mb-4">Быстрые ссылки</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Вход
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Регистрация
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Поддержка
                </Link>
              </li>
            </ul>
          </div>

          {/* Менеджер сайта */}
          <div>
            <h4 className="text-white font-semibold mb-4">Менеджер сайта</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Telegram</p>
                  <a 
                    href="https://t.me/alltimez" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    @alltimez
                  </a>
                </div>
              </div>
              <p className="text-gray-400 text-xs">
                Свяжитесь с менеджером для получения поддержки и решения вопросов
              </p>
            </div>
          </div>
        </div>

        {/* Нижняя часть */}
        <div className="border-t border-gray-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} Crypto Platform. Все права защищены.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                Политика конфиденциальности
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                Условия использования
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                Правовая информация
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
