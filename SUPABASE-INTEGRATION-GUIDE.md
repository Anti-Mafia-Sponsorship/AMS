# 🗄️ SUPABASE INTEGRATION GUIDE

## ✅ Какво е добавено в този ZIP:

### 📁 Нови файлове:
1. **netlify/functions/save-donation.js** - Запазва donations в Supabase + изпраща emails
2. **netlify/functions/get-donations.js** - Взима donations за admin панела
3. **supabase-setup.sql** - SQL скрипт за създаване на всички таблици
4. **.env.example** - Примерни environment variables
5. **netlify.toml** - Netlify конфигурация
6. **package.json** - Dependencies (Supabase + SendGrid)
7. Този файл

### 🗃️ Създадени 7 таблици:
1. **donors** - Информация за дарители
2. **donations** - Всички дарения
3. **transfers** - История на transfers
4. **burns** - История на изгаряния
5. **trades** - Trading история
6. **email_logs** - Email лог
7. **admin_actions** - Admin действия

---

## 🚀 SETUP СТЪПКИ:

### СТЪПКА 1: Създай Supabase проект

1. Отиди на https://supabase.com
2. Click "Start your project" → Sign in с GitHub
3. Click "New Project"
4. Попълни:
   - **Organization:** Избери или създай нова
   - **Name:** ams-token-db
   - **Database Password:** (запази го! ще ти трябва)
   - **Region:** Europe (West) - най-близо до България
5. Click "Create new project"
6. Чакай 2-3 минути докато се setup-не

### СТЪПКА 2: Създай таблиците

1. В Supabase dashboard → отиди в **SQL Editor** (лява странична лента)
2. Click "New query"
3. Отвори файла **supabase-setup.sql** от този ZIP
4. **Copy ВСИЧКИЯ SQL код** и го paste в SQL Editor
5. Click **RUN** (или натисни F9)
6. Трябва да видиш "Success. No rows returned"
7. Провери че таблиците са създадени: **Table Editor** → трябва да видиш 7 таблици

### СТЪПКА 3: Вземи API credentials

1. В Supabase dashboard → **Settings** → **API**
2. Копирай следните стойности:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (secret!)
```

⚠️ **ВАЖНО:** service_role е СЕКРЕТЕН! Използвай го САМО на backend (Netlify Functions)!

### СТЪПКА 4: Setup SendGrid (за emails)

1. Отиди на https://sendgrid.com
2. Sign up (безплатно до 100 emails/ден)
3. Verify твоя email
4. Settings → API Keys → Create API Key
5. Име: "AMS Token"
6. Permissions: Full Access
7. Copy ключа (показва се само веднъж!)

### СТЪПКА 5: Push в GitHub

```bash
cd /path/to/AMS-FINAL-PROJECT

git init
git add .
git commit -m "AMS Token with Supabase integration"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ams-token.git
git push -u origin main
```

### СТЪПКА 6: Deploy на Netlify

1. Отиди на https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub"
4. Select твоето **ams-token** repo
5. **Build settings:**
   - Build command: (остави празно)
   - Publish directory: `.` (точка)
   - Functions directory: `netlify/functions`
6. Click "Deploy site"

### СТЪПКА 7: Добави Environment Variables в Netlify

1. В Netlify dashboard → **Site settings** → **Environment variables**
2. Click "Add a variable"
3. Добави всяка от тези:

```
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGciOi... (service_role key!)
SUPABASE_ANON_KEY = eyJhbGciOi... (anon public key)
SENDGRID_API_KEY = SG.xxxxx
OWNER_EMAIL = your-admin-email@example.com
SENDER_EMAIL = noreply@yourdomain.com
CONTRACT_ADDRESS = 0x... (след deploy на contract)
OWNER_WALLET_ADDRESS = 0x... (твоя wallet)
```

4. Click "Save"
5. **ВАЖНО:** След добавяне на env vars → Redeploy сайта!
   - Deploys → Click на последния deploy → "Redeploy"

### СТЪПКА 8: Тествай!

1. Отвори твоя Netlify сайт: `https://твой-сайт.netlify.app`
2. Отиди в `/public/donate.html`
3. Попълни формата и изпрати тестово дарение
4. Провери:
   - Supabase → Table Editor → `donations` table → трябва да има нов запис
   - Email → провери твоя inbox за notification
   - Admin panel → `/admin/queue-management.html` → трябва да видиш donation-а

