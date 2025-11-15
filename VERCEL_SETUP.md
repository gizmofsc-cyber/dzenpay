# Настройка проекта на Vercel

## Переменные окружения

В панели управления Vercel добавьте следующие переменные окружения:

### Обязательные переменные:

```
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
NODE_ENV=production
```

### Для PostgreSQL на Vercel:

1. Создайте базу данных PostgreSQL в Vercel
2. Скопируйте строку подключения из панели управления
3. Добавьте её как переменную `DATABASE_URL`

### Для SQLite (временное решение):

```
DATABASE_URL=file:./dev.db
```

## Миграции базы данных

После деплоя выполните миграции:

```bash
npx prisma migrate deploy
```

## Проверка

1. Убедитесь, что все переменные окружения настроены
2. Проверьте, что база данных доступна
3. Выполните миграции базы данных
4. Проверьте работу API endpoints

## Возможные проблемы

- **404 ошибки**: Проверьте правильность URL и маршрутов
- **500 ошибки**: Проверьте подключение к базе данных и переменные окружения
- **Ошибки аутентификации**: Проверьте NEXTAUTH_SECRET и NEXTAUTH_URL
