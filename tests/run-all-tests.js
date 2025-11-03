// ========================================
// MASTER TEST RUNNER
// ========================================
// Runs all smart contract, admin table, and form tests

const fs = require('fs');
const path = require('path');

// Test results storage
const testResults = {
    smartContract: [],
    adminTables: [],
    forms: [],
    startTime: new Date().toISOString(),
    endTime: null,
    summary: {
        total: 0,
        passed: 0,
        failed: 0
    }
};

// ========================================
// SMART CONTRACT TESTS
// ========================================

async function runSmartContractTests() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   SMART CONTRACT TESTS                ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    // Load all test files
    const testFiles = [
        './smart-contract/test-transfer.js',
        './smart-contract/test-mint.js',
        './smart-contract/test-burn.js',
        './smart-contract/test-approve.js',
        './smart-contract/test-queue.js'
    ];
    
    console.log(`Found ${testFiles.length} smart contract test files\n`);
    
    for (const testFile of testFiles) {
        try {
            const test = require(testFile);
            console.log(`\nRunning: ${path.basename(testFile)}`);
            console.log('─'.repeat(50));
            
            // Mock web3 and contract for testing
            const results = await test.runTests();
            testResults.smartContract.push(...results);
            
        } catch (error) {
            console.error(`Error loading ${testFile}:`, error.message);
        }
    }
}

// ========================================
// ADMIN TABLE TESTS
// ========================================

async function runAdminTableTests() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   ADMIN TABLE TESTS                    ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    const testFiles = [
        './admin-tables/test-donations-table.js',
        './admin-tables/test-queue-table.js',
        './admin-tables/test-transactions-table.js'
    ];
    
    console.log(`Found ${testFiles.length} admin table test files\n`);
    
    for (const testFile of testFiles) {
        try {
            const test = require(testFile);
            console.log(`\nRunning: ${path.basename(testFile)}`);
            console.log('─'.repeat(50));
            
            const results = await test.runTests();
            testResults.adminTables.push(...results);
            
        } catch (error) {
            console.error(`Error loading ${testFile}:`, error.message);
        }
    }
}

// ========================================
// FORM TESTS
// ========================================

async function runFormTests() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   FORM TESTS                           ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    const testFiles = [
        './forms/test-donation-form.js',
        './forms/test-burn-form.js',
        './forms/test-transfer-form.js',
        './forms/test-mint-form.js'
    ];
    
    console.log(`Found ${testFiles.length} form test files\n`);
    
    for (const testFile of testFiles) {
        try {
            const test = require(testFile);
            console.log(`\nRunning: ${path.basename(testFile)}`);
            console.log('─'.repeat(50));
            
            const results = await test.runTests();
            testResults.forms.push(...results);
            
        } catch (error) {
            console.error(`Error loading ${testFile}:`, error.message);
        }
    }
}

// ========================================
// GENERATE SUMMARY
// ========================================

function generateSummary() {
    const allTests = [
        ...testResults.smartContract,
        ...testResults.adminTables,
        ...testResults.forms
    ];
    
    testResults.summary.total = allTests.length;
    testResults.summary.passed = allTests.filter(t => t.passed).length;
    testResults.summary.failed = allTests.length - testResults.summary.passed;
    testResults.endTime = new Date().toISOString();
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   TEST SUMMARY                         ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`✅ Passed: ${testResults.summary.passed}`);
    console.log(`❌ Failed: ${testResults.summary.failed}`);
    console.log(`Pass Rate: ${(testResults.summary.passed / testResults.summary.total * 100).toFixed(2)}%`);
    
    // Save results to file
    const outputPath = path.join(__dirname, 'data/output/test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Results saved to: ${outputPath}`);
}

// ========================================
// MAIN EXECUTION
// ========================================

async function runAllTests() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   AMS TOKEN TEST SUITE                 ║');
    console.log('║   Started: ' + new Date().toLocaleString().padEnd(24) + '║');
    console.log('╚════════════════════════════════════════╝');
    
    try {
        await runSmartContractTests();
        await runAdminTableTests();
        await runFormTests();
        generateSummary();
        
        console.log('\n✅ All tests completed!\n');
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests, testResults };