---

## 🔌 КАК РАБОТИ ИНТЕГРАЦИЯТА:

### Frontend (public/donate.html):
```javascript
// След успешна blockchain транзакция:
const response = await fetch('/.netlify/functions/save-donation', {
    method: 'POST',
    body: JSON.stringify({
        walletAddress: '0x...',
        name: 'Иван',
        email: 'ivan@example.com',
        bnbAmount: 0.1,
        txHash: '0x...',
        variant: 'A'
    })
});
```

### Backend (Netlify Function):
1. Получава request
2. Запазва в Supabase donors таблица
3. Запазва в donations таблица
4. Изпраща email до owner
5. Изпраща confirmation до donor
6. Връща success response

### Admin Panel:
```javascript
// Fetch donations от Supabase
const response = await fetch('/.netlify/functions/get-donations?processed=false');
const { donations } = await response.json();
```

---

## 📊 ТАБЛИЦИ В SUPABASE:

### 1. donors
```sql
- id (uuid, primary key)
- wallet_address (text, unique) ← ВАЖНО!
- name (text, nullable)
- email (text, nullable)
- phone (text, nullable)
- created_at, updated_at (timestamp)
```

### 2. donations
```sql
- id (uuid, primary key)
- wallet_address (text)
- donor_name, donor_email, donor_phone
- bnb_amount (numeric)
- tokens_to_receive (numeric)
- tx_hash (text)
- variant ('A' или 'B')
- notes (text)
- processed (boolean, default false)
- created_at, processed_at (timestamp)
```

### 3. transfers
```sql
- from_address, to_address
- amount
- balance_before, balance_after
- tx_hash
- donor info
- created_at
```

### 4. burns
```sql
- amount
- burn_type ('scheduled' или 'manual')
- total_supply_before, total_supply_after
- tx_hash
- created_at
```

### 5-7. trades, email_logs, admin_actions
Виж `supabase-setup.sql` за детайли.

---

## 🔐 SECURITY:

### ✅ Добре:
- Service key се използва САМО на backend (Netlify Functions)
- Anon key се използва на frontend (публично OK)
- Row Level Security (RLS) е enabled
- Donations са read-only за публиката

### ⚠️ Препоръки:
- Никога не commit-вай `.env` файл!
- Service key трябва да е САМО в Netlify env vars
- Добави rate limiting ако очакваш много traffic
- Enable Supabase Auth за admin потребители

---

## 🐛 TROUBLESHOOTING:

### Грешка: "Failed to fetch"
- Провери че functions са deployed (Netlify → Functions tab)
- Провери Network tab в browser (F12)
- Провери Netlify function logs

### Грешка: "Database connection failed"
- Провери SUPABASE_URL в env vars
- Провери SUPABASE_SERVICE_KEY (service_role, не anon!)
- Провери че таблиците са създадени (Supabase Table Editor)

### Emails не се изпращат
- Провери SENDGRID_API_KEY
- Провери SendGrid dashboard → Activity
- Verify твоя sender email в SendGrid

### Donations не се показват в admin
- Провери че `get-donations` function работи
- Fetch-ни `/.netlify/functions/get-donations?processed=false`
- Провери Supabase Table Editor директно

---

## 📞 ПОЛЕЗНИ ЛИНКОВЕ:

- **Supabase Docs:** https://supabase.com/docs
- **Netlify Functions:** https://docs.netlify.com/functions/overview/
- **SendGrid Docs:** https://docs.sendgrid.com/
- **Web3.js Docs:** https://web3js.readthedocs.io/

---

## ✅ CHECKLIST:

- [ ] Supabase проект създаден
- [ ] SQL таблици created (run supabase-setup.sql)
- [ ] API credentials копирани
- [ ] SendGrid account + API key
- [ ] GitHub repo created
- [ ] Code pushed в GitHub
- [ ] Netlify site deployed
- [ ] Environment variables добавени в Netlify
- [ ] Site redeployed след env vars
- [ ] Тестово donation направено
- [ ] Email получен
- [ ] Donation се вижда в Supabase
- [ ] Admin panel работи

---

## 🎉 ГОТОВО!

Всичко е setup-нато! Сега имаш:
✅ Функциониращи Netlify Functions
✅ Supabase database за всички данни
✅ Email notifications
✅ Admin panel с real data

Успех! 🚀
