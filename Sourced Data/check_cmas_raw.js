#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

// Check raw data structure
const file = path.join(__dirname, 'General CMAS Score Data/2024 CMAS ELA and Math District and School Summary Results.xlsx');

const workbook = XLSX.readFile(file);
const sheet = workbook.Sheets['CMAS ELA and Math'];

// Get raw data without headers
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('First 10 rows of 2024 CMAS file:');
rawData.slice(0, 10).forEach((row, index) => {
    console.log(`Row ${index}:`, row.slice(0, 8));
});

// Try with specific header row
console.log('\n\nTrying with header row 2:');
const dataWithHeader = XLSX.utils.sheet_to_json(sheet, { header: 2 });
console.log('Column names:', Object.keys(dataWithHeader[0]));

// Check for percentage values
const sample = dataWithHeader[5];
console.log('\nSample row:', sample);