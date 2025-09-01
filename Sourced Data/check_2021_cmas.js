#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

// Check the 2021 CMAS file specifically
const file2021 = path.join(__dirname, 'General CMAS Score Data', '2021 CMAS ELA and Math District and School Summary Achievement Results - Required Tests.xlsx');

console.log('Checking 2021 CMAS file...\n');

const workbook = XLSX.readFile(file2021);
console.log('Sheet names:', workbook.SheetNames);

// Check the actual data sheet (second sheet)
const sheet = workbook.Sheets['CMAS ELA and Math'];
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Show first 20 rows to understand structure
console.log('\nFirst 20 rows:');
for (let i = 0; i < Math.min(20, rawData.length); i++) {
    if (rawData[i].some(cell => cell)) { // Skip empty rows
        console.log(`Row ${i}:`, rawData[i].slice(0, 10));
    }
}

// Try to find data with standard parsing
const jsonData = XLSX.utils.sheet_to_json(sheet);
console.log('\nParsed data sample:');
console.log('Total rows:', jsonData.length);
if (jsonData.length > 0) {
    console.log('First row keys:', Object.keys(jsonData[0]));
    console.log('Sample row:', jsonData[0]);
}