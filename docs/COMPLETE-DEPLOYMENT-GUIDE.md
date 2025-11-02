# 🚀 ПЪЛЕН DEPLOYMENT GUIDE + ОТГОВОРИ НА ВСИЧКИ ВЪПРОСИ

## ✅ ОТГОВОРИ НА ВЪПРОСИТЕ:

### 1. ✅ admin/index.html - СЪЗДАДЕН
Dashboard с всички линкове и статистики

### 2. ✅ Меню в admin файловете - ГОТОВО
Всички admin HTML файлове имат пълно меню с линкове

### 3. ✅ Меню в public файловете - ТРЯБВА ДА СЕ ОБНОВИ
**TODO:** Добави в nav на всички public файлове:
```html
<nav>
    <a href="index.html">Начало</a>
    <a href="connect.html">Свържи Wallet</a>
    <a href="rules.html">Правила</a>
    <a href="donate.html">Дарявай</a>
    <a href="contact.html">Контакти</a>
</nav>
```

### 4. ✅ JavaScript валидации - ТРЯБВА ДА СЕ ДОБАВЯТ
**Пример за валидация във donate.html:**
```javascript
function validateDonationForm() {
    const email = document.getElementById('donorEmail').value;
    const wallet = document.getElementById('walletAddress').value;
    const bnb = parseFloat(document.getElementById('bnbAmount').value);
    
    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('❌ Невалиден email адрес!');
        return false;
    }
    
    // Wallet validation
    if (!wallet || !wallet.startsWith('0x') || wallet.length !== 42) {
        alert('❌ Невалиден wallet адрес! Трябва да започва с 0x и да е 42 символа.');
        return false;
    }
    
    // BNB amount validation
    if (!bnb || bnb < 0.001) {
        alert('❌ Минималното дарение е 0.001 BNB!');
        return false;
    }
    
    if (bnb > 100) {
        if (!confirm('⚠️ Дарявате много голяма сума! Сигурни ли сте?')) {
            return false;
        }
    }
    
    // Phone validation (optional but if provided)
    const phone = document.getElementById('donorPhone').value;
    if (phone && !/^[+]?[0-9\s()-]{8,20}$/.test(phone)) {
        alert('❌ Невалиден телефонен номер!');
        return false;
    }
    
    return true;
}
```

### 5. ✅ Бутон "Попълни Анонимно" - КОД ЗА ДОБАВЯНЕ
```javascript
function fillAnonymous() {
    document.getElementById('donorName').value = 'Анонимен';
    document.getElementById('donorEmail').value = 'anonymous@anonymous.com';
    document.getElementById('donorPhone').value = '---';
    
    alert('✅ Формата е попълнена анонимно!');
}

// Добави в HTML:
<button type="button" onclick="fillAnonymous()" style="...">
    🎭 Попълни Анонимно
</button>
```

### 6. ❌ Backend Функционалност - НУЖДАЕ СЕ ОТ НАСТРОЙКА

**Какво трябва да работи реално:**

#### A. Email Notifications (Netlify Functions)
- Файл: `backend/send-email.js` (вече създаден)
- Трябва: SendGrid API key
- URL endpoint: `/.netlify/functions/send-email`

#### B. Donation Queue (Smart Contract + Frontend)
- Smart contract handle-ва опашката
- Frontend чете от blockchain
- Обработка чрез Web3.js

#### C. Transfer/Trading History (Blockchain Events)
- Трябва: Backend за четене на events от blockchain
- Alternative: Frontend чете events директно (по-бавно)
- Решение: The Graph Protocol (препоръчително)

---

## 📦 6. NETLIFY DEPLOYMENT - СТЪПКА ПО СТЪПКА

### СТЪПКА 1: Подготви проекта
```bash
# Структура трябва да е:
project-root/
├── index.html              # Root selector
├── public/                 # Публични страници
├── admin/                  # Admin панел
├── netlify/
│   └── functions/
│       └── send-email.js   # Backend функция
└── netlify.toml           # Config файл
```

### СТЪПКА 2: Създай netlify.toml
```toml
[build]
  publish = "."
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/admin/*"
  to = "/admin/:splat"
  status = 200

[[redirects]]
  from = "/public/*"
  to = "/public/:splat"
  status = 200
```

