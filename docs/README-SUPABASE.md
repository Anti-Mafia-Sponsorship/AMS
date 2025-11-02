# 🛡️ AMS TOKEN - С SUPABASE ИНТЕГРАЦИЯ

## 🎉 ТОВА Е ФИНАЛНАТА ВЕРСИЯ!

### ✅ Какво е добавено:

#### 📂 Нови файлове:
- **netlify/functions/save-donation.js** - Запазва donations + emails
- **netlify/functions/get-donations.js** - Взима donations за admin
- **supabase-setup.sql** - Създава всички 7 таблици
- **SUPABASE-INTEGRATION-GUIDE.md** - Пълен setup guide
- **netlify.toml** - Netlify конфигурация
- **.env.example** - Environment variables template
- **package.json** - Supabase + SendGrid dependencies

#### 🗃️ Database таблици (в Supabase):
1. **donors** - Дарители
2. **donations** - Дарения
3. **transfers** - Transfer история
4. **burns** - Burn история
5. **trades** - Trading история
6. **email_logs** - Email logs
7. **admin_actions** - Admin logs

---

## 🚀 БЪРЗ СТАРТ:

### 1️⃣ Supabase Setup (5 мин)
```
1. https://supabase.com → Create project
2. SQL Editor → Copy/Paste supabase-setup.sql → Run
3. Settings → API → Copy keys
```

### 2️⃣ SendGrid Setup (3 мин)
```
1. https://sendgrid.com → Sign up
2. Settings → API Keys → Create
3. Copy API key
```

### 3️⃣ GitHub + Netlify (10 мин)
```bash
git init
git add .
git commit -m "AMS Token"
git push

# Netlify → Import from GitHub → Deploy
# Add environment variables (виж .env.example)
```

### 4️⃣ Тествай! (2 мин)
```
Отвори сайта → /public/donate.html → Направи тестово дарение
Провери: Supabase, Email, Admin panel
```

---

## 📖 ДОКУМЕНТАЦИЯ:

### 🔥 ВАЖНИ ФАЙЛОВЕ:
1. **SUPABASE-INTEGRATION-GUIDE.md** ⭐ - ПРОЧЕТИ ПЪРВО!
2. **docs/COMPLETE-DEPLOYMENT-GUIDE.md** - Пълен deployment guide
3. **.env.example** - Какви env vars са нужни

### 📁 Структура:
```
AMS-WITH-SUPABASE.zip
├── index.html                          # Root selector
├── public/                             # 5 публични страници
├── admin/                              # 9 admin страници
├── netlify/functions/                  # 2 serverless функции ⭐
│   ├── save-donation.js
│   └── get-donations.js
├── contracts/                          # 2 smart contract версии
├── docs/                               # Документация
├── supabase-setup.sql                 # SQL setup ⭐
├── netlify.toml                       # Netlify config ⭐
├── package.json                       # Dependencies ⭐
└── .env.example                       # Env vars template ⭐
```

---

## ⚙️ ENVIRONMENT VARIABLES:

Добави в Netlify Dashboard → Site Settings → Environment variables:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOi...
SUPABASE_ANON_KEY=eyJhbGciOi...
SENDGRID_API_KEY=SG.xxxxx
OWNER_EMAIL=admin@example.com
SENDER_EMAIL=noreply@example.com
CONTRACT_ADDRESS=0x...
OWNER_WALLET_ADDRESS=0x...
```

---

## 🔥 ОСНОВНИ ФУНКЦИИ:

### Frontend → Backend Flow:
```
Donor попълва форма в donate.html
    ↓
Frontend извиква /.netlify/functions/save-donation
    ↓
Netlify Function запазва в Supabase
    ↓
SendGrid изпраща emails (owner + donor)
    ↓
Admin вижда donation в queue-management.html
```

### Database → Admin Flow:
```
Admin отваря queue-management.html
    ↓
Frontend извиква /.netlify/functions/get-donations
    ↓
Netlify Function чете от Supabase
    ↓
Admin вижда всички donations с филтри
```

---

## 📊 СТАТУС:

### ✅ 100% Готови:
- Всички HTML страници
- Admin dashboard
- Netlify Functions (backend)
- Supabase database schema
- Email integration
- Smart contracts (2 версии)
- Пълна документация

### ⚠️ Трябва ти само:
- Deploy contract (20 мин)
- Setup Supabase (5 мин)
- Setup SendGrid (3 мин)
- Deploy на Netlify (10 мин)
- Добави env variables (5 мин)

### 📦 TOTAL TIME TO LIVE: ~1 час

---

## 🆘 TROUBLESHOOTING:

**Грешка: "Failed to fetch functions"**
→ Провери че functions са deployed в Netlify dashboard

**Donations не се записват**
→ Провери Supabase env vars (SERVICE_KEY, не ANON!)

**Emails не идват**
→ Провери SendGrid API key + verify sender email

**Admin panel празен**
→ Провери че има donations в Supabase Table Editor

---

## 📞 ПОЛЕЗНИ ЛИНКОВЕ:

- 📖 [Supabase Docs](https://supabase.com/docs)
- 🚀 [Netlify Functions](https://docs.netlify.com/functions/overview/)
- 📧 [SendGrid Guide](https://docs.sendgrid.com/)
- 🔗 [Web3.js](https://web3js.readthedocs.io/)

---

## 🎯 СЛЕДВАЩИ СТЪПКИ:

1. ✅ Свали ZIP-а
2. ✅ Разархивирай
3. 📖 Прочети **SUPABASE-INTEGRATION-GUIDE.md**
4. 🗃️ Setup Supabase (run supabase-setup.sql)
5. 📧 Setup SendGrid
6. 🚀 Deploy на Netlify
7. ⚙️ Добави environment variables
8. 🎉 ГОТОВО!

---

## 💡 TIPS:

- Използвай Supabase Table Editor за debugging
- Проверявай Netlify Function logs за грешки
- SendGrid има dashboard с activity log
- Test с малки суми първо!

---

# 🚀 УСПЕХ С ПРОЕКТА!

Имаш въпроси? Провери документацията или Netlify/Supabase logs!
