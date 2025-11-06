# 🚀 UPGRADEABLE AMS TOKEN - DEPLOYMENT GUIDE

## 📦 СТРУКТУРА:

```
contracts/
├── AMSProxy.sol              ✅ Proxy (never changes address)
├── AMSToken_V1.sol            ✅ Implementation V1 (current logic)
└── AMSToken_V2.sol            ✅ Implementation V2 (example upgrade)
```

---

## 🎯 КАК РАБОТИ:

### Архитектура:

```
User
  ↓
Proxy Contract (Fixed Address: 0xPROXY)
  ↓ (delegatecall)
Implementation V1 (0xIMPL_V1)

WHEN UPGRADE NEEDED:
User
  ↓
Proxy Contract (Same Address: 0xPROXY) ← NEVER CHANGES!
  ↓ (delegatecall)
Implementation V2 (0xIMPL_V2) ← NEW LOGIC!
```

### Защо е важно:

```
✅ Users винаги използват същия адрес (0xPROXY)
✅ Exchanges listing остава същото
✅ Liquidity остава на същото място
✅ Holders НЕ трябва да правят нищо
✅ ТИ можеш да fix-неш bugs
```

---

## 📋 DEPLOYMENT ПРОЦЕС:

### Step 1: Deploy Implementation V1

```javascript
// Deploy AMSToken_V1.sol
const AMSToken_V1 = await ethers.getContractFactory("AMSToken_V1");
const implementation_v1 = await AMSToken_V1.deploy();
await implementation_v1.deployed();

console.log("Implementation V1:", implementation_v1.address);
// Example: 0x1234567890123456789012345678901234567890
```

### Step 2: Deploy Proxy

```javascript
// Deploy AMSProxy with implementation V1 and admin
const AMSProxy = await ethers.getContractFactory("AMSProxy");
const proxy = await AMSProxy.deploy(
    implementation_v1.address,  // Implementation address
    YOUR_ADMIN_ADDRESS          // Admin who can upgrade
);
await proxy.deployed();

console.log("Proxy (TOKEN ADDRESS):", proxy.address);
// Example: 0xABCDEF...
// ⚠️ THIS IS YOUR TOKEN ADDRESS - NEVER CHANGES!
```

### Step 3: Initialize Token

```javascript
// Connect to proxy as if it's the token
const token = await ethers.getContractAt("AMSToken_V1", proxy.address);

// Initialize (instead of constructor)
await token.initialize();

console.log("Token initialized!");
console.log("Name:", await token.name());
console.log("Symbol:", await token.symbol());
console.log("Total Supply:", await token.totalSupply());
```

### Step 4: Verify & Test

```javascript
// Verify proxy works
const balance = await token.balanceOf(YOUR_ADDRESS);
console.log("Your balance:", ethers.utils.formatEther(balance));

// Test transfer
await token.transfer(RECIPIENT, ethers.utils.parseEther("100"));
console.log("Transfer successful!");
```

---

## 🔄 UPGRADE ПРОЦЕС (When Bug Found):

### Step 1: Deploy New Implementation

```javascript
// Deploy AMSToken_V2.sol (or fixed V1)
const AMSToken_V2 = await ethers.getContractFactory("AMSToken_V2");
const implementation_v2 = await AMSToken_V2.deploy();
await implementation_v2.deployed();

console.log("Implementation V2:", implementation_v2.address);
```

### Step 2: Propose Upgrade (48h Timelock)

```javascript
// Connect to proxy as admin
const proxyAsAdmin = await ethers.getContractAt("AMSProxy", proxy.address);

// Propose upgrade
await proxyAsAdmin.proposeUpgrade(implementation_v2.address);

console.log("Upgrade proposed!");
console.log("Can execute after 48 hours");
```

### Step 3: Wait 48 Hours