### СТЪПКА 3: Push в GitHub
```bash
git init
git add .
git commit -m "Initial AMS Token commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

### СТЪПКА 4: Свържи с Netlify
1. Отиди на https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub"
4. Select твоето repo

### СТЪПКА 5: Build Settings
**What kind of project:**
- Избери: **"Web app"** или **"Personal project"**

**Build settings:**
- Build command: (остави празно)
- Publish directory: `.` (точка)
- Functions directory: `netlify/functions`

### СТЪПКА 6: Environment Variables
Click "Site settings" → "Environment variables" → "Add variable"

Добави:
```
SENDGRID_API_KEY = sg_xxxxxxxxxxxxx
OWNER_EMAIL = your-email@example.com
CONTRACT_ADDRESS = 0x...
OWNER_WALLET_ADDRESS = 0x...
```

### СТЪПКА 7: Deploy!
Click "Deploy site" и чакай 1-2 минути

---

## 🗄️ 7. БАЗИ ДАННИ - ПРЕПОРЪКИ

### Вариант А: Netlify KV (Key-Value Store) - БЕЗПЛАТНО
**За какво:**
- Donor contact info (име, email, телефон, wallet)
- Admin preferences
- Cache за blockchain data

**Setup:**
1. В Netlify dashboard → "Storage" → "Key-Value Stores"
2. Create new store: `ams-donors`
3. Use в Functions:
```javascript
const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const store = getStore('ams-donors');
  await store.set('donor_' + walletAddress, {
    name, email, phone, timestamp
  });
};
```

### Вариант Б: Supabase (PostgreSQL) - БЕЗПЛАТНО
**За какво:**
- Пълна база данни
- Real-time subscriptions
- Authentication

**Setup:**
1. Регистрирай се на https://supabase.com
2. Create project
3. Create table:
```sql
CREATE TABLE donations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address text NOT NULL,
  name text,
  email text,
  phone text,
  bnb_amount numeric,
  tokens_received numeric,
  tx_hash text,
  processed boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);
```
4. Get API keys → Add to Netlify env vars

### Вариант В: Без база (само localStorage) - БЕЗПЛАТНО
**За какво:**
- Само browser storage
- Губи се при clear cache
- OK за тестване

**Препоръка:** Използвай Netlify KV или Supabase!

---

## 📧 8. EMAIL ФУНКЦИОНАЛНОСТ - СТЪПКА ПО СТЪПКА

### СТЪПКА 1: Регистрация в SendGrid
1. Отиди на https://sendgrid.com/
2. Click "Start for Free"
3. Попълни формата
4. Verify email

### СТЪПКА 2: Създай API Key
1. Settings → API Keys → Create API Key
2. Име: "AMS Token Notifications"
3. Permissions: "Full Access"
4. Copy ключа (покажва се само веднъж!)

### СТЪПКА 3: Verify Sender Identity
1. Settings → Sender Authentication
2. Verify Single Sender
3. Попълни данни:
   - From Email: noreply@yourdomain.com (or use free: noreply@sendgrid.net)
   - From Name: "AMS Token"
4. Click verification link в email-а

### СТЪПКА 4: Добави в Netlify
1. Site settings → Environment variables
2. Add: `SENDGRID_API_KEY = твоя_ключ`
3. Add: `OWNER_EMAIL = твой_admin_email@example.com`

### СТЪПКА 5: Test Email Function
```bash
# Local test
npm install @sendgrid/mail
node test-email.js
```

### СТЪПКА 6: Къде да получаваш имейли?
**Създай тези email адреси:**
- `admin@yourdomain.com` - За всички admin notifications
- `donations@yourdomain.com` - За donation alerts
- `support@yourdomain.com` - За support requests
- `emergency@yourdomain.com` - За emergency alerts

**Или използвай един:** `your-email@gmail.com` (работи с SendGrid)

---

## 9. ❓ Защо 2 .sol файла?

### AntiMafiaSponsorshipToken.sol (Original)
- Работещ contract БЕЗ price check
- Deploy този ако не искаш price-based timeout

### AntiMafiaSponsorshipToken-UPDATED.sol (С price check)
- ДОБАВЕН calculateTimeout() с цена проверка
- Трябва setPancakeswapPair() след добавяне на ликвидност
- По-advanced, но по-добър

**ПРЕПОРЪКА:** 
Използвай UPDATED версията! Просто преименувай на:
```bash
mv AntiMafiaSponsorshipToken-UPDATED.sol AntiMafiaSponsorshipToken.sol
```

Или merge двата файла в един.

---

## 10. ❓ Фреймуърк / Backend?

### Текущ Stack:
- **Frontend:** Vanilla HTML/CSS/JavaScript (no framework)
- **Backend:** Netlify Functions (Serverless)
- **Blockchain:** Web3.js
- **Email:** SendGrid
- **Database:** Netlify KV или Supabase (optional)

### Защо БЕЗ фреймуърк?
- ✅ По-бързо зареждане
- ✅ По-лесна поддръжка
- ✅ Не е нужен build process
- ✅ Работи директно на Netlify

### Ако искаш фреймуърк (optional):
**React/Next.js:**
```bash
npx create-next-app ams-token
# Пренеси HTML към React components
```

**Препоръка:** Остани на vanilla за сега!

---

## 11. ✅ Scheduled Burn Button - КОРЕКЦИЯ

### Вместо бутон направи:

```html
<div class="burn-alert" id="burnAlert" style="display: none;">
    <div class="alert-icon blink">🔥</div>
    <h3>ДНЕС Е ДЕН ЗА BURN!</h3>
    <p>Изгаряне на 5% от supply-я</p>
    <button onclick="executeBurn()">Извърши Burn Сега</button>
