#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const file2022 = path.join(__dirname, 'General CMAS Score Data', '2022 CMAS ELA and Math District and School Summary Achievement Results.xlsx');

console.log('Debugging 2022 file...\n');

const workbook = XLSX.readFile(file2022);
console.log('Sheet names:', workbook.SheetNames);

// Check first sheet
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('\nFirst 30 rows (showing first 15 columns):');
for (let i = 0; i < Math.min(30, data.length); i++) {
  const row = data[i];
  if (row && row.some(cell => cell)) {
    console.log(`Row ${i}:`, row.slice(0, 15).map(c => c || '[empty]'));
  }
}

// Look for year columns
console.log('\nSearching for year columns in headers...');
for (let i = 0; i < Math.min(50, data.length); i++) {
  const row = data[i];
  if (row) {
    const yearCols = [];
    row.forEach((cell, idx) => {
      if (cell && /^\d{4}$/.test(cell.toString())) {
        yearCols.push({ idx, year: cell });
      }
    });
    if (yearCols.length > 0) {
      console.log(`Row ${i} has year columns:`, yearCols);
    }
  }
}