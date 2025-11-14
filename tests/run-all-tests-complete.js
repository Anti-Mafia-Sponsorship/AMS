// ========================================
// MASTER TEST RUNNER - COMPLETE
// ========================================

const fs = require('fs');
const path = require('path');

async function runAllTests() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║         AMS TOKEN - COMPLETE TEST SUITE              ║');
    console.log('║         Started:', new Date().toLocaleString().padEnd(35), '║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    
    const results = {
        smartContract: { tests: [], passed: 0, failed: 0 },
        upgradeableContract: { tests: [], passed: 0, failed: 0 },
        proxyTests: { tests: [], passed: 0, failed: 0 },
        adminTables: { tests: [], passed: 0, failed: 0 },
        forms: { tests: [], passed: 0, failed: 0 },
        startTime: new Date().toISOString(),
        endTime: null
    };
    
    // 1. SMART CONTRACT TESTS (Original)
    await runTestSuite(
        'SMART CONTRACT TESTS (Original)',
        [
            './smart-contract/test-transfer.js',
            './smart-contract/test-mint.js',
            './smart-contract/test-burn.js',
            './smart-contract/test-approve.js',
            './smart-contract/test-queue.js'
        ],
        results.smartContract
    );
    
    // 2. UPGRADEABLE CONTRACT TESTS (New)
    await runTestSuite(
        'UPGRADEABLE CONTRACT TESTS',
        [
            './upgradeable-contract/test-transfer.js',
            './upgradeable-contract/test-proxy.js',
            './upgradeable-contract/test-upgrade-flow.js'
        ],
        results.upgradeableContract
    );
    
    // 3. ADMIN TABLE TESTS
    await runTestSuite(
        'ADMIN TABLE TESTS',
        [
            './admin-tables/test-donations-table.js',
            './admin-tables/test-queue-table.js',
            './admin-tables/test-transactions-table.js'
        ],
        results.adminTables
    );
    
    // 4. FORM TESTS
    await runTestSuite(
        'FORM TESTS',
        [
            './forms/test-donation-form.js',
            './forms/test-burn-form.js',
            './forms/test-transfer-form.js',
            './forms/test-mint-form.js'
        ],
        results.forms
    );
    
    // Calculate totals
    results.endTime = new Date().toISOString();
    const totalPassed = Object.values(results)
        .filter(v => typeof v === 'object' && v.passed !== undefined)
        .reduce((sum, category) => sum + category.passed, 0);
    
    const totalFailed = Object.values(results)
        .filter(v => typeof v === 'object' && v.failed !== undefined)
        .reduce((sum, category) => sum + category.failed, 0);
    
    const totalTests = totalPassed + totalFailed;
    
    // Print Summary
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║                   TEST SUMMARY                       ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    
    console.log('📊 Results by Category:\n');
    
    printCategorySummary('Smart Contract (Original)', results.smartContract);
    printCategorySummary('Upgradeable Contract', results.upgradeableContract);
    printCategorySummary('Admin Tables', results.adminTables);
    printCategorySummary('Forms', results.forms);
    
    console.log('\n' + '═'.repeat(60));
    console.log(`Total Tests:     ${totalTests}`);
    console.log(`✅ Passed:        ${totalPassed} (${((totalPassed/totalTests)*100).toFixed(1)}%)`);
    console.log(`❌ Failed:        ${totalFailed} (${((totalFailed/totalTests)*100).toFixed(1)}%)`);
    console.log('═'.repeat(60) + '\n');
    
    // Save results
    const outputPath = path.join(__dirname, 'data/output/test-results-complete.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify({
        ...results,
        summary: {
            total: totalTests,
            passed: totalPassed,
            failed: totalFailed,
            passRate: ((totalPassed/totalTests)*100).toFixed(2) + '%'
        }
    }, null, 2));
    
    console.log(`📄 Complete results saved to: ${outputPath}\n`);
    
    if (totalFailed === 0) {
        console.log('🎉 ALL TESTS PASSED! 🎉\n');
    } else {
        console.log(`⚠️  ${totalFailed} test(s) failed. Review results above.\n`);
    }
    
    return results;
}

async function runTestSuite(suiteName, testFiles, resultsCategory) {
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log(`║   ${suiteName.padEnd(50)} ║`);
    console.log('╚══════════════════════════════════════════════════════╝\n');
    
    console.log(`Found ${testFiles.length} test file(s)\n`);
    
    for (const testFile of testFiles) {
        const testPath = path.join(__dirname, testFile);
        
        if (!fs.existsSync(testPath)) {
            console.log(`⚠️  Skipping ${path.basename(testFile)} - File not found\n`);
            continue;
        }
        
        try {
            console.log(`Running: ${path.basename(testFile)}`);
            console.log('─'.repeat(60));
            
            const testModule = require(testPath);
            const testResults = await testModule.runTests();
            
            // Count passed/failed
            const passed = testResults.filter(r => r.passed).length;
            const failed = testResults.filter(r => r.passed === false).length;
            
            resultsCategory.tests.push({
                file: path.basename(testFile),
                passed: passed,
                failed: failed,
                results: testResults
            });
            
            resultsCategory.passed += passed;
            resultsCategory.failed += failed;
            
            console.log(`Result: ${passed}/${passed + failed} passed\n`);
            
        } catch (error) {
            console.log(`❌ Error running ${path.basename(testFile)}: ${error.message}\n`);
            resultsCategory.failed += 1;
        }
    }
    
    console.log(`✅ ${suiteName}: ${resultsCategory.passed} passed, ${resultsCategory.failed} failed\n`);
}

function printCategorySummary(name, category) {
    const total = category.passed + category.failed;
    const passRate = total > 0 ? ((category.passed/total)*100).toFixed(1) : '0.0';
    
    console.log(`  ${name}:`);
    console.log(`    Total: ${total} | ✅ ${category.passed} | ❌ ${category.failed} | Pass Rate: ${passRate}%`);
}

// Run tests
if (require.main === module) {
    runAllTests()
        .then(() => {
            console.log('✅ Test run complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Test run failed:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests };
