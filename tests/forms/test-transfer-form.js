// ========================================
// FORM TEST: Transfer Form
// ========================================

const fs = require('fs');
const path = require('path');

const TEST_CONFIG = {
    formId: 'transfer-form',
    outputFile: '../data/output/transfer-form-results.json',
    
    testCases: [
        {
            name: 'Valid Transfer',
            input: {
                fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                toAddress: '0x1234567890123456789012345678901234567890',
                amount: '100',
                userBalance: '500'
            },
            expectedOutput: { valid: true }
        },
        {
            name: 'Invalid - Invalid Recipient',
            input: {
                fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                toAddress: 'not-valid',
                amount: '100',
                userBalance: '500'
            },
            expectedOutput: { valid: false, errors: ['Invalid recipient address'] }
        },
        {
            name: 'Invalid - Insufficient Balance',
            input: {
                fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                toAddress: '0x1234567890123456789012345678901234567890',
                amount: '1000',
                userBalance: '500'
            },
            expectedOutput: { valid: false, errors: ['Insufficient balance'] }
        }
    ]
};

async function runTests() {
    console.log('=== TRANSFER FORM TESTS ===\n');
    const results = [];
    
    for (const testCase of TEST_CONFIG.testCases) {
        console.log(`Testing: ${testCase.name}`);
        
        try {
            const validation = validateTransferInput(testCase.input);
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

function validateTransferInput(input) {
    const errors = [];
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(input.toAddress)) {
        errors.push('Invalid recipient address');
    }
    
    const amount = parseFloat(input.amount);
    const balance = parseFloat(input.userBalance);
    
    if (amount <= 0) {
        errors.push('Amount must be greater than zero');
    }
    
    if (amount > balance) {
        errors.push('Insufficient balance');
    }
    
    return { valid: errors.length === 0, errors };
}

if (require.main === module) {
    runTests().then(() => console.log('✅ Transfer form tests complete!'));
}

module.exports = { TEST_CONFIG, runTests };
