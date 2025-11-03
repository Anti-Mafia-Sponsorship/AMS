// ========================================
// SMART CONTRACT TEST: transfer()
// ========================================
// Tests the transfer function with various input scenarios

const TEST_CONFIG = {
    contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    testCases: [
        {
            name: 'Valid Transfer - Small Amount',
            input: {
                from: '0xOwnerAddress123',
                to: '0xRecipient456',
                amount: '100000000000000000', // 0.1 AMS (18 decimals)
                gasLimit: 100000
            },
            expectedOutput: {
                success: true,
                txHash: 'string',
                gasUsed: 'number',
                events: {
                    Transfer: {
                        from: '0xOwnerAddress123',
                        to: '0xRecipient456',
                        value: '100000000000000000'
                    }
                }
            }
        },
        {
            name: 'Valid Transfer - Large Amount',
            input: {
                from: '0xOwnerAddress123',
                to: '0xRecipient789',
                amount: '1000000000000000000000', // 1000 AMS
                gasLimit: 100000
            },
            expectedOutput: {
                success: true,
                txHash: 'string',
                gasUsed: 'number'
            }
        },
        {
            name: 'Invalid - Zero Amount',
            input: {
                from: '0xOwnerAddress123',
                to: '0xRecipient456',
                amount: '0',
                gasLimit: 100000
            },
            expectedOutput: {
                success: false,
                error: 'Transfer amount must be greater than zero'
            }
        },
        {
            name: 'Invalid - Insufficient Balance',
            input: {
                from: '0xPoorAddress999',
                to: '0xRecipient456',
                amount: '999999999999999999999999', // Way too much
                gasLimit: 100000
            },
            expectedOutput: {
                success: false,
                error: 'Insufficient balance'
            }
        },
        {
            name: 'Invalid - Zero Address',
            input: {
                from: '0xOwnerAddress123',
                to: '0x0000000000000000000000000000000000000000',
                amount: '100000000000000000',
                gasLimit: 100000
            },
            expectedOutput: {
                success: false,
                error: 'Cannot transfer to zero address'
            }
        }
    ]
};

// ========================================
// TEST EXECUTION
// ========================================

async function runTransferTests(web3, contract) {
    console.log('=== TRANSFER FUNCTION TESTS ===\n');
    
    const results = [];
    
    for (const testCase of TEST_CONFIG.testCases) {
        console.log(`Testing: ${testCase.name}`);
        
        try {
            const result = await contract.methods
                .transfer(testCase.input.to, testCase.input.amount)
                .send({
                    from: testCase.input.from,
                    gas: testCase.input.gasLimit
                });
            
            const testResult = {
                testName: testCase.name,
                passed: testCase.expectedOutput.success === true,
                output: {
                    success: true,
                    txHash: result.transactionHash,
                    gasUsed: result.gasUsed,
                    blockNumber: result.blockNumber,
                    events: result.events
                }
            };
            
            results.push(testResult);
            console.log(`✅ PASS: ${testCase.name}\n`);
            
        } catch (error) {
            const testResult = {
                testName: testCase.name,
                passed: testCase.expectedOutput.success === false,
                output: {
                    success: false,
                    error: error.message
                }
            };
            
            results.push(testResult);
            
            if (testCase.expectedOutput.success === false) {
                console.log(`✅ PASS: ${testCase.name} (Expected failure)\n`);
            } else {
                console.log(`❌ FAIL: ${testCase.name}`);
                console.log(`   Error: ${error.message}\n`);
            }
        }
    }
    
    return results;
}

// ========================================
// EXPORT TEST RESULTS
// ========================================

module.exports = {
    TEST_CONFIG,
    runTransferTests
};
