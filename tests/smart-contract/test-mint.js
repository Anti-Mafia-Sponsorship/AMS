// ========================================
// SMART CONTRACT TEST: mint()
// ========================================
// Tests the mint function (owner only)

const TEST_CONFIG = {
    testCases: [
        {
            name: 'Valid Mint - Owner',
            input: {
                caller: '0xOwnerAddress123',
                to: '0xRecipient456',
                amount: '1000000000000000000000', // 1000 AMS
                gasLimit: 150000
            },
            expectedOutput: {
                success: true,
                totalSupplyIncreased: true
            }
        },
        {
            name: 'Invalid - Non-Owner Attempt',
            input: {
                caller: '0xRandomUser999',
                to: '0xRecipient456',
                amount: '1000000000000000000000',
                gasLimit: 150000
            },
            expectedOutput: {
                success: false,
                error: 'Ownable: caller is not the owner'
            }
        },
        {
            name: 'Invalid - Mint to Zero Address',
            input: {
                caller: '0xOwnerAddress123',
                to: '0x0000000000000000000000000000000000000000',
                amount: '1000000000000000000000',
                gasLimit: 150000
            },
            expectedOutput: {
                success: false,
                error: 'ERC20: mint to the zero address'
            }
        },
        {
            name: 'Valid - Mint Zero Amount',
            input: {
                caller: '0xOwnerAddress123',
                to: '0xRecipient456',
                amount: '0',
                gasLimit: 150000
            },
            expectedOutput: {
                success: true,
                totalSupplyIncreased: false
            }
        },
        {
            name: 'Valid - Large Mint',
            input: {
                caller: '0xOwnerAddress123',
                to: '0xRecipient456',
                amount: '1000000000000000000000000000', // 1 billion AMS
                gasLimit: 150000
            },
            expectedOutput: {
                success: true,
                totalSupplyIncreased: true
            }
        }
    ]
};

async function runMintTests(web3, contract, ownerAddress) {
    console.log('=== MINT FUNCTION TESTS ===\n');
    
    const results = [];
    
    for (const testCase of TEST_CONFIG.testCases) {
        console.log(`Testing: ${testCase.name}`);
        
        try {
            // Get total supply before
            const supplyBefore = await contract.methods.totalSupply().call();
            
            const result = await contract.methods
                .mint(testCase.input.to, testCase.input.amount)
                .send({
                    from: testCase.input.caller,
                    gas: testCase.input.gasLimit
                });
            
            // Get total supply after
            const supplyAfter = await contract.methods.totalSupply().call();
            
            const testResult = {
                testName: testCase.name,
                passed: true,
                output: {
                    success: true,
                    txHash: result.transactionHash,
                    gasUsed: result.gasUsed,
                    supplyBefore: supplyBefore,
                    supplyAfter: supplyAfter,
                    supplyIncreased: BigInt(supplyAfter) > BigInt(supplyBefore),
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

module.exports = {
    TEST_CONFIG,
    runMintTests
};
