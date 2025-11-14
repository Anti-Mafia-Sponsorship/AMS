# 🔒 REENTRANCY PROTECTION - Обяснение

## 🎯 Какво е Reentrancy Attack?

### Прост Пример:

Представи си банка:

```
Нормален процес:
1. Проверка: Имаш ли $100?
2. Тегли: Дай ми $100
3. Обнови баланс: Остават $0

✅ Всичко е наред
```

### Reentrancy Attack:

```
Атака:
1. Проверка: Имаш ли $100? ✅ Да
2. Тегли: Започни изпращане на $100
3. 🔴 ПО ВРЕМЕ НА ИЗПРАЩАНЕТО:
   - Извикай функцията ОТНОВО
   - Проверка: Имаш ли $100? ✅ Да (все още не е обновен!)
   - Тегли: Започни изпращане на още $100
   - И така нататък...
4. Обнови баланс (твърде късно!)

❌ Хакер изтегли $100 много пъти, докато балансът все още показва $100!
```

---

## 💻 КОД ПРИМЕР:

### Уязвим Код (БЕЗ защита):

```solidity
// ❌ VULNERABLE!
function withdraw(uint256 amount) external {
    require(balanceOf[msg.sender] >= amount, "Insufficient balance");
    
    // 1. Send money FIRST
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    
    // 2. Update balance AFTER
    // 🔴 TOO LATE! Attacker can call withdraw() again during step 1
    balanceOf[msg.sender] -= amount;
}
```

### Атака:

```solidity
// Attacker Contract
contract Attacker {
    VulnerableContract target;
    
    function attack() external {
        target.withdraw(100);  // Start attack
    }
    
    // This function is called when receiving money
    receive() external payable {
        if (address(target).balance >= 100) {
            target.withdraw(100);  // Call AGAIN!
        }
    }
}

// Result:
// 1. Call withdraw(100)
// 2. During send, receive() is triggered
// 3. receive() calls withdraw(100) again
// 4. Balance not updated yet, so check passes!
// 5. Steals all money! 💰💰💰
```

---

## 🛡️ REENTRANCY PROTECTION:

### Метод 1: Checks-Effects-Interactions Pattern

```solidity
// ✅ SAFE!
function withdraw(uint256 amount) external {
    // 1. Checks
    require(balanceOf[msg.sender] >= amount, "Insufficient");
    
    // 2. Effects (Update state FIRST!)
    balanceOf[msg.sender] -= amount;
    
    // 3. Interactions (External calls LAST!)
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
}

// Why safe?
// Even if attacker calls again, balance is already 0!
```

### Метод 2: Reentrancy Guard (OpenZeppelin)

```solidity
// ✅ SAFE!
contract MyToken {
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        
        _status = _ENTERED;  // Lock
        
        _;  // Execute function
        
        _status = _NOT_ENTERED;  // Unlock
    }
    
    function withdraw(uint256 amount) external nonReentrant {
        require(balanceOf[msg.sender] >= amount);
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
        
        balanceOf[msg.sender] -= amount;
    }
}

// Why safe?
// If attacker tries to call again:
// - _status is already _ENTERED
// - Second call fails immediately
// - Attack prevented! ✅
```

---

## 🎯 НАШИЯ ПРОЕКТ:

### Преди (V1):

```solidity
// ❌ NO PROTECTION
function transfer(address to, uint256 amount) external {
    balanceOf[msg.sender] -= amount;
    balanceOf[to] += amount;
    
    emit Transfer(msg.sender, to, amount);
}

// Vulnerable? 
// Depends on external calls
// If we add hooks later → vulnerable!
```

### След (V1.1):

```solidity
// ✅ PROTECTED
uint256 private _status;

modifier nonReentrant() {
    require(_status != _ENTERED);
    _status = _ENTERED;
    _;
    _status = _NOT_ENTERED;
}

function transfer(address to, uint256 amount) 
    external 
    nonReentrant  // 🛡️ PROTECTED
{
    balanceOf[msg.sender] -= amount;
    balanceOf[to] += amount;
    
    emit Transfer(msg.sender, to, amount);
}

// Safe! 
// Even if we add external calls later
// Even if recipient is malicious contract
// Protection always active ✅
```

---

## 📊 FAMOUS REENTRANCY ATTACKS:

### 1. The DAO Hack (2016)

```
Loss: $60 Million (3.6M ETH)
Cause: Reentrancy in withdraw function
Result: Ethereum hard fork (ETH/ETC split)
```

### 2. Uniswap/Lendf.Me (2020)

```
Loss: $25 Million
Cause: ERC777 reentrancy
Result: Protocol paused, funds recovered
```

### 3. CREAM Finance (2021)

```
Loss: $130 Million
Cause: Reentrancy + flash loan
Result: Major protocol update
```

---

## ✅ ЗАЩО Е ВАЖНО:

### За AMS Token:

```solidity
// Current functions that need protection:
function transfer() external nonReentrant { }
function mint() external nonReentrant { }
function processQueue() external nonReentrant { }
function rescueBNB() external nonReentrant { }

receive() external payable nonReentrant { }
```

### Защо?

```
1. receive() - Приема BNB donations
   → Можеше да се атакува ако извикваме external calls

2. processQueue() - Изпраща токени на donors
   → Loop през donation queue
   → Може да има malicious contract в queue

3. rescueBNB() - Изпраща BNB
   → Direct external call
   → Трябва защита

4. transfer() - За бъдещи hook integrations
   → Best practice protection
```

---

## 🔍 КАК ДА ТЕСТВАМЕ:

### Test Case:

```javascript
// Test reentrancy protection
it("Should prevent reentrancy attack", async function() {
    // Deploy attacker contract
    const Attacker = await ethers.getContractFactory("ReentrancyAttacker");
    const attacker = await Attacker.deploy(token.address);
    
    // Try attack
    await expect(
        attacker.attack()
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
    
    // ✅ Attack prevented!
});
```

---

## 💰 COST:

### Gas Cost:

```
Without nonReentrant:
- transfer(): ~50,000 gas

With nonReentrant:
- transfer(): ~52,300 gas

Extra cost: ~2,300 gas (~$0.001)

Worth it? ABSOLUTELY! ✅
Protection value: UNLIMITED
```

---

## 🎓 ЗАКЛЮЧЕНИЕ:

### Reentrancy Protection =

```
🛡️ Insurance срещу един от най-опасните attacks
💰 Спестява милиони в potential losses
✅ Standard security practice
🔒 Must-have за всеки token

Cost: ~$0.001 per transaction
Value: PRICELESS
```

### За AMS Token:

```
V1:   ❌ No protection
V1.1: ✅ Full protection on all critical functions

Upgrade to V1.1 = Upgrade security! 🚀
```

---

## 📚 LEARN MORE:

- [OpenZeppelin ReentrancyGuard](https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard)
- [Solidity by Example - Reentrancy](https://solidity-by-example.org/hacks/re-entrancy/)
- [The DAO Hack Explained](https://www.coindesk.com/learn/2016/06/25/understanding-the-dao-attack/)

---

**TL;DR:** Reentrancy = когато функция се извика отново преди да е завършила. Protection = lock/unlock механизъм. Essential = задължително за security! ✅
