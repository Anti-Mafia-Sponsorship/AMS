# 🛡️ AMS TOKEN - ПЪЛНА СТРУКТУРА НА ПРОЕКТА

## 📁 Структура:

```
AMS-FINAL-PROJECT/
│
├── public/                          # 🌐 ПУБЛИЧНИ СТРАНИЦИ
│   ├── index.html                   # Начална страница
│   ├── connect.html                 # Свързване на wallet
│   ├── rules.html                   # Правила (с 6 таблици) ✨
│   ├── donate.html                  # Дарения (с контактна форма) ✨
│   └── contact.html                 # Контакти
│
├── admin/                           # 🔐 АДМИН ПАНЕЛ (ЗАЩИТЕН)
│   ├── queue-management.html        # Управление на donation queue ✨ NEW
│   ├── transfer-history.html        # История на transfers ✨ NEW
│   ├── trading-history.html         # История на trading ✨ NEW
│   ├── burn-tokens.html             # Scheduled + Manual burn ✨ NEW
│   ├── bbb-send-tokens-to-donor.html    # Изпрати резервни токени
│   ├── ggg-mint-and-send.html           # Mint и изпрати директно
│   ├── vvv-mint-new-AMS.html            # Mint за ликвидност
│   └── aaa-add-liquidity.html           # Добави ликвидност
│
├── backend/                         # ⚙️ BACKEND ФУНКЦИИ
│   ├── send-email.js                # Email notifications (Netlify Function) ✨
│   └── package.json                 # Dependencies
│
├── contracts/                       # 📜 SMART CONTRACTS
│   ├── AntiMafiaSponsorshipToken.sol         # Original
│   └── AntiMafiaSponsorshipToken-UPDATED.sol # С price check ✨ NEW
│
└── docs/                            # 📖 ДОКУМЕНТАЦИЯ
    ├── README.md                    # Основна документация
    ├── FULL-ANALYSIS.md             # Пълен анализ с таблици
    ├── CRITICAL-SUMMARY.md          # Кратко резюме
    └── HOSTING-RECOMMENDATIONS.md   # Хостинг препоръки
```

## ✨ НОВОСЪЗДАДЕНИ ФАЙЛОВЕ (от последния ти Request):

### 1. **queue-management.html** 
   - Показва pending и processed donations
   - Обработка на donations по FIFO
   - Филтри (статус, дата, сума)
   - Real-time статистики
   - Автоматично refresh на 30 сек

### 2. **transfer-history.html**
   - Последни 100 transfers от owner портфейла
   - Показва: баланс преди/след, адрес, име, контакти
   - Сортирани по дата

### 3. **trading-history.html**
   - Последни 100 trades на PancakeSwap
   - Само за owner портфейла
   - Показва: тип (buy/sell), цена, количество

### 4. **burn-tokens.html**
   - Scheduled Burn (5% на 60 дни)
   - Manual Burn (max 2% в деня на scheduled)
   - История на изгарянията
   - Автоматични проверки

### 5. **send-email.js** (Backend)
   - Изпраща имейл до owner при ново дарение
   - Изпраща потвърждение до донора
   - SendGrid integration
   - Включва всички контактни данни

### 6. **AntiMafiaSponsorshipToken-UPDATED.sol**
   - calculateTimeout() с price check ✅
   - getCurrentPrice() от PancakeSwap pair
   - setPancakeswapPair() функция
   - setInitialPrice() функция

### 7. **rules.html** (обновен)
   - 6 таблици според твоите изисквания:
     1. Donor правомощия по периоди
     2. Вариант А - Ръчно дарение
     3. Вариант Б - Автоматично дарение
     4. Кога расте/пада цената
     5. Timeout механизъм
     6. Sell tax механизъм
   - Коригирани периоди (60/120/180 дни)
   - Визуално оформени с цветове

### 8. **donate.html** (обновен)
   - Контактна форма с:
     - Име (optional)
     - Email (optional но препоръчителен!)
     - Телефон (optional)
     - Wallet адрес (автоматично или ръчно)
     - BNB сума
     - Checkbox за съгласие
   - Предупреждения за анонимност
   - Интеграция с backend email

## 🚀 DEPLOYMENT ИНСТРУКЦИИ:

### СТЪПКА 1: Deploy Smart Contract
```bash
# На BSC Testnet за тестване
truffle migrate --network bscTestnet

# След тестване → Mainnet
truffle migrate --network bsc
```

### СТЪПКА 2: Set PancakeSwap Pair (след добавяне на ликвидност)
```javascript
// От owner account:
await contract.methods.setPancakeswapPair("PAIR_ADDRESS").send({from: ownerAddress});
await contract.methods.setInitialPrice(INITIAL_PRICE).send({from: ownerAddress});
```

### СТЪПКА 3: Setup Backend (Netlify)
```bash
# 1. Качи проекта в GitHub
git init
git add .
git commit -m "Initial commit"
git push

# 2. Свържи с Netlify
# 3. Set environment variables:
SENDGRID_API_KEY=your_key_here
OWNER_EMAIL=your_email@example.com

# 4. Deploy!
```

### СТЪПКА 4: Обнови CONTRACT_ADDRESS във всички HTML файлове
Търси "YOUR_CONTRACT_ADDRESS_HERE" и замени с реалния адрес!

### СТЪПКА 5: Тествай всичко!
- Тествай donation (Вариант А и Б)
- Тествай queue management
- Тествай email notifications
- Тествай burn функциите

## ⚙️ КОНФИГУРАЦИЯ:

### Netlify Functions Setup:
Създай `netlify.toml`:
```toml
[build]
  functions = "backend"
  
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### SendGrid Setup:
1. Регистрирай се на sendgrid.com (безплатно)
2. Създай API key
3. Добави в Netlify environment variables

## 🔐 SECURITY:

### Admin Panel Protection:
Трябва да добавиш authentication! Опции:
1. Password protection (най-лесно)
2. MetaMask signature (по-сигурно)
3. OAuth (най-сигурно)

Пример за password:
```javascript
const ADMIN_PASSWORD = "твоя_сигурна_парола"; // Смени!

function checkAuth() {
    const password = prompt("Admin Password:");
    if (password !== ADMIN_PASSWORD) {
        window.location.href = "index.html";
    }
}
window.onload = checkAuth;
```

## ✅ CHECKLIST ПРЕДИ PRODUCTION:

- [ ] Deploy contract на Mainnet
- [ ] Обнови CONTRACT_ADDRESS във всички файлове
- [ ] Setup SendGrid и тествай emails
- [ ] Добави admin authentication
- [ ] Тествай на Testnet ВСИЧКО
- [ ] Set PancakeSwap pair address в contract
- [ ] Set initial price в contract
- [ ] Deploy сайта на Netlify
- [ ] Провери че email-ите работят
- [ ] Провери че queue management работи
- [ ] Тествай дарение (Вариант А и Б)

## 🐛 KNOWN LIMITATIONS:

1. **transfer-history.html и trading-history.html** - Трябва backend за blockchain events
2. **Donor details** - Трябва database за съхранение (сега localStorage)
3. **Admin auth** - Трябва да се добави (password/MetaMask)
4. **Real-time updates** - Трябва WebSocket или polling

## 📞 SUPPORT:

Ако имаш въпроси или проблеми:
1. Провери документацията
2. Тествай на Testnet първо
3. Провери console logs в browser
4. Провери Netlify logs за backend errors

## 🎉 ГОТОВО!

Всичко е подготвено и готово за deployment!
