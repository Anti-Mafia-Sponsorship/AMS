# 🚀 ПЪЛЕН DEPLOYMENT GUIDE С SUPABASE

## 📋 СЪДЪРЖАНИЕ:

1. Setup Supabase Database
2. Setup SendGrid Email
3. Deploy на Netlify
4. Deploy Smart Contract
5. Тестване
6. Go Live!

---

## 🗄️ СТЪПКА 1: SETUP SUPABASE DATABASE

### 1.1 Регистрация и Създаване на Проект

1. **Отиди на:** https://supabase.com
2. **Click:** "Start your project"
3. **Sign up** с GitHub account (най-лесно)
4. **Click:** "New Project"
5. **Попълни:**
   - Organization: Създай нова (example: "AMS Token")
   - Project Name: `ams-token-db`
   - Database Password: **ЗАПАЗИ ГО!** (example: `YourSuperSecurePass123!`)
   - Region: **Europe (West)** (най-близо до България)
6. **Click:** "Create new project"
7. **Чакай** 2-3 минути (setup в прогрес)

### 1.2 Създаване на Database Schema

1. **Отиди в:** SQL Editor (от левия menu)
2. **Click:** "+ New query"
3. **Копирай и paste-ни** целия файл `supabase-schema.sql`
4. **Click:** "Run" (или Ctrl+Enter)
5. **Провери:** Трябва да видиш "Database schema created successfully!"

### 1.3 Вземи API Keys

1. **Отиди в:** Settings → API
2. **Копирай** следните стойности:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **ВАЖНО:** `service_role` ключът е МНОГО чувствителен! Използвай го САМО в backend (Netlify functions)!

### 1.4 Тествай Database

В SQL Editor изпълни:

```sql
-- Провери че таблиците са създадени
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Вмъкни тестов donor
INSERT INTO donors (wallet_address, name, email, phone) VALUES
('0x1234567890123456789012345678901234567890', 'Test Donor', 'test@example.com', '+359888000000');

-- Провери
SELECT * FROM donors;

-- Изтрий тестовия запис
DELETE FROM donors WHERE wallet_address = '0x1234567890123456789012345678901234567890';
```

✅ Ако работи → Supabase е готов!

---

## 📧 СТЪПКА 2: SETUP SENDGRID EMAIL

### 2.1 Регистрация

1. **Отиди на:** https://sendgrid.com
2. **Click:** "Start for Free"
3. **Попълни:** формата (може да използваш Gmail)
4. **Verify** email-а си

### 2.2 Създай API Key

1. **Отиди в:** Settings → API Keys
2. **Click:** "Create API Key"
3. **Име:** `AMS Token Notifications`
4. **Permissions:** "Full Access" (или "Restricted Access" → Mail Send + Web API)
5. **Click:** "Create & View"
6. **КОПИРАЙ КЛЮЧА!** (показва се само веднъж!)

Ще изглежда така:
```
SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2.3 Verify Sender Identity

1. **Отиди в:** Settings → Sender Authentication
2. **Click:** "Verify a Single Sender"
3. **Попълни:**
   - From Name: `AMS Token`
   - From Email: `noreply@yourdomain.com` (или може да използваш личен email временно)
   - Reply To: същия email
   - Address, City, etc. (попълни реални данни)
4. **Click:** "Create"
5. **Провери** email-а и click verification link

⚠️ **ВАЖНО:** Ако нямаш домейн, използвай личен email (example: `your-email@gmail.com`) за тестване.

### 2.4 Test Email

В SendGrid dashboard:
1. **Email API** → **Dynamic Templates** (optional за по-хубави emails)
2. Или просто тествай с curl:

```bash
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "personalizations": [{"to": [{"email": "your-test@email.com"}]}],
    "from": {"email": "noreply@yourdomain.com"},
    "subject": "Test Email",
    "content": [{"type": "text/plain", "value": "Hello!"}]
  }'
```

✅ Ако получиш email → SendGrid е готов!

---

## 🌐 СТЪПКА 3: DEPLOY НА NETLIFY

### 3.1 Подготовка на Кода

1. **Отвори** проекта във VS Code (или твоя editor)
2. **Обнови** всички адреси:
   - Търси `YOUR_CONTRACT_ADDRESS_HERE` → замени с реален contract address
   - Търси `YOUR_OWNER_ADDRESS_HERE` → замени с твоя wallet address

3. **Инсталирай** dependencies:
```bash
cd AMS-FINAL-PROJECT
npm install
```

### 3.2 Push в GitHub

```bash
git init
git add .
git commit -m "Initial AMS Token commit"
git branch -M main

