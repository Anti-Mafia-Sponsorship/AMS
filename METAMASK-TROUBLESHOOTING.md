# 🔧 METAMASK TROUBLESHOOTING GUIDE

## ❌ Проблем: "MetaMask не е инсталиран"

### Причини защо може да не работи:

---

## 1. ✅ MetaMask НАИСТИНА не е инсталиран

### Проверка:
- Виждаш ли 🦊 иконка в browser toolbar?
- Отиди в Extensions (Ctrl+Shift+E в Chrome)
- Търси "MetaMask"

### Решение:
**Инсталирай MetaMask:**
1. Chrome: https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn
2. Firefox: https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/
3. Brave: Built-in, но трябва да го enable-неш
4. Edge: https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm

---

## 2. 🦊 MetaMask е инсталиран, но DISABLED

### Проверка:
```
Chrome: Menu → Extensions → Manage Extensions
Търси MetaMask → Провери toggle-а
```

### Решение:
- Enable MetaMask extension
- Refresh страницата

---

## 3. 🔒 Browser блокира MetaMask inject

### Проверка:
Отвори Console (F12) и виж дали има errors като:
```
Content Security Policy blocked...
```

### Решение:
- Отвори страницата в **Incognito/Private mode**
- Разреши extensions в Incognito:
  ```
  Chrome → Extensions → MetaMask → Details
  → Allow in incognito ✅
  ```

---

## 4. ⏰ MetaMask не е зареден още

### Проблем:
Страницата се зарежда преди MetaMask да inject-не `window.ethereum`

### Решение в новия connect.html:
✅ Вече има `window.load` event listener
✅ Retry логика
✅ Debug информация

---

## 5. 🌐 Използваш файл:// протокол

### Проверка:
URL-ът започва ли с:
```
file:///C:/Users/...
```

### Проблем:
Някои browsers ограничават extensions на `file://`

### Решение:
**Вариант А: Използвай local server**
```bash
# Python 3
cd AMS-FINAL-PROJECT/public
python -m http.server 8000

# Отвори: http://localhost:8000/connect.html
```

**Вариант Б: Разреши file access**
```
Chrome: chrome://extensions
→ MetaMask → Details
→ "Allow access to file URLs" ✅
```

---

## 6. 🔄 Browser cache проблем

### Решение:
```
1. Hard refresh: Ctrl+Shift+R (Win) или Cmd+Shift+R (Mac)
2. Clear cache: Ctrl+Shift+Delete
3. Restart browser
```

---

## 7. 🦊 MetaMask е lock-нат

### Проверка:
Click на MetaMask икона → Показва ли "Unlock"?

### Решение:
- Unlock MetaMask с твоята парола
- Refresh страницата

---

## 8. 🚫 Ad blocker блокира

### Проверка:
Имаш ли uBlock Origin, AdBlock, или друг ad blocker?

### Решение:
- Disable ad blocker за сайта
- Или whitelist `localhost` и `netlify.app`

---

## 9. 🔧 Използваш стара версия на MetaMask

### Проверка:
```
MetaMask → Settings → About
Версия: X.X.X
```

### Решение:
- Update MetaMask на най-новата версия
- Restart browser

---

## 🆕 НОВИЯ connect.html има DEBUG режим!

### Как да го използваш:

1. Отвори `connect.html`
2. Scroll down до "Debug Info" секцията
3. Виж какво точно се случва:

```
🔍 Checking for MetaMask...
window.ethereum: true
window.web3: false
window.ethereum.isMetaMask: true
✅ MetaMask detected!
```

Ако виждаш:
```
window.ethereum: false
```

→ MetaMask НЕ е инжектнат! Провери причини 1-5 по-горе.

---

## 🧪 ТЕСТВАНЕ:

### Test 1: Browser Console
```javascript
// Отвори Console (F12) и напиши:
typeof window.ethereum

// Трябва да върне:
"object"   // ✅ MetaMask е наличен

// Ако връща:
"undefined" // ❌ MetaMask НЕ е инжектнат
```

### Test 2: Check isMetaMask
```javascript
window.ethereum.isMetaMask

// Трябва да върне:
true  // ✅ Това е MetaMask

// Ако връща:
false // ⚠️ Друг wallet provider
undefined // ❌ Няма ethereum provider
```

### Test 3: Manual connect
```javascript
window.ethereum.request({ method: 'eth_requestAccounts' })
  .then(accounts => console.log('✅ Connected:', accounts[0]))
  .catch(error => console.error('❌ Error:', error));
```

---

## 📱 MOBILE TROUBLESHOOTING:

### На телефон/таблет:

**⚠️ MetaMask browser extension НЕ работи на mobile!**

### Решение за mobile:
1. **Използвай MetaMask Mobile App**
   - Android: Google Play Store
   - iOS: App Store

2. **Отвори сайта ВЪВ MetaMask app:**
   ```
   MetaMask app → Browser tab → Въведи URL
   ```

3. **Или използвай WalletConnect** (future feature)

---

## 🔥 ПОСЛЕДНА ОПЦИЯ: Nuclear option

Ако нищо не работи:

### Пълен reset:

1. **Uninstall MetaMask:**
   ```
   Chrome → Extensions → Remove MetaMask
   ```

2. **Clear ALL browser data:**
   ```
   Ctrl+Shift+Delete → All time → Everything ✅
   ```

3. **Restart browser**

4. **Reinstall MetaMask:**
   ```
   https://metamask.io/download/
   ```

5. **Setup отново**

6. **Test на connect.html**

---

## ✅ НОВИЯТ connect.html е ПО-ДОБЪР!

### Какво прави различно:

1. ✅ **Multiple detection methods**
   - Проверява `window.ethereum`
   - Проверява `window.web3`
   - Проверява `isMetaMask` flag

2. ✅ **Debug information**
   - Показва точно какво се случва
   - Console logs за всяка стъпка

3. ✅ **Better error messages**
   - Конкретни грешки вместо generic
   - Hints за решаване на проблема

4. ✅ **Download link**
   - Директен link към MetaMask download
   - Prompt ако не е открит

5. ✅ **Retry логика**
   - По-robust detection
   - Handles edge cases

---

## 🎯 БЪРЗА ДИАГНОСТИКА:

### Копирай това в Console (F12):

```javascript
console.log('=== MetaMask Diagnostic ===');
console.log('window.ethereum:', typeof window.ethereum);
console.log('window.web3:', typeof window.web3);
console.log('isMetaMask:', window.ethereum?.isMetaMask);
console.log('provider:', window.ethereum?.constructor?.name);
console.log('=========================');
```

**Изпрати резултата за debugging!**

---

## 📞 ОЩЕ ПРОБЛЕМИ?

### Провери:
1. ✅ MetaMask е инсталиран и enabled
2. ✅ Browser-ът е updated
3. ✅ Не си в Incognito (освен ако не си разрешил)
4. ✅ Ad blockers са disabled
5. ✅ Clear cache направен
6. ✅ Hard refresh (Ctrl+Shift+R)

### Debug със новия connect.html:
- Scroll до "Debug Info"
- Виж какво точно се случва
- Follow инструкциите

---

## 🚀 УСПЕХ!

Новият `connect.html` има много по-добър detection и debug! Трябва да работи сега! ✅
