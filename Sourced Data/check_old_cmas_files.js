#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Check structure of older CMAS files
const oldFiles = [
    '2016 ELA Math District and School Summary final.xlsx',
    '2017 CMAS ELA Math District & School Overall Results FINAL.xlsx',
    '2018 CMAS ELA and Math District and School Summary Achievement Results_FINAL.xlsx'
];

oldFiles.forEach(filename => {
    console.log(`\n=== Checking ${filename} ===`);
    const filepath = path.join(__dirname, 'General CMAS Score Data', filename);
    
    try {
        const workbook = XLSX.readFile(filepath);
        console.log('Sheet names:', workbook.SheetNames);
        
        // Check first sheet
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Find potential header rows
        console.log('\nSearching for headers...');
        for (let i = 0; i < Math.min(30, data.length); i++) {
            const row = data[i];
            if (row && row.some(cell => cell && (
                cell.toString().includes('Level') || 
                cell.toString().includes('District') ||
                cell.toString().includes('Grade')
            ))) {
                console.log(`Row ${i}: Found potential headers`);
                console.log('  First 10 columns:', row.slice(0, 10).map(c => c || '[empty]'));
                
                // Check for percent columns
                row.forEach((col, idx) => {
                    if (col && col.toString().toLowerCase().includes('percent')) {
                        console.log(`  Column ${idx}: ${col}`);
                    }
                });
            }
        }
        
        // Try different sheet if exists
        if (workbook.SheetNames.length > 1) {
            console.log('\nChecking other sheets...');
            workbook.SheetNames.slice(1).forEach(sheetName => {
                const sheet2 = workbook.Sheets[sheetName];
                const data2 = XLSX.utils.sheet_to_json(sheet2, { header: 1 });
                if (data2.length > 100) {
                    console.log(`  ${sheetName}: ${data2.length} rows`);
                }
            });
        }
        
    } catch (error) {
        console.error(`Error reading ${filename}:`, error.message);
    }
});