# Създай repo в GitHub (example: ams-token)
git remote add origin https://github.com/YOUR_USERNAME/ams-token.git
git push -u origin main
```

### 3.3 Създай Netlify Site

1. **Отиди на:** https://app.netlify.com
2. **Click:** "Add new site" → "Import an existing project"
3. **Избери:** GitHub
4. **Authorize** Netlify
5. **Избери** твоето repo: `ams-token`

### 3.4 Build Settings

**На страницата "Site settings":**

- **Branch to deploy:** `main`
- **Build command:** (остави ПРАЗНО)
- **Publish directory:** `.` (точка)
- **Functions directory:** `netlify/functions` (трябва автоматично да го открие)

**Click:** "Deploy site"

### 3.5 Добави Environment Variables

След deployment:

1. **Отиди в:** Site settings → Environment variables
2. **Click:** "Add a variable"

Добави ВСИЧКИ тези променливи:

```
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGciOi... (от Supabase Settings → API)
SENDGRID_API_KEY = SG.xxxxx
SENDGRID_FROM_EMAIL = noreply@yourdomain.com
OWNER_EMAIL = your-admin@email.com
SITE_URL = https://your-site.netlify.app (copy от Netlify)
OWNER_WALLET_ADDRESS = 0x... (твоя wallet)
CONTRACT_ADDRESS = 0x... (ще добавиш след deploy на contract)
```

3. **Click:** "Save"

### 3.6 Redeploy

След добавяне на variables:

1. **Отиди в:** Deploys
2. **Click:** "Trigger deploy" → "Deploy site"
3. **Чакай** 1-2 минути

✅ Сайтът е LIVE! (example: `https://ams-token-abc123.netlify.app`)

---

## 📜 СТЪПКА 4: DEPLOY SMART CONTRACT

### 4.1 Подготовка

1. **Инсталирай** Truffle:
```bash
npm install -g truffle
```

2. **Създай** Truffle проект:
```bash
mkdir ams-contract
cd ams-contract
truffle init
```

3. **Копирай** `AntiMafiaSponsorshipToken-UPDATED.sol` в `contracts/`

4. **Създай** migration файл: `migrations/2_deploy_token.js`
```javascript
const AMSToken = artifacts.require("AntiMafiaSponsorshipToken");

module.exports = function(deployer) {
  deployer.deploy(AMSToken);
};
```

### 4.2 Config за BSC Testnet

Редактирай `truffle-config.js`:

```javascript
const HDWalletProvider = require('@truffle/hdwallet-provider');

// !!! ВАЖНО: Никога не commit-вай mnemonic в Git !!!
const mnemonic = 'your twelve word seed phrase here';

module.exports = {
  networks: {
    bscTestnet: {
      provider: () => new HDWalletProvider(
        mnemonic, 
        'https://data-seed-prebsc-1-s1.binance.org:8545'
      ),
      network_id: 97,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    bsc: {
      provider: () => new HDWalletProvider(
        mnemonic,
        'https://bsc-dataseed.binance.org/'
      ),
      network_id: 56,
      confirmations: 10,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },
  compilers: {
    solc: {
      version: "0.8.20"
    }
  }
};
```

### 4.3 Deploy на Testnet

```bash
# Инсталирай dependency
npm install @truffle/hdwallet-provider

# Deploy
truffle migrate --network bscTestnet

# Запази contract address!
# Example output:
# > contract address: 0x1234567890123456789012345678901234567890
```

### 4.4 Verify Contract (Optional но препоръчително)

1. **Отиди на:** https://testnet.bscscan.com
2. **Потърси** твоя contract address
3. **Click:** "Contract" tab → "Verify and Publish"
4. **Попълни:**
   - Compiler: 0.8.20
   - License: MIT
   - Optimization: No
5. **Paste** contract код
6. **Click:** "Verify and Publish"

### 4.5 Обнови Frontend

Редактирай във ВСИЧКИ HTML файлове:

```javascript
const CONTRACT_ADDRESS = '0xYOUR_DEPLOYED_CONTRACT_ADDRESS';
```

Push промените:
```bash
git add .
git commit -m "Add contract address"
git push
```

Netlify ще redeploy автоматично!

### 4.6 Setup PancakeSwap Pair (След добавяне на ликвидност)

