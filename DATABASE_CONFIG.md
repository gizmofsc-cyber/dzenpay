# 🔐 Конфигурация базы данных

## ✅ База данных настроена

База данных PostgreSQL на Neon успешно настроена и инициализирована.

## 📋 Данные администратора

**Email:** `admin10@gmail.com`  
**Пароль:** `datmuf-Bajjyk-6wupde`  
**Роль:** `ADMIN`

## 🔗 Строка подключения

```
postgresql://neondb_owner:npg_D5Qj8nkXAqhw@ep-frosty-cell-ah2y2ukq-pooler.c-3.us-east-1.aws.neon.tech/dzenpay?sslmode=require&channel_binding=require
```

## ⚙️ Настройка для Vercel

Добавьте в Vercel Dashboard → Settings → Environment Variables:

**Key:** `DATABASE_URL`  
**Value:** 
```
postgresql://neondb_owner:npg_D5Qj8nkXAqhw@ep-frosty-cell-ah2y2ukq-pooler.c-3.us-east-1.aws.neon.tech/dzenpay?sslmode=require&channel_binding=require
```

**Environments:** Production, Preview, Development (отметьте все)

## ✅ Что уже создано

- ✅ Администратор: `admin10@gmail.com`
- ✅ Сети: TRC20, BEP20, ERC20, POLYGON (4 сети)
- ✅ Сетевые пары: 12 пар между всеми сетями
- ✅ Схема базы данных применена

## 🔄 Для локальной разработки

Если нужно переключиться на локальную SQLite для разработки, создайте `.env` файл:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
NODE_ENV="development"
```

И выполните:
```bash
npx prisma migrate dev
npm run init-db
npm run init-network-pairs
```

## ⚠️ Важно

- Храните строку подключения в секретах (не коммитьте в Git)
- Пароль администратора можно изменить через интерфейс приложения
- Для продакшена рекомендуется изменить пароль администратора на более надежный

