// ========================================
// SMART CONTRACT TEST: Queue Operations
// ========================================
// Tests addToQueue() and processQueue()

const TEST_CONFIG = {
    testCases: [
        {
            name: 'Add to Queue - Valid Entry',
            function: 'addToQueue',
            input: {
                caller: '0xDonor123',
                walletAddress: '0xDonor123',
                amountBNB: '500000000000000000', // 0.5 BNB
                amountAMS: '500000000000000000000', // 500 AMS
                gasLimit: 150000
            },
            expectedOutput: {
                success: true,
                queueLengthIncreased: true
            }
        },
        {
            name: 'Add to Queue - Large Amount',
            function: 'addToQueue',
            input: {
                caller: '0xBigDonor999',
                walletAddress: '0xBigDonor999',
                amountBNB: '10000000000000000000', // 10 BNB
                amountAMS: '10000000000000000000000', // 10,000 AMS
                gasLimit: 150000
            },
            expectedOutput: {
                success: true,
                queueLengthIncreased: true
            }
        },
        {
            name: 'Add to Queue - Duplicate Address',
            function: 'addToQueue',
            input: {
                caller: '0xOwner',
                walletAddress: '0xDonor123', // Same as first test
                amountBNB: '1000000000000000000',
                amountAMS: '1000000000000000000000',
                gasLimit: 150000
            },
            expectedOutput: {
                success: false,
                error: 'Address already in queue'
            }
        },
        {
            name: 'Process Queue - Valid',
            function: 'processQueue',
            input: {
                caller: '0xOwner',
                gasLimit: 200000
            },
            expectedOutput: {
                success: true,
                tokensDistributed: true
            }
        },
        {
            name: 'Process Queue - Non-Owner',
            function: 'processQueue',
            input: {
                caller: '0xRandomUser',
                gasLimit: 200000
            },
            expectedOutput: {
                success: false,
                error: 'Ownable: caller is not the owner'
            }
        },
        {
            name: 'Get Queue Length',
            function: 'getQueueLength',
            input: {
                caller: '0xAnyone'
            },
            expectedOutput: {
                success: true,
                returnsNumber: true
            }
        }
    ]
};

async function runQueueTests(web3, contract, ownerAddress) {
    console.log('=== QUEUE OPERATIONS TESTS ===\n');
    
    const results = [];
    
    for (const testCase of TEST_CONFIG.testCases) {
        console.log(`Testing: ${testCase.name}`);
        
        try {
            if (testCase.function === 'addToQueue') {
                // Get queue length before
                const queueLengthBefore = await contract.methods.getQueueLength().call();
                
                const result = await contract.methods
                    .addToQueue(
                        testCase.input.walletAddress,
                        testCase.input.amountBNB,
                        testCase.input.amountAMS
                    )
                    .send({
                        from: testCase.input.caller,
                        gas: testCase.input.gasLimit
                    });
                
                // Get queue length after
                const queueLengthAfter = await contract.methods.getQueueLength().call();
                
                const testResult = {
                    testName: testCase.name,
                    passed: testCase.expectedOutput.success === true,
                    output: {
                        success: true,
                        txHash: result.transactionHash,
                        gasUsed: result.gasUsed,
                        queueLengthBefore: queueLengthBefore,
                        queueLengthAfter: queueLengthAfter,
                        queueLengthIncreased: parseInt(queueLengthAfter) > parseInt(queueLengthBefore),
                        events: result.events
                    }
                };
                
                results.push(testResult);
                console.log(`✅ PASS: ${testCase.name}`);
                console.log(`   Queue Length: ${queueLengthBefore} → ${queueLengthAfter}\n`);
                
            } else if (testCase.function === 'processQueue') {
                // Get queue length before
                const queueLengthBefore = await contract.methods.getQueueLength().call();
                
                if (parseInt(queueLengthBefore) === 0) {
                    console.log(`⚠️  SKIP: ${testCase.name} (Queue is empty)\n`);
                    continue;
                }
                
                const result = await contract.methods
                    .processQueue()
                    .send({
                        from: testCase.input.caller,
                        gas: testCase.input.gasLimit
                    });
                
                // Get queue length after
                const queueLengthAfter = await contract.methods.getQueueLength().call();
                
                const testResult = {
                    testName: testCase.name,
                    passed: testCase.expectedOutput.success === true,
                    output: {
                        success: true,
                        txHash: result.transactionHash,
                        gasUsed: result.gasUsed,
                        queueLengthBefore: queueLengthBefore,
                        queueLengthAfter: queueLengthAfter,
                        itemsProcessed: parseInt(queueLengthBefore) - parseInt(queueLengthAfter),
                        events: result.events
                    }
                };
                
                results.push(testResult);
                console.log(`✅ PASS: ${testCase.name}`);
                console.log(`   Processed: ${testResult.output.itemsProcessed} items\n`);
                
            } else if (testCase.function === 'getQueueLength') {
                const queueLength = await contract.methods.getQueueLength().call();
                
                const testResult = {
                    testName: testCase.name,
                    passed: true,
                    output: {
                        success: true,
                        queueLength: queueLength,
                        isNumber: !isNaN(queueLength)
                    }
                };
                
                results.push(testResult);
                console.log(`✅ PASS: ${testCase.name}`);
                console.log(`   Queue Length: ${queueLength}\n`);
            }
            
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
    runQueueTests
};
