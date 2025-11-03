// ========================================
// FORM TEST: Donation Form
// ========================================

const fs = require('fs');
const path = require('path');

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
                    amount_ams: 500.0,
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
                walletAddress: '0x1234567890123456789012345678901234567890',
                amountBNB: '1.0',
                message: null,
                agreeTerms: true
            },
            expectedOutput: {
                valid: true,
                dbRecord: {
                    donor_name: '...',
                    donor_email: null,
                    wallet_address: '0x1234567890123456789012345678901234567890',
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
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
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
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                amountBNB: '0.001',
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
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
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
    console.log('=== DONATION FORM TESTS ===\n');
    
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
                
                const passed = testCase.expectedOutput.valid === true && schemaValid;
                
                results.push({
                    testName: testCase.name,
                    passed: passed,
                    output: {
                        validation: validation,
                        dbRecord: dbRecord,
                        schemaValid: schemaValid
                    }
                });
                
                if (passed) {
                    console.log(`✅ PASS: ${testCase.name}`);
                    console.log(`   DB Record: ${JSON.stringify(dbRecord).substring(0, 80)}...\n`);
                } else {
                    console.log(`❌ FAIL: ${testCase.name}`);
                    console.log(`   Schema validation failed\n`);
                }
                
            } else {
                const passed = testCase.expectedOutput.valid === false &&
                               arraysEqual(validation.errors, testCase.expectedOutput.errors);
                
                results.push({
                    testName: testCase.name,
                    passed: passed,
                    output: {
                        validation: validation
                    }
                });
                
                if (passed) {
                    console.log(`✅ PASS: ${testCase.name} (Expected failure)`);
                    console.log(`   Errors: ${validation.errors.join(', ')}\n`);
                } else {
                    console.log(`❌ FAIL: ${testCase.name}`);
                    console.log(`   Expected: ${testCase.expectedOutput.errors.join(', ')}`);
                    console.log(`   Got: ${validation.errors.join(', ')}\n`);
                }
            }
            
        } catch (error) {
            results.push({
                testName: testCase.name,
                passed: false,
                error: error.message
            });
            console.log(`❌ FAIL: ${testCase.name}`);
            console.log(`   Error: ${error.message}\n`);
        }
    }
    
    // Save results
    const outputPath = path.join(__dirname, TEST_CONFIG.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to: ${outputPath}\n`);
    
    return results;
}

function validateFormInput(input) {
    const errors = [];
    
    // Email validation
    if (input.donorEmail && input.donorEmail !== '...' && input.donorEmail !== null) {
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
    
    // Check status
    if (!['pending', 'completed', 'failed'].includes(record.status)) return false;
    
    return true;
}

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
}

// Run if called directly
if (require.main === module) {
    runTests().then(() => {
        console.log('✅ Donation form tests complete!');
    });
}

module.exports = { TEST_CONFIG, runTests };
