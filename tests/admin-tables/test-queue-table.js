// ========================================
// ADMIN TABLE TEST: Queue Table
// ========================================

const fs = require('fs');
const path = require('path');

const TEST_CONFIG = {
    inputFile: '../data/input/queue-sample.json',
    outputFile: '../data/output/queue-table-results.json',
    
    testCases: [
        {
            name: 'Render All Queue Entries',
            input: { filter: 'all' },
            expectedRows: 10,
            expectedColumns: ['ID', 'Wallet', 'BNB', 'AMS', 'Position', 'Status', 'Added', 'Processed']
        },
        {
            name: 'Filter - Pending Only',
            input: { filter: { status: 'pending' } },
            expectedMinRows: 5,
            expectedMaxRows: 10
        },
        {
            name: 'Filter - Processed Only',
            input: { filter: { status: 'processed' } },
            expectedMinRows: 1,
            expectedMaxRows: 5
        },
        {
            name: 'Sort by Position ASC',
            input: { sortBy: 'position', order: 'ASC' },
            expectedRows: 10,
            expectedOrder: 'ascending',
            orderField: 'position'
        },
        {
            name: 'Sort by Amount DESC',
            input: { sortBy: 'amount_ams', order: 'DESC' },
            expectedRows: 10,
            expectedOrder: 'descending',
            orderField: 'amount_ams'
        },
        {
            name: 'Filter - Active Queue (position > 0)',
            input: { filter: { position: { gt: 0 } } },
            expectedMinRows: 5,
            expectedMaxRows: 10
        },
        {
            name: 'Search by Wallet Address',
            input: { search: { field: 'wallet_address', value: '0x1111' } },
            expectedRows: 1
        },
        {
            name: 'Filter by Date Range',
            input: { 
                filter: { 
                    added_at: { 
                        from: '2025-01-15T00:00:00Z', 
                        to: '2025-01-16T00:00:00Z' 
                    } 
                } 
            },
            expectedMinRows: 1,
            expectedMaxRows: 10
        },
        {
            name: 'Filter Large Donations (>= 1000 AMS)',
            input: { filter: { amount_ams: { gte: '1000.0' } } },
            expectedMinRows: 1,
            expectedMaxRows: 10
        },
        {
            name: 'Show Unprocessed (processed_at is null)',
            input: { filter: { processed_at: null } },
            expectedMinRows: 5,
            expectedMaxRows: 10
        }
    ]
};

async function runTests() {
    console.log('=== QUEUE TABLE TESTS ===\n');
    
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
        if (criteria.filter.status) {
            result = result.filter(item => item.status === criteria.filter.status);
        }
        if (criteria.filter.position) {
            if (criteria.filter.position.gt !== undefined) {
                result = result.filter(item => parseInt(item.position) > parseInt(criteria.filter.position.gt));
            }
        }
        if (criteria.filter.processed_at !== undefined) {
            if (criteria.filter.processed_at === null) {
                result = result.filter(item => item.processed_at === null);
            }
        }
        if (criteria.filter.added_at) {
            const from = new Date(criteria.filter.added_at.from);
            const to = new Date(criteria.filter.added_at.to);
            result = result.filter(item => {
                const date = new Date(item.added_at);
                return date >= from && date <= to;
            });
        }
        if (criteria.filter.amount_ams) {
            if (criteria.filter.amount_ams.gte) {
                const min = parseFloat(criteria.filter.amount_ams.gte);
                result = result.filter(item => parseFloat(item.amount_ams) >= min);
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
            if (field.includes('amount') || field === 'id' || field === 'position') {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
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
    let html = '<table class="queue-table">\n';
    html += '  <thead>\n';
    html += '    <tr>\n';
    html += '      <th>ID</th><th>Wallet</th><th>BNB</th><th>AMS</th>';
    html += '<th>Position</th><th>Status</th><th>Added</th><th>Processed</th>\n';
    html += '    </tr>\n';
    html += '  </thead>\n';
    html += '  <tbody>\n';
    
    data.forEach(item => {
        html += '    <tr>\n';
        html += `      <td>${item.id}</td>\n`;
        html += `      <td>${item.wallet_address.substring(0, 8)}...</td>\n`;
        html += `      <td>${item.amount_bnb}</td>\n`;
        html += `      <td>${item.amount_ams}</td>\n`;
        html += `      <td>${item.position}</td>\n`;
        html += `      <td class="status-${item.status}">${item.status}</td>\n`;
        html += `      <td>${new Date(item.added_at).toLocaleDateString()}</td>\n`;
        html += `      <td>${item.processed_at ? new Date(item.processed_at).toLocaleDateString() : '-'}</td>\n`;
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
            if (orderField.includes('amount') || orderField === 'id' || orderField === 'position') {
                current = parseFloat(current);
                next = parseFloat(next);
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
        console.log('✅ Queue table tests complete!');
    });
}

module.exports = { TEST_CONFIG, runTests };