```javascript
// В MetaMask, извикай contract функциите:
await contract.methods.setPancakeswapPair("PAIR_ADDRESS_FROM_PANCAKESWAP").send({from: ownerAddress});
await contract.methods.setInitialPrice(INITIAL_PRICE).send({from: ownerAddress});
```

---

## 🧪 СТЪПКА 5: ТЕСТВАНЕ

### 5.1 Test Donation Flow

1. **Отвори** `https://your-site.netlify.app`
2. **Click** "Публична Страница"
3. **Отиди в** "Дарявай"
4. **Свържи** MetaMask
5. **Попълни** формата:
   - Име: Test Donor
   - Email: test@example.com
   - BNB: 0.001
6. **Click** "Дари" (Вариант А или Б)
7. **Потвърди** транзакцията в MetaMask

### 5.2 Провери Database

1. **Отиди в** Supabase → Table Editor → `donations`
2. **Трябва да видиш** новия запис!

### 5.3 Провери Email

1. **Провери** email на `OWNER_EMAIL` → трябва да имаш notification!
2. **Провери** email на `test@example.com` → трябва да имаш confirmation!

### 5.4 Test Admin Panel

1. **Отиди на** `https://your-site.netlify.app`
2. **Click** "Admin Panel"
3. **Въведи** парола (или свържи owner wallet)
4. **Отвори** "Donation Queue"
5. **Трябва да видиш** твоето test donation!
6. **Click** "Обработи Следващо Donation"

### 5.5 Провери Netlify Functions Logs

1. **Отиди в** Netlify Dashboard → Functions
2. **Click** на function (example: `save-donation`)
3. **Провери** logs за errors

---

## 🎉 СТЪПКА 6: GO LIVE!

### 6.1 Final Checklist

- [ ] ✅ Supabase database работи
- [ ] ✅ SendGrid email работи
- [ ] ✅ Netlify site е deploy-нат
- [ ] ✅ Contract е deploy-нат на BSC Mainnet
- [ ] ✅ Contract address е обновен във frontend
- [ ] ✅ PancakeSwap pair е set-нат
- [ ] ✅ Test donation работи
- [ ] ✅ Admin panel работи
- [ ] ✅ Emails се изпращат

### 6.2 Setup Custom Domain (Optional)

1. **Купи домейн** (example: Namecheap, GoDaddy)
2. **В Netlify:** Domain settings → Add custom domain
3. **Обнови DNS** records (Netlify ще покаже какво)
4. **Чакай** 24-48 часа за DNS propagation

### 6.3 Security Checklist

- [ ] ✅ Смени admin password в root `index.html`
- [ ] ✅ Добави rate limiting (optional)
- [ ] ✅ Enable HTTPS (автоматично в Netlify)
- [ ] ✅ Verify contract в BSCScan
- [ ] ✅ Audit contract код (препоръчително)
- [ ] ✅ Backup Supabase database (Settings → Database → Backups)

### 6.4 Monitoring

**Setup alerts:**
1. **Netlify:** Deploy notifications → Добави email/Slack
2. **Supabase:** Dashboard → Провери quotas
3. **SendGrid:** Dashboard → Monitor email stats

**Check regular:**
- Netlify function logs
- Supabase database size
- SendGrid quota (100 emails/day безплатно)

---

## 🆘 TROUBLESHOOTING

### ❌ "Function execution error"

**Причина:** Missing environment variables

**Решение:**
1. Провери Netlify → Environment variables
2. Redeploy сайта

### ❌ "Database connection failed"

**Причина:** Грешен SUPABASE_SERVICE_KEY

**Решение:**
1. Provери Supabase → Settings → API
2. Copy правилния `service_role` key
3. Update в Netlify
4. Redeploy

### ❌ "Email not sending"

**Причина:** SendGrid API key или sender verification

**Решение:**
1. Провери SendGrid dashboard за errors
2. Verify sender identity
3. Провери SENDGRID_FROM_EMAIL е verified

### ❌ "Contract call failed"

**Причина:** Грешен contract address или ABI

**Решение:**
1. Провери CONTRACT_ADDRESS във frontend
2. Провери че contract е deploy-нат
3. Verify в BSCScan

---

## 📞 SUPPORT

**Документация:**
- Supabase: https://supabase.com/docs
- Netlify: https://docs.netlify.com
- SendGrid: https://docs.sendgrid.com

**Помощ:**
- Check browser console (F12)
- Check Netlify function logs
- Check Supabase logs

---

## 🎯 УСПЕХ!

Проектът е LIVE и готов за production! 🚀

🛡️ Anti-Mafia-Sponsorship Token
