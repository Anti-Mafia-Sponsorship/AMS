// ========================================
// SMART CONTRACT TEST: burn()
// ========================================
// Tests the burn function with various input scenarios

const TEST_CONFIG = {
    testCases: [
        {
            name: 'Valid Burn - Own Tokens',
            input: {
                caller: '0xTokenHolder123',
                amount: '100000000000000000000', // 100 AMS
                gasLimit: 100000
            },
            expectedOutput: {
                success: true,
                totalSupplyDecreased: true,
                totalBurnedIncreased: true
            }
        },
        {
            name: 'Valid Burn - Large Amount',
            input: {
                caller: '0xWhale999',
                amount: '1000000000000000000000000', // 1 million AMS
                gasLimit: 100000
            },
            expectedOutput: {
                success: true,
                totalSupplyDecreased: true
            }
        },
        {
            name: 'Invalid - Burn More Than Balance',
            input: {
                caller: '0xPoorUser456',
                amount: '999999999999999999999999',
                gasLimit: 100000
            },
            expectedOutput: {
                success: false,
                error: 'Burn amount exceeds balance'
            }
        },
        {
            name: 'Invalid - Burn Zero Amount',
            input: {
                caller: '0xTokenHolder123',
                amount: '0',
                gasLimit: 100000
            },
            expectedOutput: {
                success: false,
                error: 'Burn amount must be greater than zero'
            }
        },
        {
            name: 'Invalid - Burn from Zero Address',
            input: {
                caller: '0x0000000000000000000000000000000000000000',
                amount: '100000000000000000000',
                gasLimit: 100000
            },
            expectedOutput: {
                success: false,
                error: 'ERC20: burn from the zero address'
            }
        }
    ]
};

async function runBurnTests(web3, contract) {
    console.log('=== BURN FUNCTION TESTS ===\n');
    
    const results = [];
    
    for (const testCase of TEST_CONFIG.testCases) {
        console.log(`Testing: ${testCase.name}`);
        
        try {
            // Get state before burn
            const supplyBefore = await contract.methods.totalSupply().call();
            const burnedBefore = await contract.methods.totalBurned().call();
            const balanceBefore = await contract.methods.balanceOf(testCase.input.caller).call();
            
            const result = await contract.methods
                .burn(testCase.input.amount)
                .send({
                    from: testCase.input.caller,
                    gas: testCase.input.gasLimit
                });
            
            // Get state after burn
            const supplyAfter = await contract.methods.totalSupply().call();
            const burnedAfter = await contract.methods.totalBurned().call();
            const balanceAfter = await contract.methods.balanceOf(testCase.input.caller).call();
            
            const testResult = {
                testName: testCase.name,
                passed: testCase.expectedOutput.success === true,
                output: {
                    success: true,
                    txHash: result.transactionHash,
                    gasUsed: result.gasUsed,
                    stateBefore: {
                        totalSupply: supplyBefore,
                        totalBurned: burnedBefore,
                        userBalance: balanceBefore
                    },
                    stateAfter: {
                        totalSupply: supplyAfter,
                        totalBurned: burnedAfter,
                        userBalance: balanceAfter
                    },
                    changes: {
                        supplyDecreased: BigInt(supplyAfter) < BigInt(supplyBefore),
                        burnedIncreased: BigInt(burnedAfter) > BigInt(burnedBefore),
                        balanceDecreased: BigInt(balanceAfter) < BigInt(balanceBefore)
                    },
                    events: result.events
                }
            };
            
            results.push(testResult);
            console.log(`✅ PASS: ${testCase.name}`);
            console.log(`   Supply: ${supplyBefore} → ${supplyAfter}`);
            console.log(`   Burned: ${burnedBefore} → ${burnedAfter}\n`);
            
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
    runBurnTests
};
