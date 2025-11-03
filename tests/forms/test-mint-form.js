// ========================================
// FORM TEST: Mint Form
// ========================================

const fs = require('fs');
const path = require('path');

const TEST_CONFIG = {
    formId: 'mint-form',
    outputFile: '../data/output/mint-form-results.json',
    
    testCases: [
        {
            name: 'Valid Mint - Owner',
            input: {
                caller: '0xOwner123',
                toAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                amount: '1000',
                isOwner: true
            },
            expectedOutput: { valid: true }
        },
        {
            name: 'Invalid - Non-Owner',
            input: {
                caller: '0xRandomUser',
                toAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                amount: '1000',
                isOwner: false
            },
            expectedOutput: { valid: false, errors: ['Only owner can mint'] }
        },
        {
            name: 'Invalid - Mint to Zero Address',
            input: {
                caller: '0xOwner123',
                toAddress: '0x0000000000000000000000000000000000000000',
                amount: '1000',
                isOwner: true
            },
            expectedOutput: { valid: false, errors: ['Cannot mint to zero address'] }
        }
    ]
};

async function runTests() {
    console.log('=== MINT FORM TESTS ===\n');
    const results = [];
    
    for (const testCase of TEST_CONFIG.testCases) {
        console.log(`Testing: ${testCase.name}`);
        
        try {
            const validation = validateMintInput(testCase.input);
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

function validateMintInput(input) {
    const errors = [];
    
    if (!input.isOwner) {
        errors.push('Only owner can mint');
    }
    
    if (input.toAddress === '0x0000000000000000000000000000000000000000') {
        errors.push('Cannot mint to zero address');
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(input.toAddress)) {
        errors.push('Invalid recipient address');
    }
    
    const amount = parseFloat(input.amount);
    if (amount < 0) {
        errors.push('Amount cannot be negative');
    }
    
    return { valid: errors.length === 0, errors };
}

if (require.main === module) {
    runTests().then(() => console.log('✅ Mint form tests complete!'));
}

module.exports = { TEST_CONFIG, runTests };
