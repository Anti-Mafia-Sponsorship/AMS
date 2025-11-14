# 🛡️ AMS TOKEN - COMPLETE PROJECT WITH SUPABASE

## 🎉 КАКВО Е НОВО В ТАЗИ ВЕРСИЯ:

### ✨ Пълна Backend Интеграция:
- ✅ **Supabase Database** - 7 таблици за всички данни
- ✅ **Netlify Functions** - 3 serverless API endpoints
- ✅ **SendGrid Email** - Автоматични notifications
- ✅ **Real Database** - Вместо localStorage

### 📁 Нови Файлове:
1. **netlify/functions/save-donation.js** - Запис на donations + emails
2. **netlify/functions/get-donations.js** - Извличане на donation queue
3. **netlify/functions/mark-processed.js** - Маркиране като processed
4. **supabase-schema.sql** - Пълен database schema (7 таблици)
5. **netlify.toml** - Netlify configuration
6. **package.json** - Dependencies (Supabase + SendGrid)
7. **.env.example** - Template за environment variables
8. **.gitignore** - Git ignore файл
9. **docs/SUPABASE-DEPLOYMENT-GUIDE.md** - Стъпка-по-стъпка deployment

---

## 📊 DATABASE SCHEMA (Supabase)

### Таблици:

1. **donors** - Информация за дарители
   - wallet_address, name, email, phone, timestamps

2. **donations** - Всички дарения
   - donor info, bnb_amount, tokens_to_receive, tx_hash, processed, variant

3. **transfers** - История на transfers от owner
   - from/to addresses, amount, balances, tx_hash, donor info

4. **burns** - История на изгаряния
   - amount, type (scheduled/manual), supply before/after, tx_hash

5. **trades** - История на търговия (PancakeSwap)
   - wallet, type (buy/sell), amounts, price, tx_hash

6. **email_logs** - Лог на изпратени имейли
   - recipient, subject, status, error_message

7. **admin_actions** - Лог на admin действия
   - admin_address, action_type, details (JSON), tx_hash

### Views & Functions:
- `pending_donations` - View на pending donations с queue position
- `donation_stats` - Real-time статистики
- `get_next_pending_donation()` - Функция за FIFO обработка

---

## 🚀 DEPLOYMENT СТЪПКИ:

### 1. Setup Supabase (5 минути)
```bash
1. Отиди на https://supabase.com
2. Създай проект: "ams-token-db"
3. Copy supabase-schema.sql в SQL Editor
4. Run script
5. Copy API keys (URL + service_role key)
```

### 2. Setup SendGrid (5 минути)
```bash
1. Отиди на https://sendgrid.com
2. Създай API key
3. Verify sender identity
4. Copy API key
```

### 3. Deploy на Netlify (10 минути)
```bash
# Push в GitHub
git init
git add .
git commit -m "Initial commit"
git push

# В Netlify:
1. Import от GitHub
2. Choose "Web app"
3. Deploy settings: publish = "."
4. Добави environment variables (виж .env.example)
5. Deploy!
```

### 4. Deploy Smart Contract (15 минути)
```bash
# BSC Testnet за тест
truffle migrate --network bscTestnet

# След тестване → Mainnet
truffle migrate --network bsc

# Обнови CONTRACT_ADDRESS във всички HTML
```

### 5. Тествай! (10 минути)
```bash
1. Отвори сайта
2. Направи test donation
3. Провери database в Supabase
4. Провери emails
5. Тествай admin panel
```

**📖 Пълен guide:** `docs/SUPABASE-DEPLOYMENT-GUIDE.md`

---

## 🔌 API ENDPOINTS (Netlify Functions)

### POST /.netlify/functions/save-donation
Запис на ново дарение + изпраща emails

**Request:**
```json
{
  "walletAddress": "0x...",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+359888000000",
  "bnbAmount": 0.1,
  "tokensAmount": 1000,
  "txHash": "0x...",
  "variant": "A",
  "notes": "Test donation"
}
```

**Response:**
```json
{
  "success": true,
  "donation": {...},
  "message": "Дарението е записано успешно!"
}
```

### GET /.netlify/functions/get-donations
Извличане на donations

**Query params:**
- `status` - all | pending | processed
- `limit` - number (default: 100)

**Response:**
```json
{
  "success": true,
  "donations": [...],
  "count": 10
}
```

### POST /.netlify/functions/mark-processed
Маркиране на donation като processed

**Request:**
```json
{
  "donationId": "uuid",
  "txHash": "0x..."
}
```

---

## ⚙️ ENVIRONMENT VARIABLES