```javascript
// Check time remaining
const timeRemaining = await proxyAsAdmin.upgradeTimeRemaining();
console.log("Time remaining:", timeRemaining, "seconds");

// ⏰ WAIT FOR TIMELOCK TO EXPIRE
```

### Step 4: Execute Upgrade

```javascript
// After 48 hours:
await proxyAsAdmin.executeUpgrade();

console.log("Upgrade complete!");

// Verify new version
const token = await ethers.getContractAt("AMSToken_V2", proxy.address);
console.log("Version:", await token.getVersion()); // "v2.0.0"

// Initialize V2 features
await token.initializeV2();
console.log("V2 features initialized!");
```

### Step 5: Test New Features

```javascript
// Test V2 features
await token.setMaxTransaction(ethers.utils.parseEther("50000"));
await token.setAntiBotDelay(5); // 5 seconds

console.log("V2 features working!");
```

---

## 🚨 EMERGENCY: Cancel Upgrade

```javascript
// If you made mistake in V2 code:
await proxyAsAdmin.cancelUpgrade();

console.log("Upgrade cancelled!");
console.log("Token still running on V1");
```

---

## 📊 FULL DEPLOYMENT SCRIPT:

```javascript
// scripts/deploy-upgradeable.js

const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Upgradeable AMS Token...\n");
    
    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "BNB\n");
    
    // 1. Deploy Implementation V1
    console.log("1️⃣  Deploying Implementation V1...");
    const AMSToken_V1 = await ethers.getContractFactory("AMSToken_V1");
    const implementation_v1 = await AMSToken_V1.deploy();
    await implementation_v1.deployed();
    console.log("✅ Implementation V1:", implementation_v1.address, "\n");
    
    // 2. Deploy Proxy
    console.log("2️⃣  Deploying Proxy...");
    const AMSProxy = await ethers.getContractFactory("AMSProxy");
    const proxy = await AMSProxy.deploy(
        implementation_v1.address,
        deployer.address  // Admin
    );
    await proxy.deployed();
    console.log("✅ Proxy (TOKEN ADDRESS):", proxy.address, "\n");
    
    // 3. Initialize Token
    console.log("3️⃣  Initializing Token...");
    const token = await ethers.getContractAt("AMSToken_V1", proxy.address);
    await token.initialize();
    console.log("✅ Token initialized!\n");
    
    // 4. Verify
    console.log("4️⃣  Verification:");
    console.log("   Name:", await token.name());
    console.log("   Symbol:", await token.symbol());
    console.log("   Decimals:", await token.decimals());
    console.log("   Total Supply:", ethers.utils.formatEther(await token.totalSupply()));
    console.log("   Owner:", await token.owner());
    console.log("   Owner Balance:", ethers.utils.formatEther(await token.balanceOf(deployer.address)));
    console.log("\n");
    
    // 5. Summary
    console.log("✅ DEPLOYMENT COMPLETE!\n");
    console.log("📋 Save these addresses:");
    console.log("   Token Address (Proxy):", proxy.address);
    console.log("   Implementation V1:", implementation_v1.address);
    console.log("   Admin:", deployer.address);
    console.log("\n");
    console.log("⚠️  IMPORTANT:");
    console.log("   - Use PROXY address for everything");
    console.log("   - Keep admin private key secure");
    console.log("   - Test thoroughly before mainnet");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

### Run Deployment:

```bash
# Testnet
npx hardhat run scripts/deploy-upgradeable.js --network bscTestnet

# Mainnet
npx hardhat run scripts/deploy-upgradeable.js --network bsc
```

---

## 🔧 UPGRADE SCRIPT:

```javascript
// scripts/upgrade-to-v2.js

const { ethers } = require("hardhat");

