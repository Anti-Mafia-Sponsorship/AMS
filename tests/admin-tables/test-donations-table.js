// ========================================
// ADMIN TABLE TEST: Donations Table
// ========================================

const fs = require('fs');
const path = require('path');

const TEST_CONFIG = {
    inputFile: '../data/input/donations-sample.json',
    outputFile: '../data/output/donations-table-results.json',
    
    testCases: [
        {
            name: 'Render All Donations',
            input: { filter: 'all' },
            expectedRows: 10,
            expectedColumns: ['ID', 'Name', 'Email', 'Wallet', 'BNB', 'AMS', 'Status', 'Date']
        },
        {
            name: 'Filter - Completed Only',
            input: { filter: { status: 'completed' } },
            expectedMinRows: 5,
            expectedMaxRows: 10
        },
        {
            name: 'Filter - Pending Only',
            input: { filter: { status: 'pending' } },
            expectedMinRows: 1,
            expectedMaxRows: 5
        },
        {
            name: 'Sort by Amount DESC',
            input: { sortBy: 'amount_bnb', order: 'DESC' },
            expectedRows: 10,
            expectedOrder: 'descending',
            orderField: 'amount_bnb'
        },
        {
            name: 'Sort by Date DESC (Recent First)',
            input: { sortBy: 'created_at', order: 'DESC' },
            expectedRows: 10,
            expectedOrder: 'descending',
            orderField: 'created_at'
        },
        {
            name: 'Filter by Date Range',
            input: { 
                filter: { 
                    created_at: { 
                        from: '2025-01-15T00:00:00Z', 
                        to: '2025-01-16T00:00:00Z' 
                    } 
                } 
            },
            expectedMinRows: 1,
            expectedMaxRows: 10
        },
        {
            name: 'Search by Email',
            input: { search: { field: 'donor_email', value: 'john@example.com' } },
            expectedRows: 1
        },
        {
            name: 'Search by Wallet Address',
            input: { search: { field: 'wallet_address', value: '0x742d35Cc' } },
            expectedMinRows: 1,
            expectedMaxRows: 1
        },
        {
            name: 'Filter Anonymous Donations',
            input: { filter: { donor_name: '...' } },
            expectedMinRows: 1,
            expectedMaxRows: 3
        },
        {
            name: 'Filter Large Donations (>= 1 BNB)',
            input: { filter: { amount_bnb: { gte: '1.0' } } },
            expectedMinRows: 1,
            expectedMaxRows: 10
        }
    ]
};

async function runTests() {
    console.log('=== DONATIONS TABLE TESTS ===\n');
    
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
        if (criteria.filter.donor_name) {
            result = result.filter(item => item.donor_name === criteria.filter.donor_name);
        }
        if (criteria.filter.created_at) {
            const from = new Date(criteria.filter.created_at.from);
            const to = new Date(criteria.filter.created_at.to);
            result = result.filter(item => {
                const date = new Date(item.created_at);
                return date >= from && date <= to;
            });
        }
        if (criteria.filter.amount_bnb) {
            if (criteria.filter.amount_bnb.gte) {
                const min = parseFloat(criteria.filter.amount_bnb.gte);
                result = result.filter(item => parseFloat(item.amount_bnb) >= min);
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
            if (field.includes('amount') || field === 'id') {
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
    let html = '<table class="donations-table">\n';
    html += '  <thead>\n';
    html += '    <tr>\n';
    html += '      <th>ID</th><th>Name</th><th>Email</th><th>Wallet</th>';
    html += '<th>BNB</th><th>AMS</th><th>Status</th><th>Date</th>\n';
    html += '    </tr>\n';
    html += '  </thead>\n';
    html += '  <tbody>\n';
    
    data.forEach(item => {
        html += '    <tr>\n';
        html += `      <td>${item.id}</td>\n`;
        html += `      <td>${item.donor_name || '...'}</td>\n`;
        html += `      <td>${item.donor_email || '-'}</td>\n`;
        html += `      <td>${item.wallet_address.substring(0, 8)}...</td>\n`;
        html += `      <td>${item.amount_bnb}</td>\n`;
        html += `      <td>${item.amount_ams}</td>\n`;
        html += `      <td class="status-${item.status}">${item.status}</td>\n`;
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
            if (orderField.includes('amount') || orderField === 'id') {
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
        console.log('✅ Donations table tests complete!');
    });
}

module.exports = { TEST_CONFIG, runTests };