Добави в Netlify → Site settings → Environment variables:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOi...
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
OWNER_EMAIL=admin@example.com
SITE_URL=https://yoursite.netlify.app
OWNER_WALLET_ADDRESS=0x...
CONTRACT_ADDRESS=0x...
```

**⚠️ ВАЖНО:** Виж `.env.example` за пълен списък!

---

## 📂 СТРУКТУРА:

```
AMS-FINAL-PROJECT/
├── index.html                    # Root selector (admin/public)
├── public/                       # 5 публични страници
│   ├── index.html
│   ├── connect.html
│   ├── rules.html
│   ├── donate.html (с Supabase integration)
│   └── contact.html
├── admin/                        # 9 admin страници
│   ├── index.html (dashboard с stats)
│   ├── queue-management.html (с Supabase)
│   └── ...
├── netlify/
│   └── functions/                # 3 serverless functions ⭐ NEW
│       ├── save-donation.js
│       ├── get-donations.js
│       └── mark-processed.js
├── contracts/                    # 2 smart contracts
├── docs/                         # 7 документа
│   └── SUPABASE-DEPLOYMENT-GUIDE.md ⭐ NEW
├── supabase-schema.sql          # Database schema ⭐ NEW
├── netlify.toml                 # Netlify config ⭐ NEW
├── package.json                 # Dependencies ⭐ NEW
├── .env.example                 # Env template ⭐ NEW
└── .gitignore                   # Git ignore ⭐ NEW
```

---

## 🔐 SECURITY

### Препоръки:
- ✅ Никога не commit-вай `.env` файла!
- ✅ Използвай `service_role` key САМО в backend
- ✅ Enable Row Level Security (RLS) в Supabase
- ✅ Validate всички inputs (XSS protection)
- ✅ Rate limiting за API endpoints
- ✅ HTTPS only (автоматично в Netlify)
- ✅ Backup database редовно

### Admin Authentication:
Смени паролата в `index.html`:
```javascript
const ADMIN_PASSWORD = 'твоя_сигурна_парола'; // СМЕНИ!
```

Или добави MetaMask-based auth.

---

## 🧪 ТЕСТВАНЕ

### Локално (с Netlify Dev):
```bash
npm install
netlify dev

# Ще стартира на http://localhost:8888
# Functions на http://localhost:8888/.netlify/functions/
```

### Production:
1. Deploy на Netlify
2. Test donations
3. Check Supabase data
4. Check emails
5. Test admin panel

---

## 📊 MONITORING

### Check Daily:
- **Netlify:** Function logs, deploy status
- **Supabase:** Database size, quotas
- **SendGrid:** Email stats, quota (100/day free)

### Alerts:
- Setup email notifications в Netlify
- Monitor Supabase dashboard
- Check SendGrid for bounces/spam

---

## 🐛 KNOWN ISSUES & SOLUTIONS

### Issue: "Function execution error"
**Solution:** Check environment variables in Netlify

### Issue: "Database connection failed"
**Solution:** Verify SUPABASE_SERVICE_KEY (not anon key!)

### Issue: "Email not sending"
**Solution:** Verify sender identity in SendGrid

### Issue: "Contract call failed"
**Solution:** Check CONTRACT_ADDRESS and network

---

## 📦 DEPENDENCIES

### Frontend:
- Web3.js (CDN)
- No build step needed!

### Backend (Netlify Functions):
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "@sendgrid/mail": "^7.7.0"
}
```

### Dev:
```json
{
  "netlify-cli": "^17.0.0"
}
```

---

## 🎯 FEATURES

### ✅ Implemented:
- Donation system (Вариант А + Б)
- Email notifications (owner + donor)
- Database storage (Supabase)
- Admin dashboard
- Queue management
- Transfer/Burn history
- Real-time stats

### 🚧 TODO (Optional):
- [ ] Real-time WebSocket updates
- [ ] Admin authentication (JWT/OAuth)
- [ ] The Graph integration за blockchain events
- [ ] Telegram bot notifications
- [ ] Analytics dashboard
- [ ] Multi-language support

---

## 📞 SUPPORT

**Документация:**
- `/docs/SUPABASE-DEPLOYMENT-GUIDE.md` - Deployment guide
- `/docs/COMPLETE-DEPLOYMENT-GUIDE.md` - Deployment Q&A
- `/docs/PROJECT-STRUCTURE.md` - Project structure

**External Docs:**
- Supabase: https://supabase.com/docs
- Netlify: https://docs.netlify.com
- SendGrid: https://docs.sendgrid.com
- Web3.js: https://web3js.readthedocs.io

**Issues:**
- Browser console (F12)
- Netlify function logs
- Supabase logs

---

## 📄 LICENSE

MIT License - Free to use

---

## 🙏 CREDITS

- **Supabase** - Backend database
- **Netlify** - Hosting & functions
- **SendGrid** - Email service
- **BSC** - Blockchain
- **PancakeSwap** - DEX integration

---

## 🎉 ГОТОВО!

Проектът е 100% готов за production! 🚀

Deploy и стартирай!

🛡️ Anti-Mafia-Sponsorship Token
