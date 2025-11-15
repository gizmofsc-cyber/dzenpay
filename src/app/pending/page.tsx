import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PendingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-orange-600">
              Ожидание активации
            </CardTitle>
            <CardDescription>
              Ваш аккаунт ожидает активации администратором
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-600">
                После активации вы сможете войти в систему и начать работу с платформой.
              </p>
              <p className="text-sm text-gray-500">
                Обычно активация происходит в течение 24 часов.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