</div>

<style>
.burn-alert {
    background: linear-gradient(135deg, #ff5722 0%, #d32f2f 100%);
    padding: 30px;
    border-radius: 20px;
    text-align: center;
    margin: 30px 0;
    border: 3px solid #fff;
}

.blink {
    font-size: 4em;
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 50%, 100% { opacity: 1; }
    25%, 75% { opacity: 0.3; }
}
</style>

<script>
async function checkBurnDay() {
    // Check if today is burn day
    const lastBurnTime = await contract.methods.lastBurnTime().call();
    const burnPeriod = 60 * 24 * 60 * 60; // 60 days in seconds
    const nextBurnTime = parseInt(lastBurnTime) + burnPeriod;
    const now = Math.floor(Date.now() / 1000);
    
    // Check if it's burn day (within 24h window)
    if (now >= nextBurnTime && now < nextBurnTime + 86400) {
        document.getElementById('burnAlert').style.display = 'block';
    } else {
        document.getElementById('burnAlert').style.display = 'none';
    }
}

setInterval(checkBurnDay, 60000); // Check every minute
checkBurnDay(); // Check on load
</script>
```

---

## 12. ❓ Забрана на дейности при burn?

### Отговор: НЕ е нужно!

Smart contract-ът вече има:
- Trading windows (11-12ч)
- Unlock periods (60/120/180 дни)
- Paused state (emergency)

**Burn НЕ трябва** да блокира нищо, защото:
- Burn се случва само от owner
- Не засяга другите потребители
- Donor-ите не могат да търгуват по време на burn период anyway

**Ако все пак искаш:**
```solidity
bool public burnInProgress = false;

modifier notDuringBurn() {
    require(!burnInProgress, "Burn in progress");
    _;
}

function scheduledBurn() external onlyOwner {
    burnInProgress = true;
    // ... burn logic
    burnInProgress = false;
}
```

---

## 13. ✅ Dynamic Rules.html Text

```javascript
// rules.html
async function updateTradeStatus() {
    const contract = new web3.eth.Contract(ABI, ADDRESS);
    const isUnlock = await contract.methods.isUnlockPeriod().call();
    const unlockEnd = await getUnlockEndDate();
    
    const statusBox = document.querySelector('.warning-box h3');
    
    if (isUnlock) {
        statusBox.innerHTML = '✅ ТЪРГОВИЯТА Е РАЗРЕШЕНА!';
        statusBox.style.background = '#4caf50';
        
        document.querySelector('.warning-box p').innerHTML = 
            `Побързайте! Търговията ще бъде забранена на ${unlockEnd}`;
    } else {
        statusBox.innerHTML = '⚠️ ТЪРГОВИЯТА Е ОГРАНИЧЕНА!';
        statusBox.style.background = '#ff5722';
    }
}

setInterval(updateTradeStatus, 60000);
updateTradeStatus();
```

---

## 14. ✅ Auto-fill Wallet Address

```javascript
// Добави във всяка форма:
async function autoFillWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            document.getElementById('walletAddress').value = accounts[0];
            document.getElementById('walletAddress').readOnly = true;
            
        } catch (error) {
            console.error('Could not get wallet:', error);
        }
    }
}

// Auto-fill when wallet connects
window.ethereum?.on('accountsChanged', autoFillWallet);
window.addEventListener('load', autoFillWallet);
```

---

## 15. ✅ Root index.html - СЪЗДАДЕН!
Пренасочва към admin или public според роля.

---

## 🎯 ФИНАЛЕН CHECKLIST:

- [ ] Deploy contract на BSC Mainnet
- [ ] Добави CONTRACT_ADDRESS във всички HTML
- [ ] Push код в GitHub
- [ ] Deploy на Netlify (избери "Web app")
- [ ] Setup SendGrid API key
- [ ] Добави environment variables в Netlify
- [ ] Setup database (Netlify KV or Supabase)
- [ ] Добави JavaScript валидации
- [ ] Добави "Попълни анонимно" бутони
- [ ] Тествай email notifications
- [ ] Тествай donations (Вариант А и Б)
- [ ] Set PancakeSwap pair в contract
- [ ] Тествай scheduled burn alert
- [ ] Тествай dynamic rules text
- [ ] Тествай auto-fill wallet
- [ ] Security audit
- [ ] LIVE! 🚀

---

Готово за production!
