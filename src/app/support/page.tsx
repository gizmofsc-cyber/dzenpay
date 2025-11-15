'use client'

import { useState } from 'react'
import Layout from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  HelpCircle, 
  MessageCircle, 
  FileText, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Send,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'

// Моковые данные для FAQ
const faqData = [
  {
    id: 1,
    question: 'Как начать работу с платформой?',
    answer: 'Для начала работы вам необходимо зарегистрироваться, получить токен от администратора, дождаться активации аккаунта и добавить кошельки для приёма средств.'
  },
  {
    id: 2,
    question: 'Как происходит активация аккаунта?',
    answer: 'После регистрации ваш аккаунт попадает в очередь на активацию. Администратор проверяет данные и активирует аккаунт, обычно в течение 24 часов.'
  },
  {
    id: 3,
    question: 'Какие сети поддерживаются?',
    answer: 'Платформа поддерживает основные сети: TRC20, BEP20, ERC20 и POLYGON. Вы можете добавлять кошельки для любой из этих сетей.'
  },
  {
    id: 4,
    question: 'Как рассчитывается прибыль?',
    answer: 'Прибыль рассчитывается автоматически на основе выбранной связки сетей. Каждая связка имеет свой процент доходности, который указан в разделе Dashboard.'
  },
  {
    id: 5,
    question: 'Как часто происходят выплаты?',
    answer: 'Выплаты происходят автоматически после подтверждения перевода администратором. Обычно это занимает несколько часов после поступления средств.'
  },
  {
    id: 6,
    question: 'Можно ли изменить лимиты кошелька?',
    answer: 'Да, вы можете настроить дневные и месячные лимиты для каждого кошелька в разделе "Кошельки". Это поможет контролировать объём поступающих средств.'
  }
]

// Моковые данные для инструкций
const instructionsData = [
  {
    id: 1,
    title: 'Регистрация и активация',
    steps: [
      'Получите токен регистрации у администратора',
      'Заполните форму регистрации с вашими данными',
      'Дождитесь активации аккаунта (до 24 часов)',
      'Войдите в систему после получения уведомления'
    ]
  },
  {
    id: 2,
    title: 'Настройка кошельков',
    steps: [
      'Перейдите в раздел "Кошельки"',
      'Нажмите "Добавить кошелёк"',
      'Введите адрес кошелька и выберите сеть',
      'Установите лимиты приёма средств',
      'Активируйте кошелёк для работы'
    ]
  },
  {
    id: 3,
    title: 'Выбор связки и получение дохода',
    steps: [
      'На главной странице выберите доступную связку сетей',
      'Укажите свой кошелёк для получения средств',
      'Дождитесь поступления USDT на ваш кошелёк',
      'Администратор подтвердит перевод',
      'Получите автоматически рассчитанную прибыль'
    ]
  },
  {
    id: 4,
    title: 'Реферальная программа',
    steps: [
      'Скопируйте вашу реферальную ссылку',
      'Поделитесь ссылкой с друзьями и знакомыми',
      'Дождитесь регистрации по вашей ссылке',
      'Получайте процент с каждого обмена рефералов',
      'Отслеживайте статистику в разделе "Рефералы"'
    ]
  }
]

// Моковые данные для тикетов
const mockTickets = [
  {
    id: 'TKT001',
    title: 'Проблема с активацией аккаунта',
    status: 'open',
    priority: 'high',
    createdAt: '2024-01-15',
    lastMessage: 'Ожидаю активации уже 2 дня'
  },
  {
    id: 'TKT002',
    title: 'Не приходят средства на кошелёк',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2024-01-14',
    lastMessage: 'Проверяем транзакцию'
  },
  {
    id: 'TKT003',
    title: 'Вопрос по реферальной программе',
    status: 'resolved',
    priority: 'low',
    createdAt: '2024-01-13',
    lastMessage: 'Проблема решена'
  }
]

export default function SupportPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [ticketForm, setTicketForm] = useState({
    title: '',
    message: '',
    priority: 'medium'
  })
  const [tickets] = useState(mockTickets)

  const handleFaqToggle = (id: number) => {
    setActiveFaq(activeFaq === id ? null : id)
  }

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ticketForm.title.trim() || !ticketForm.message.trim()) {
      toast.error('Заполните все поля')
      return
    }

    // Здесь будет отправка тикета на сервер
    console.log('New ticket:', ticketForm)
    toast.success('Тикет создан успешно')
    
    setTicketForm({ title: '', message: '', priority: 'medium' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Открыт'
      case 'in_progress':
        return 'В работе'
      case 'resolved':
        return 'Решён'
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Высокий'
      case 'medium':
        return 'Средний'
      case 'low':
        return 'Низкий'
      default:
        return priority
    }
  }

  const filteredFaq = faqData.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Layout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Поддержка</h1>
          <p className="text-gray-600">Помощь и инструкции по работе с платформой</p>
        </div>

        {/* Поиск по FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Поиск по часто задаваемым вопросам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Введите ваш вопрос..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Часто задаваемые вопросы</CardTitle>
            <CardDescription>
              Ответы на популярные вопросы пользователей
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredFaq.map((item) => (
                <div key={item.id} className="border rounded-lg">
                  <button
                    onClick={() => handleFaqToggle(item.id)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">{item.question}</span>
                    {activeFaq === item.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {activeFaq === item.id && (
                    <div className="px-4 pb-4">
                      <p className="text-gray-600">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Инструкции */}
        <Card>
          <CardHeader>
            <CardTitle>Пошаговые инструкции</CardTitle>
            <CardDescription>
              Подробные руководства по работе с платформой
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {instructionsData.map((instruction) => (
                <div key={instruction.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    {instruction.title}
                  </h3>
                  <ol className="space-y-2">
                    {instruction.steps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mr-3 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Тикет-система */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Создание нового тикета */}
          <Card>
            <CardHeader>
              <CardTitle>Создать обращение</CardTitle>
              <CardDescription>
                Обратитесь в службу поддержки с вашим вопросом
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Тема обращения</Label>
                  <Input
                    id="title"
                    value={ticketForm.title}
                    onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                    placeholder="Кратко опишите проблему"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Приоритет</Label>
                  <select
                    id="priority"
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="message">Сообщение</Label>
                  <textarea
                    id="message"
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    placeholder="Подробно опишите вашу проблему или вопрос"
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Отправить обращение
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* История тикетов */}
          <Card>
            <CardHeader>
              <CardTitle>Мои обращения</CardTitle>
              <CardDescription>
                История ваших обращений в службу поддержки
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{ticket.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityLabel(ticket.priority)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{ticket.lastMessage}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>ID: {ticket.id}</span>
                      <span>{ticket.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Контактная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Контактная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Telegram</h3>
                <p className="text-sm text-gray-600">
                  <a 
                    href="https://t.me/alltimez" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    @alltimez
                  </a>
                </p>
                <p className="text-xs text-gray-500 mt-1">Менеджер сайта</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Время работы</h3>
                <p className="text-sm text-gray-600">24/7</p>
                <p className="text-xs text-gray-500 mt-1">Круглосуточная поддержка</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold mb-2">Время ответа</h3>
                <p className="text-sm text-gray-600">До 2 часов</p>
                <p className="text-xs text-gray-500 mt-1">Обычное время ответа</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