async function main() {
    console.log("🔄 Upgrading AMS Token to V2...\n");
    
    const PROXY_ADDRESS = "0xYourProxyAddress";
    
    // 1. Deploy V2
    console.log("1️⃣  Deploying Implementation V2...");
    const AMSToken_V2 = await ethers.getContractFactory("AMSToken_V2");
    const implementation_v2 = await AMSToken_V2.deploy();
    await implementation_v2.deployed();
    console.log("✅ Implementation V2:", implementation_v2.address, "\n");
    
    // 2. Propose Upgrade
    console.log("2️⃣  Proposing upgrade...");
    const proxy = await ethers.getContractAt("AMSProxy", PROXY_ADDRESS);
    await proxy.proposeUpgrade(implementation_v2.address);
    console.log("✅ Upgrade proposed!\n");
    
    const upgradeTime = await proxy.pendingUpgradeTime();
    console.log("   Can execute after:", new Date(upgradeTime * 1000).toLocaleString());
    console.log("   ⏰ Wait 48 hours...\n");
    
    console.log("📋 To execute upgrade after 48h, run:");
    console.log("   npx hardhat run scripts/execute-upgrade.js --network bsc");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

```javascript
// scripts/execute-upgrade.js

const { ethers } = require("hardhat");

async function main() {
    console.log("✅ Executing Upgrade...\n");
    
    const PROXY_ADDRESS = "0xYourProxyAddress";
    
    const proxy = await ethers.getContractAt("AMSProxy", PROXY_ADDRESS);
    
    // Check timelock
    const timeRemaining = await proxy.upgradeTimeRemaining();
    if (timeRemaining > 0) {
        console.log("❌ Timelock not expired yet!");
        console.log("   Remaining:", timeRemaining, "seconds");
        return;
    }
    
    // Execute
    await proxy.executeUpgrade();
    console.log("✅ Upgrade executed!\n");
    
    // Verify
    const newImpl = await proxy.implementation();
    console.log("New Implementation:", newImpl);
    
    // Initialize V2
    const token = await ethers.getContractAt("AMSToken_V2", PROXY_ADDRESS);
    await token.initializeV2();
    console.log("✅ V2 initialized!\n");
    
    console.log("Version:", await token.getVersion());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

---

## 🔒 SECURITY FEATURES:

### 1. Timelock (48 hours)
```
Защо: Дава време на holders да реагират
Как: Upgrade не може да се изпълни веднага
```

### 2. Two-Step Admin Transfer
```
1. Current admin calls: transferAdmin(newAdmin)
2. New admin calls: acceptAdmin()
→ Prevents accidental loss of control
```

### 3. Upgrade Cancellation
```
Ако грешка в новия код:
- Admin може да отмени upgrade
- Token остава на стария код
```

### 4. Emergency Pause
```
Ако критичен bug:
- Pause всички transfers
- Fix кода
- Upgrade
- Unpause
```

---

## ✅ TESTING CHECKLIST:

### Before Mainnet Deployment:

```
☐ Deploy на BSC Testnet
☐ Test initialize()
☐ Test all token functions
☐ Test upgrade process (V1 → V2)
☐ Test timelock (wait 48h)
☐ Test cancel upgrade
☐ Test emergency pause
☐ Test admin transfer
☐ Verify storage compatibility
☐ Test with real users
☐ Run for 1+ week
☐ Security audit
```

---

## 📈 UPGRADE SCENARIO EXAMPLES:

### Example 1: Fix Critical Bug

```
Day 1, 10:00 AM: Bug discovered in transfer logic
Day 1, 10:30 AM: Deploy fixed V1.1
Day 1, 11:00 AM: Propose upgrade
Day 3, 11:00 AM: Execute upgrade
Day 3, 11:05 AM: Bug fixed! ✅
```

### Example 2: Add New Feature

```
Month 3: Want to add reflection rewards
Month 3: Deploy V2 with new features
Month 3: Propose upgrade
Month 3 + 2 days: Execute upgrade
Month 3 + 2 days: Enable new features ✅
```

### Example 3: Emergency Response

```
Critical bug found:
1. Immediately PAUSE contract
2. Deploy fixed version
3. Propose upgrade (48h wait)
4. Community informed
5. Execute upgrade after 48h
6. Unpause contract
7. Resume normal operations ✅
```

---

## 💰 COST ANALYSIS:

### Initial Deployment:
```
Implementation V1:      ~0.15 BNB
Proxy:                  ~0.08 BNB
Initialize:             ~0.05 BNB
TOTAL:                  ~0.28 BNB (~$170)
```

### Each Upgrade:
```
New Implementation:     ~0.15 BNB
Propose Upgrade:        ~0.01 BNB
Execute Upgrade:        ~0.02 BNB
Initialize V2:          ~0.02 BNB
TOTAL:                  ~0.20 BNB (~$120)
```

### Comparison with Non-Upgradeable:
```
Bug Found → Redeploy:
- New deployment:       ~0.20 BNB
- Migration contract:   ~0.05 BNB
- User migrations:      Variable (users pay)
- Exchange relisting:   $5,000+
- Time lost:            Weeks
- Reputation:           Damaged

VS Upgradeable:
- New implementation:   ~0.20 BNB
- Propose + Execute:    ~0.03 BNB
- User impact:          ZERO (automatic)
- Time:                 48 hours
- Reputation:           Professional handling

SAVINGS: $5,000+ and weeks of time!
```

---

## ⚠️ IMPORTANT WARNINGS:

### 1. Storage Layout

```solidity
// ❌ NEVER DO THIS in upgrade:
contract V2 {
    uint256 public newVariable;  // ❌ Added at beginning
    address public owner;        // ❌ Moved!
}

// ✅ ALWAYS DO THIS:
contract V2 {
    address public owner;        // ✅ Same position as V1
    uint256 public newVariable;  // ✅ Added at end
}
```

### 2. Constructor vs Initialize

```solidity
// ❌ DON'T use constructor:
constructor() {
    owner = msg.sender;  // Won't work with proxy!
}

// ✅ USE initialize:
function initialize() external {
    require(owner == address(0), "Already initialized");
    owner = msg.sender;  // ✅ Works!
}
```

### 3. Immutable Variables

```solidity
// ❌ Can't use immutable in upgradeable:
address public immutable owner;  // ❌ Won't upgrade

// ✅ Use regular state variable:
address public owner;  // ✅ Can upgrade
```

---

## 🎯 КОГАТО ДА ИЗПОЛЗВАШ UPGRADEABLE:

### ✅ Използвай ако:
- First time deploying big project
- Complex logic that might have bugs
- Want to add features later
- Building for long-term (years)
- Want professional upgrade path

### ❌ Не използвай ако:
- Simple token with no special logic
- Want maximum decentralization
- Can't secure admin key properly
- Don't want upgrade responsibility

---

## 📚 ЗАКЛЮЧЕНИЕ:

### Преимущества:
```
✅ Fix bugs without redeployment
✅ Add features over time
✅ Same address forever
✅ No user migration needed
✅ Professional appearance
✅ Community confidence
```

### Недостатъци:
```
❌ More complex code
❌ Higher gas costs
❌ Admin has power (centralization)
❌ Storage layout restrictions
❌ More testing needed
```

### Препоръка:
```
За AMS Token проект:
→ ИЗПОЛЗВАЙ Upgradeable! ✅

Защо:
- Complex donation logic
- Queue system
- PancakeSwap integration
- Burn mechanism
- Owner trading windows
→ High chance of bugs
→ Need upgrade capability
```

---

## 🚀 NEXT STEPS:

```
1. Review contracts (AMSProxy, AMSToken_V1, AMSToken_V2)
2. Test deployment script on testnet
3. Test upgrade process (V1 → V2)
4. Run for 1-2 weeks on testnet
5. Security audit (recommended)
6. Deploy to mainnet
7. Monitor closely
8. Be ready to upgrade if needed
```

**Remember: With great power comes great responsibility! 🦸‍♂️**

Имаш upgrade capability - използвай я мъдро! 🛡️
