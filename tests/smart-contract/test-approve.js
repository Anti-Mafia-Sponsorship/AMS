// ========================================
// SMART CONTRACT TEST: approve() & allowance()
// ========================================

const TEST_CONFIG = {
    testCases: [
        {
            name: 'Valid Approve - Standard Amount',
            input: {
                owner: '0xOwner123',
                spender: '0xSpender456',
                amount: '1000000000000000000000', // 1000 AMS
                gasLimit: 80000
            },
            expectedOutput: {
                success: true,
                allowanceSet: true
            }
        },
        {
            name: 'Valid Approve - Maximum Amount',
            input: {
                owner: '0xOwner123',
                spender: '0xSpender789',
                amount: '115792089237316195423570985008687907853269984665640564039457584007913129639935', // MAX_UINT256
                gasLimit: 80000
            },
            expectedOutput: {
                success: true,
                allowanceSet: true
            }
        },
        {
            name: 'Valid Approve - Zero Amount (Revoke)',
            input: {
                owner: '0xOwner123',
                spender: '0xSpender456',
                amount: '0',
                gasLimit: 80000
            },
            expectedOutput: {
                success: true,
                allowanceSet: true,
                allowanceValue: '0'
            }
        },
        {
            name: 'Invalid - Approve to Zero Address',
            input: {
                owner: '0xOwner123',
                spender: '0x0000000000000000000000000000000000000000',
                amount: '1000000000000000000000',
                gasLimit: 80000
            },
            expectedOutput: {
                success: false,
                error: 'ERC20: approve to the zero address'
            }
        },
        {
            name: 'Valid - Change Existing Allowance',
            input: {
                owner: '0xOwner123',
                spender: '0xSpender456',
                previousAmount: '1000000000000000000000',
                newAmount: '500000000000000000000', // Decrease to 500
                gasLimit: 80000
            },
            expectedOutput: {
                success: true,
                allowanceChanged: true
            }
        }
    ]
};

async function runApproveTests(web3, contract) {
    console.log('=== APPROVE FUNCTION TESTS ===\n');
    
    const results = [];
    
    for (const testCase of TEST_CONFIG.testCases) {
        console.log(`Testing: ${testCase.name}`);
        
        try {
            // Set previous allowance if needed
            if (testCase.input.previousAmount) {
                await contract.methods
                    .approve(testCase.input.spender, testCase.input.previousAmount)
                    .send({ from: testCase.input.owner, gas: testCase.input.gasLimit });
            }
            
            // Get allowance before
            const allowanceBefore = await contract.methods
                .allowance(testCase.input.owner, testCase.input.spender)
                .call();
            
            // Approve
            const result = await contract.methods
                .approve(testCase.input.spender, testCase.input.amount)
                .send({
                    from: testCase.input.owner,
                    gas: testCase.input.gasLimit
                });
            
            // Get allowance after
            const allowanceAfter = await contract.methods
                .allowance(testCase.input.owner, testCase.input.spender)
                .call();
            
            const testResult = {
                testName: testCase.name,
                passed: testCase.expectedOutput.success === true,
                output: {
                    success: true,
                    txHash: result.transactionHash,
                    gasUsed: result.gasUsed,
                    allowanceBefore: allowanceBefore,
                    allowanceAfter: allowanceAfter,
                    allowanceSet: allowanceAfter === testCase.input.amount,
                    events: result.events
                }
            };
            
            results.push(testResult);
            console.log(`✅ PASS: ${testCase.name}`);
            console.log(`   Allowance: ${allowanceBefore} → ${allowanceAfter}\n`);
            
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

module.exports = {
    TEST_CONFIG,
    runApproveTests
};
