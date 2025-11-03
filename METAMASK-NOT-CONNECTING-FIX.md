# 🔧 METAMASK НЕ СЕ СВЪРЗВА - QUICK FIX

## ❓ Проблем: "MetaMask не е инсталиран" дори когато е инсталиран

---

## 🧪 СТЪПКА 1: ТЕСТВАЙ С test-metamask.html

### Отвори тестовата страница:
```
public/test-metamask.html
```

### Натисни бутоните:
1. **"Check MetaMask"** - Виждаш ли `✅ MetaMask DETECTED`?
2. **"Test Connect"** - Свързва ли се успешно?

### Ако Test Page работи:
→ Проблемът е с connect.html (browser cache)
→ Отиди на СТЪПКА 2

### Ако Test Page НЕ работи:
→ Проблемът е с MetaMask installation
→ Отиди на СТЪПКА 3

---

## 🔄 СТЪПКА 2: CLEAR BROWSER CACHE

### Chrome/Edge:
```
1. Ctrl + Shift + Delete
2. Select "Cached images and files"
3. Click "Clear data"
4. Hard refresh: Ctrl + Shift + R
```

### Firefox:
```
1. Ctrl + Shift + Delete
2. Select "Cache"
3. Click "Clear Now"
4. Hard refresh: Ctrl + Shift + R
```

### Safari:
```
1. Cmd + Option + E (Empty caches)
2. Hard refresh: Cmd + Shift + R
```

### След това:
1. Затвори ВСИЧКИ browser tabs
2. Restart browser-а
3. Отвори connect.html отново
4. Трябва да работи! ✅

---

## 🦊 СТЪПКА 3: ПРОВЕРКА НА METAMASK

### A. Инсталиран ли е?
```
Chrome: chrome://extensions
Firefox: about:addons
```

Виждаш ли MetaMask в списъка?

### B. Enabled ли е?
Toggle-ът трябва да е **ON** (син/зелен)

### C. Разрешен ли е на file:// URLs? (ако тестваш локално)
```
Chrome: chrome://extensions
→ MetaMask → Details
→ "Allow access to file URLs" ✅
```

### D. Locked ли е?
Click на MetaMask икона → Трябва да виждаш wallet, не "Unlock"

---

## 🌐 СТЪПКА 4: ТЕСТВАЙ НА LOCAL SERVER

Ако file:// не работи, използвай local server:

### Python 3:
```bash
cd AMS-FINAL-PROJECT/public
python -m http.server 8000

# Отвори: http://localhost:8000/connect.html
```

### Node.js (npx):
```bash
cd AMS-FINAL-PROJECT/public
npx http-server -p 8000

# Отвори: http://localhost:8000/connect.html
```

### PHP:
```bash
cd AMS-FINAL-PROJECT/public
php -S localhost:8000

# Отвори: http://localhost:8000/connect.html
```

Local server решава много permission проблеми! ✅

---

## 🔍 СТЪПКА 5: BROWSER CONSOLE DEBUG

### Отвори Console (F12):

1. **Отвори connect.html**
2. **Натисни F12** (Developer Tools)
3. **Tab "Console"**
4. **Refresh страницата** (F5)

### Търси за:

#### ✅ Good signs:
```
✅ MetaMask detected!
window.ethereum: true
```

#### ❌ Bad signs:
```
window.ethereum: false
❌ No wallet provider found
```

#### ⚠️ Errors:
```
Uncaught ReferenceError: ethereum is not defined
Refused to load script...
```

### Ако виждаш error:
Screenshot-ни го и провери:
- Ad blocker блокира ли скриптове?
- Content Security Policy error?
- Script loading failed?

---

## 💻 СТЪПКА 6: TEST MANUAL CONNECTION

### В Browser Console, напиши:

```javascript
// Test 1: Check ethereum
typeof window.ethereum
// Expected: "object"

// Test 2: Check MetaMask
window.ethereum.isMetaMask
// Expected: true

// Test 3: Try to connect
window.ethereum.request({ method: 'eth_requestAccounts' })
  .then(accounts => console.log('✅ Connected:', accounts[0]))
  .catch(error => console.error('❌ Error:', error))
```

### Ако Test 3 работи:
→ MetaMask е OK, проблемът е с кода
→ Използвай test-metamask.html вместо connect.html

---

## 🔥 СТЪПКА 7: NUCLEAR OPTION

Ако нищо не работи:

### Reset MetaMask:
```
1. Click MetaMask икона
2. Settings → Advanced
3. "Reset Account" (не губиш coins!)
4. Restart browser
5. Test отново
```

### Reinstall MetaMask:
```
1. Backup seed phrase! (ВАЖНО!)
2. Uninstall MetaMask extension
3. Clear browser cache (Ctrl+Shift+Del)
4. Restart browser
5. Install MetaMask отново
6. Import wallet със seed phrase
7. Test отново
```

---

## 📱 MOBILE DEBUGGING:

### Android Chrome:
```
1. chrome://inspect
2. Connect phone с USB
3. Enable USB debugging
4. Inspect WebView
```

### iOS Safari:
```
1. Settings → Safari → Advanced → Web Inspector
2. Connect iPhone с cable
3. Safari на Mac → Develop → iPhone
```

### Или използвай:
MetaMask Mobile app → Browser tab → Твоят URL

---

## ✅ WORKING ALTERNATIVES:

### Ако connect.html не работи:

1. **Използвай test-metamask.html** ⭐
   - По-опростен код
   - Better debugging
   - Same functionality

2. **Използвай donate.html директно**
   - Там също има MetaMask connection
   - Auto-fill на wallet address

3. **Използвай WalletConnect**
   - QR code connection
   - Works на mobile
   - No browser extension needed

---

## 🎯 MOST COMMON FIXES:

### 90% от проблемите се решават с:

1. ✅ **Clear browser cache** + Hard refresh
2. ✅ **Check MetaMask е enabled** в extensions
3. ✅ **Allow file:// access** (ако е локално)
4. ✅ **Use local server** instead of file://
5. ✅ **Disable ad blockers** temporary

---

## 📞 STILL NOT WORKING?

### Провери:

1. Browser version е ли up-to-date?
2. MetaMask version е ли latest?
3. Има ли други wallet extensions конфликт?
4. Incognito mode работи ли?
5. Different browser работи ли?

### Пробвай:

- Chrome Incognito: Ctrl+Shift+N
- Firefox Private: Ctrl+Shift+P
- Disable всички extensions освен MetaMask
- Test на друг компютър/phone

---

## 🎉 SUCCESS CHECKLIST:

След fix, трябва да виждаш:

✅ test-metamask.html показва "✅ MetaMask DETECTED"
✅ "Test Connect" бутонът работи
✅ connect.html се зарежда без errors
✅ MetaMask popup се показва when clicking button
✅ Connection succeeds
✅ Address се показва в status

---

## 📝 REPORT ISSUE:

Ако все още не работи, дай ми:

1. Browser + version (Chrome 120, Firefox 121, и т.н.)
2. MetaMask version
3. OS (Windows 11, macOS 14, и т.н.)
4. Error message от console (screenshot)
5. test-metamask.html резултат (screenshot)
6. file:// или http:// ?

Ще оправим проблема! 🚀
