// ========================================
// ADMIN TABLE TEST: Transactions Table
// ========================================

const fs = require('fs');
const path = require('path');

const TEST_CONFIG = {
    inputFile: '../data/input/transactions-sample.json',
    outputFile: '../data/output/transactions-table-results.json',
    
    testCases: [
        {
            name: 'Render All Transactions',
            input: { filter: 'all' },
            expectedRows: 10,
            expectedColumns: ['ID', 'TX Hash', 'From', 'To', 'Amount', 'Type', 'Status', 'Block', 'Gas', 'Date']
        },
        {
            name: 'Filter - Transfers Only',
            input: { filter: { tx_type: 'transfer' } },
            expectedMinRows: 3,
            expectedMaxRows: 6
        },
        {
            name: 'Filter - Mints Only',
            input: { filter: { tx_type: 'mint' } },
            expectedMinRows: 2,
            expectedMaxRows: 4
        },
        {
            name: 'Filter - Burns Only',
            input: { filter: { tx_type: 'burn' } },
            expectedMinRows: 1,
            expectedMaxRows: 3
        },
        {
            name: 'Filter - Confirmed Only',
            input: { filter: { status: 'confirmed' } },
            expectedMinRows: 7,
            expectedMaxRows: 10
        },
        {
            name: 'Filter - Pending Only',
            input: { filter: { status: 'pending' } },
            expectedMinRows: 1,
            expectedMaxRows: 2
        },
        {
            name: 'Sort by Amount DESC',
            input: { sortBy: 'amount', order: 'DESC' },
            expectedRows: 10,
            expectedOrder: 'descending',
            orderField: 'amount'
        },
        {
            name: 'Sort by Date DESC (Recent First)',
            input: { sortBy: 'created_at', order: 'DESC' },
            expectedRows: 10,
            expectedOrder: 'descending',
            orderField: 'created_at'
        },
        {
            name: 'Search by TX Hash',
            input: { search: { field: 'tx_hash', value: '0xabc123' } },
            expectedRows: 1
        },
        {
            name: 'Filter Large Transactions (>= 1000 AMS)',
            input: { filter: { amount: { gte: '1000.0' } } },
            expectedMinRows: 4,
            expectedMaxRows: 10
        }
    ]
};

