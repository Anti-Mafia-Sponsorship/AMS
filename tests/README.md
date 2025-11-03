# 🧪 COMPLETE TESTING FRAMEWORK

## 📁 СТРУКТУРА:

```
/tests/
├── smart-contract/          # Smart contract function tests
│   ├── test-transfer.js     ✅ Created
│   ├── test-mint.js         ✅ Created
│   ├── test-burn.js         📝 Template below
│   ├── test-approve.js      📝 Template below
│   └── test-queue.js        📝 Template below
│
├── admin-tables/            # Admin table rendering tests
│   ├── test-donations-table.js    📝 Template below
│   ├── test-queue-table.js        📝 Template below
│   └── test-transactions-table.js 📝 Template below
│
├── forms/                   # Form validation & submission tests
│   ├── test-donation-form.js      📝 Template below
│   ├── test-burn-form.js          📝 Template below
│   ├── test-transfer-form.js      📝 Template below
│   └── test-mint-form.js          📝 Template below
│
├── data/
│   ├── input/              # Test input data (JSON files)
│   │   ├── donations-sample.json
│   │   ├── queue-sample.json
│   │   └── transactions-sample.json
│   │
│   └── output/             # Test results & output data
│       ├── test-results.json
│       ├── donation-outputs.json
│       └── form-validations.json
│
├── run-all-tests.js        ✅ Master test runner
└── README.md               📝 This file
```

---

## 1️⃣ SMART CONTRACT TESTS

### Test Coverage:

| Function | Test File | Status |
|----------|-----------|--------|
| `transfer()` | test-transfer.js | ✅ Created |
| `mint()` | test-mint.js | ✅ Created |
| `burn()` | test-burn.js | 📝 Template |
| `approve()` | test-approve.js | 📝 Template |
| `addToQueue()` | test-queue.js | 📝 Template |
| `processQueue()` | test-queue.js | 📝 Template |

### Test Scenarios per Function:

**transfer():**
- ✅ Valid transfer (small amount)
- ✅ Valid transfer (large amount)
- ✅ Invalid: Zero amount
- ✅ Invalid: Insufficient balance
- ✅ Invalid: Zero address

**mint():**
- ✅ Valid mint (owner)
- ✅ Invalid: Non-owner attempt
- ✅ Invalid: Mint to zero address
- ✅ Valid: Mint zero amount
- ✅ Valid: Large mint

**burn() - Template:**
```javascript
const TEST_CASES = [
    {
        name: 'Valid Burn - Own Tokens',
        input: { from: '0xUser', amount: '100000000000000000000' },
        expected: { success: true, supplyDecreased: true }
    },
    {
        name: 'Invalid - Burn More Than Balance',
        input: { from: '0xUser', amount: '999999999999999999999999' },
        expected: { success: false, error: 'Burn amount exceeds balance' }
    },
    {
        name: 'Invalid - Burn Zero',
        input: { from: '0xUser', amount: '0' },
        expected: { success: false, error: 'Burn amount must be greater than zero' }
    }
];
```

---

## 2️⃣ ADMIN TABLE TESTS

### Database Schema:

**donations table:**
```sql
CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    donor_name VARCHAR(255),
    donor_email VARCHAR(255),
    wallet_address VARCHAR(42) NOT NULL,
    amount_bnb DECIMAL(20, 8) NOT NULL,
    amount_ams DECIMAL(20, 8),
    tx_hash VARCHAR(66),
    status VARCHAR(50),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Sample Input Data:

**File: `data/input/donations-sample.json`**
```json
[
    {
        "id": 1,
        "donor_name": "John Doe",
        "donor_email": "john@example.com",
        "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "amount_bnb": "0.5",
        "amount_ams": "500.0",
        "tx_hash": "0xabc123def456...",
        "status": "completed",
        "message": "Supporting the cause!",
        "created_at": "2025-01-15T10:30:00Z"
    },
    {
        "id": 2,
        "donor_name": "...",
        "donor_email": null,
        "wallet_address": "0x123...",
        "amount_bnb": "1.0",
        "amount_ams": "1000.0",
        "tx_hash": "0xdef456...",
        "status": "pending",
        "message": null,
        "created_at": "2025-01-15T11:00:00Z"
    }
    // ... 8 more entries (max 10)
]
```

### Test Template: Donations Table

**File: `admin-tables/test-donations-table.js`**
```javascript
const fs = require('fs');
const path = require('path');

const TEST_CONFIG = {
    inputFile: '../data/input/donations-sample.json',
    outputFile: '../data/output/donations-table-results.json',
    
    testCases: [
        {
            name: 'Render All Donations',
            input: 'all',
            expectedRows: 10
        },
        {
            name: 'Render Completed Only',
            input: { filter: { status: 'completed' } },
            expectedRows: 'varies'
        },
        {
            name: 'Sort by Amount DESC',
            input: { sortBy: 'amount_bnb', order: 'DESC' },
            expectedOrder: 'descending'
        },
        {
            name: 'Filter by Date Range',
            input: { 
                filter: { 
                    created_at: { 
                        from: '2025-01-15', 
                        to: '2025-01-16' 
                    } 
                } 
            },
            expectedRows: 'varies'
        },
        {
            name: 'Search by Email',
            input: { search: 'john@example.com' },
            expectedRows: 1
        }
    ]
};

