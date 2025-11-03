// ========================================
// FORM TEST: Burn Form
// ========================================

const fs = require('fs');
const path = require('path');

const TEST_CONFIG = {
    formId: 'burn-form',
    outputFile: '../data/output/burn-form-results.json',
    
    testCases: [
        {
            name: 'Valid Burn',
            input: {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                amount: '100',
                userBalance: '500'
            },
            expectedOutput: { valid: true }
        },
        {
            name: 'Invalid - Amount Exceeds Balance',
            input: {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                amount: '1000',
                userBalance: '500'
            },
            expectedOutput: { valid: false, errors: ['Amount exceeds balance'] }
        },
        {
            name: 'Invalid - Zero Amount',
            input: {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                amount: '0',
                userBalance: '500'
            },
            expectedOutput: { valid: false, errors: ['Amount must be greater than zero'] }
        }
    ]
};

async function runTests() {
    console.log('=== BURN FORM TESTS ===\n');
    const results = [];
    
    for (const testCase of TEST_CONFIG.testCases) {
        console.log(`Testing: ${testCase.name}`);
        
        try {
            const validation = validateBurnInput(testCase.input);
            const passed = validation.valid === testCase.expectedOutput.valid;
            
            results.push({
                testName: testCase.name,
                passed: passed,
                output: { validation }
            });
            
            console.log(passed ? `✅ PASS\n` : `❌ FAIL\n`);
            
        } catch (error) {
            results.push({
                testName: testCase.name,
                passed: false,
                error: error.message
            });
            console.log(`❌ FAIL: ${error.message}\n`);
        }
    }
    
    const outputPath = path.join(__dirname, TEST_CONFIG.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to: ${outputPath}\n`);
    
    return results;
}

function validateBurnInput(input) {
    const errors = [];
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(input.walletAddress)) {
        errors.push('Invalid wallet address');
    }
    
    const amount = parseFloat(input.amount);
    const balance = parseFloat(input.userBalance);
    
    if (amount <= 0) {
        errors.push('Amount must be greater than zero');
    }
    
    if (amount > balance) {
        errors.push('Amount exceeds balance');
    }
    
    return { valid: errors.length === 0, errors };
}

if (require.main === module) {
    runTests().then(() => console.log('✅ Burn form tests complete!'));
}

module.exports = { TEST_CONFIG, runTests };