async function runTests() {
    console.log('=== TRANSACTIONS TABLE TESTS ===\n');
    
    // Load sample data
    const inputPath = path.join(__dirname, TEST_CONFIG.inputFile);
    let sampleData;
    
    try {
        sampleData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    } catch (error) {
        console.error(`❌ Failed to load sample data: ${error.message}`);
        return [];
    }
    
    const results = [];
    
    for (const testCase of TEST_CONFIG.testCases) {
        console.log(`Testing: ${testCase.name}`);
        
        try {
            // Apply filters/sorts/search
            let filteredData = applyCriteria(sampleData, testCase.input);
            
            // Generate HTML table
            const html = generateTableHTML(filteredData);
            
            // Validate output
            const validation = validateOutput(
                filteredData, 
                testCase.expectedRows,
                testCase.expectedMinRows,
                testCase.expectedMaxRows,
                testCase.expectedOrder,
                testCase.orderField
            );
            
            const testResult = {
                testName: testCase.name,
                passed: validation.passed,
                output: {
                    rowCount: filteredData.length,
                    data: filteredData,
                    htmlPreview: html.substring(0, 200) + '...',
                    validation: validation
                }
            };
            
            results.push(testResult);
            
            if (validation.passed) {
                console.log(`✅ PASS: ${testCase.name}`);
                console.log(`   Rows: ${filteredData.length}\n`);
            } else {
                console.log(`❌ FAIL: ${testCase.name}`);
                console.log(`   Reason: ${validation.reason}\n`);
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

function applyCriteria(data, criteria) {
    let result = [...data];
    
    // Apply filter
    if (criteria.filter && criteria.filter !== 'all') {
        if (criteria.filter.tx_type) {
            result = result.filter(item => item.tx_type === criteria.filter.tx_type);
        }
        if (criteria.filter.status) {
            result = result.filter(item => item.status === criteria.filter.status);
        }
        if (criteria.filter.amount) {
            if (criteria.filter.amount.gte) {
                const min = parseFloat(criteria.filter.amount.gte);
                result = result.filter(item => parseFloat(item.amount) >= min);
            }
        }
    }
    
    // Apply search
    if (criteria.search) {
        const field = criteria.search.field;
        const value = criteria.search.value.toLowerCase();
        result = result.filter(item => 
            item[field] && item[field].toLowerCase().includes(value)
        );
    }
    
    // Apply sort
    if (criteria.sortBy) {
        const field = criteria.sortBy;
        const order = criteria.order || 'ASC';
        
        result.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            // Convert to numbers if numeric field
            if (field.includes('amount') || field === 'id' || field === 'block_number' || field === 'gas_used') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            }
            
            // Convert to dates if date field
            if (field.includes('_at')) {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }
            
            if (order === 'DESC') {
                return bVal > aVal ? 1 : -1;
            } else {
                return aVal > bVal ? 1 : -1;
            }
        });
    }
    
    return result;
}

function generateTableHTML(data) {
    let html = '<table class="transactions-table">\n';
    html += '  <thead>\n';
    html += '    <tr>\n';
    html += '      <th>ID</th><th>TX Hash</th><th>From</th><th>To</th>';
    html += '<th>Amount</th><th>Type</th><th>Status</th><th>Block</th><th>Gas</th><th>Date</th>\n';
    html += '    </tr>\n';
    html += '  </thead>\n';
    html += '  <tbody>\n';
    
    data.forEach(item => {
        html += '    <tr>\n';
        html += `      <td>${item.id}</td>\n`;
        html += `      <td title="${item.tx_hash}">${item.tx_hash.substring(0, 10)}...</td>\n`;
        html += `      <td>${item.from_address.substring(0, 8)}...</td>\n`;
        html += `      <td>${item.to_address.substring(0, 8)}...</td>\n`;
        html += `      <td>${item.amount}</td>\n`;
        html += `      <td class="type-${item.tx_type}">${item.tx_type}</td>\n`;
        html += `      <td class="status-${item.status}">${item.status}</td>\n`;
        html += `      <td>${item.block_number || '-'}</td>\n`;
        html += `      <td>${item.gas_used || '-'}</td>\n`;
        html += `      <td>${new Date(item.created_at).toLocaleDateString()}</td>\n`;
        html += '    </tr>\n';
    });
    
    html += '  </tbody>\n';
    html += '</table>';
    
    return html;
}

function validateOutput(data, expectedRows, expectedMinRows, expectedMaxRows, expectedOrder, orderField) {
    const validation = {
        passed: true,
        reason: ''
    };
    
    // Check exact row count
    if (expectedRows !== undefined && data.length !== expectedRows) {
        validation.passed = false;
        validation.reason = `Expected ${expectedRows} rows, got ${data.length}`;
        return validation;
    }
    
    // Check row range
    if (expectedMinRows !== undefined && data.length < expectedMinRows) {
        validation.passed = false;
        validation.reason = `Expected at least ${expectedMinRows} rows, got ${data.length}`;
        return validation;
    }
    if (expectedMaxRows !== undefined && data.length > expectedMaxRows) {
        validation.passed = false;
        validation.reason = `Expected at most ${expectedMaxRows} rows, got ${data.length}`;
        return validation;
    }
    
    // Check sort order
    if (expectedOrder && orderField && data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
            let current = data[i][orderField];
            let next = data[i + 1][orderField];
            
            // Convert to comparable values
            if (orderField.includes('amount') || orderField === 'id' || orderField === 'block_number' || orderField === 'gas_used') {
                current = parseFloat(current) || 0;
                next = parseFloat(next) || 0;
            } else if (orderField.includes('_at')) {
                current = new Date(current);
                next = new Date(next);
            }
            
            if (expectedOrder === 'descending' && current < next) {
                validation.passed = false;
                validation.reason = `Sort order broken at index ${i}`;
                return validation;
            }
            if (expectedOrder === 'ascending' && current > next) {
                validation.passed = false;
                validation.reason = `Sort order broken at index ${i}`;
                return validation;
            }
        }
    }
    
    return validation;
}

// Run if called directly
if (require.main === module) {
    runTests().then(() => {
        console.log('✅ Transactions table tests complete!');
    });
}

module.exports = { TEST_CONFIG, runTests };