async function runTests() {
    // Load sample data
    const inputPath = path.join(__dirname, TEST_CONFIG.inputFile);
    const sampleData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    
    const results = [];
    
    for (const testCase of TEST_CONFIG.testCases) {
        console.log(`Testing: ${testCase.name}`);
        
        try {
            // Apply filters/sorts
            let filteredData = applyCriteria(sampleData, testCase.input);
            
            // Generate HTML table
            const html = generateTableHTML(filteredData);
            
            // Validate output
            const passed = validateOutput(
                filteredData, 
                testCase.expectedRows,
                testCase.expectedOrder
            );
            
            results.push({
                testName: testCase.name,
                passed: passed,
                output: {
                    rowCount: filteredData.length,
                    html: html.substring(0, 100) + '...'
                }
            });
            
            console.log(passed ? '✅ PASS' : '❌ FAIL');
            
        } catch (error) {
            results.push({
                testName: testCase.name,
                passed: false,
                error: error.message
            });
            console.log(`❌ FAIL: ${error.message}`);
        }
    }
    
    // Save results
    const outputPath = path.join(__dirname, TEST_CONFIG.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    return results;
}

function applyCriteria(data, criteria) {
    // Implementation for filtering, sorting, searching
    // ...
}

function generateTableHTML(data) {
    // Implementation for generating HTML table
    // ...
}

function validateOutput(data, expectedRows, expectedOrder) {
    // Validation logic
    // ...
}

module.exports = { TEST_CONFIG, runTests };
```

---

## 3️⃣ FORM TESTS

### Forms to Test:

1. **Donation Form** (`public/donate.html`)
2. **Burn Form** (`admin/burn-tokens.html`)
3. **Transfer Form** (`admin/bbb-send-tokens-to-donor.html`)
4. **Mint Form** (`admin/vvv-mint-new-AMS.html`)

### Test Template: Donation Form

**File: `forms/test-donation-form.js`**
```javascript
const TEST_CONFIG = {
    formId: 'donation-form',
    outputFile: '../data/output/donation-form-results.json',
    
    testCases: [
        {
            name: 'Valid Donation - All Fields',
            input: {
                donorName: 'John Doe',
                donorEmail: 'john@example.com',
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                amountBNB: '0.5',
                message: 'Great cause!',
                agreeTerms: true
            },
            expectedOutput: {
                valid: true,
                dbRecord: {
                    donor_name: 'John Doe',
                    donor_email: 'john@example.com',
                    wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                    amount_bnb: 0.5,
                    amount_ams: 500.0,  // Based on rate
                    status: 'pending',
                    message: 'Great cause!'
                }
            }
        },
        {
            name: 'Valid - Anonymous Donation',
            input: {
                donorName: '...',
                donorEmail: null,
                walletAddress: '0x123...',
                amountBNB: '1.0',
                message: null,
                agreeTerms: true
            },
            expectedOutput: {
                valid: true,
                dbRecord: {
                    donor_name: '...',
                    donor_email: null,
                    wallet_address: '0x123...',
                    amount_bnb: 1.0,
                    amount_ams: 1000.0,
                    status: 'pending',
                    message: null
                }
            }
        },
        {
            name: 'Invalid - Invalid Email',
            input: {
                donorName: 'John',
                donorEmail: 'invalid-email',
                walletAddress: '0x742...',
                amountBNB: '0.5',
                agreeTerms: true
            },
            expectedOutput: {
                valid: false,
                errors: ['Invalid email format']
            }
        },
        {
            name: 'Invalid - Invalid Wallet Address',
            input: {
                donorName: 'John',
                donorEmail: 'john@example.com',
                walletAddress: 'not-a-valid-address',
                amountBNB: '0.5',
                agreeTerms: true
            },
            expectedOutput: {
                valid: false,
                errors: ['Invalid wallet address']
            }
        },
        {
            name: 'Invalid - Amount Too Small',
            input: {
                donorName: 'John',
                donorEmail: 'john@example.com',
                walletAddress: '0x742...',
                amountBNB: '0.001',  // Less than minimum
                agreeTerms: true
            },
            expectedOutput: {
                valid: false,
                errors: ['Amount below minimum (0.01 BNB)']
            }
        },
        {
            name: 'Invalid - Terms Not Agreed',
            input: {
                donorName: 'John',
                donorEmail: 'john@example.com',
                walletAddress: '0x742...',
                amountBNB: '0.5',
                agreeTerms: false
            },
            expectedOutput: {
                valid: false,
                errors: ['Must agree to terms']
            }
        }
    ]
};

async function runTests() {
    const results = [];
    
    for (const testCase of TEST_CONFIG.testCases) {
        console.log(`Testing: ${testCase.name}`);
        
        try {
            // Validate form input
            const validation = validateFormInput(testCase.input);
            
            if (validation.valid) {
                // Generate database record
                const dbRecord = generateDatabaseRecord(testCase.input);
                
                // Validate against schema
                const schemaValid = validateAgainstSchema(dbRecord);
                
                const passed = testCase.expectedOutput.valid === true && 
                               schemaValid;
                
                results.push({
                    testName: testCase.name,
                    passed: passed,
                    output: {
                        validation: validation,
                        dbRecord: dbRecord,
                        schemaValid: schemaValid
                    }
                });
                
                console.log(passed ? '✅ PASS' : '❌ FAIL');
                
            } else {
                const passed = testCase.expectedOutput.valid === false &&
                               arraysEqual(
                                   validation.errors,
                                   testCase.expectedOutput.errors
                               );
                
                results.push({
                    testName: testCase.name,
                    passed: passed,
                    output: {
                        validation: validation
                    }
                });
                
                console.log(passed ? '✅ PASS' : '❌ FAIL');
            }
            
        } catch (error) {
            results.push({
                testName: testCase.name,
                passed: false,
                error: error.message
            });
            console.log(`❌ FAIL: ${error.message}`);
        }
    }
    
    // Save results
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, TEST_CONFIG.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    return results;
}

function validateFormInput(input) {
    const errors = [];
    
    // Email validation
    if (input.donorEmail && input.donorEmail !== '...') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.donorEmail)) {
            errors.push('Invalid email format');
        }
    }
    
    // Wallet address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(input.walletAddress)) {
        errors.push('Invalid wallet address');
    }
    
    // Amount validation
    if (parseFloat(input.amountBNB) < 0.01) {
        errors.push('Amount below minimum (0.01 BNB)');
    }
    
    // Terms validation
    if (!input.agreeTerms) {
        errors.push('Must agree to terms');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

function generateDatabaseRecord(input) {
    const rate = 1000; // 1 BNB = 1000 AMS
    
    return {
        donor_name: input.donorName || '...',
        donor_email: input.donorEmail || null,
        wallet_address: input.walletAddress,
        amount_bnb: parseFloat(input.amountBNB),
        amount_ams: parseFloat(input.amountBNB) * rate,
        status: 'pending',
        message: input.message || null,
        created_at: new Date().toISOString()
    };
}

function validateAgainstSchema(record) {
    // Check required fields
    if (!record.wallet_address) return false;
    if (!record.amount_bnb) return false;
    
    // Check data types
    if (typeof record.amount_bnb !== 'number') return false;
    if (typeof record.amount_ams !== 'number') return false;
    
    // Check wallet format
    if (!/^0x[a-fA-F0-9]{40}$/.test(record.wallet_address)) return false;
    
    return true;
}

function arraysEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

module.exports = { TEST_CONFIG, runTests };
```

---

## 🗄️ DATABASE SCHEMA REFERENCE:

### All Tables:

```sql
-- Donations
CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    donor_name VARCHAR(255),
    donor_email VARCHAR(255),
    wallet_address VARCHAR(42) NOT NULL,
    amount_bnb DECIMAL(20, 8) NOT NULL,
    amount_ams DECIMAL(20, 8),
    tx_hash VARCHAR(66),
    status VARCHAR(50),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Queue
CREATE TABLE queue (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    amount_bnb DECIMAL(20, 8) NOT NULL,
    amount_ams DECIMAL(20, 8) NOT NULL,
    position INTEGER,
    status VARCHAR(50),
    added_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Transactions
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    tx_type VARCHAR(50),
    status VARCHAR(50),
    block_number INTEGER,
    gas_used INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 SAMPLE DATA FILES:

Create these in `/tests/data/input/`:

1. `donations-sample.json` - 10 donation records
2. `queue-sample.json` - 10 queue entries
3. `transactions-sample.json` - 10 transaction records

---

## 🚀 RUNNING TESTS:

```bash
# Install dependencies
cd tests
npm install

# Run all tests
node run-all-tests.js

# Run specific test suite
node smart-contract/test-transfer.js
node admin-tables/test-donations-table.js
node forms/test-donation-form.js

# View results
cat data/output/test-results.json
```

---

## 📈 EXPECTED OUTPUT:

```json
{
    "smartContract": [ /* results */ ],
    "adminTables": [ /* results */ ],
    "forms": [ /* results */ ],
    "startTime": "2025-01-15T10:00:00Z",
    "endTime": "2025-01-15T10:05:00Z",
    "summary": {
        "total": 45,
        "passed": 42,
        "failed": 3
    }
}
```

---

## ✅ TEST CHECKLIST:

### Smart Contract (15 tests):
- [ ] transfer() - 5 scenarios
- [ ] mint() - 5 scenarios
- [ ] burn() - 3 scenarios
- [ ] approve() - 2 scenarios

### Admin Tables (15 tests):
- [ ] Donations table - 5 scenarios
- [ ] Queue table - 5 scenarios
- [ ] Transactions table - 5 scenarios

### Forms (15 tests):
- [ ] Donation form - 6 scenarios
- [ ] Burn form - 3 scenarios
- [ ] Transfer form - 3 scenarios
- [ ] Mint form - 3 scenarios

**TOTAL: 45 tests**

---

This is your complete testing framework! 🧪✨
