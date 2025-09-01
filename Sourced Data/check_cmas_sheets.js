#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

// Check all CMAS files to understand their structure
const cmasDir = path.join(__dirname, 'General CMAS Score Data');
const files = [
    '2024 CMAS ELA and Math District and School Summary Results.xlsx',
    '2023 CMAS ELA and Math District and School Summary Achievement Results.xlsx',
    '2019 CMAS ELA MATH District and School Achievement Results.xlsx'
];

files.forEach(filename => {
    console.log(`\n=== ${filename} ===`);
    try {
        const workbook = XLSX.readFile(path.join(cmasDir, filename));
        console.log('Sheet names:', workbook.SheetNames);
        
        // Check first sheet with data
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet);
            if (data.length > 0) {
                console.log(`\n  Sheet "${sheetName}" columns:`, Object.keys(data[0]).slice(0, 10));
                // Also check a sample value
                const districtRow = data.find(row => row['Level'] === 'DISTRICT' && row['Grade'] === 'All Grades');
                if (districtRow) {
                    console.log('  Sample district row:', Object.entries(districtRow).slice(0, 5));
                }
                break;
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
});