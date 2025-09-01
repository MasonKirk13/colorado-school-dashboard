#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const file2017 = path.join(__dirname, 'General CMAS Score Data', '2017 CMAS ELA Math District & School Overall Results FINAL.xlsx');

console.log('Debugging 2017 file...\n');

const workbook = XLSX.readFile(file2017);
console.log('Sheet names:', workbook.SheetNames);

// Check first sheet
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('\nFirst 20 rows of data:');
for (let i = 0; i < Math.min(20, data.length); i++) {
  const row = data[i];
  if (row && row.some(cell => cell)) {
    console.log(`Row ${i}:`, row.slice(0, 8).map(c => c || '[empty]'));
  }
}

// Look for headers
console.log('\nSearching for header rows...');
for (let i = 0; i < Math.min(50, data.length); i++) {
  const row = data[i];
  if (row && row.some(cell => cell && (
    cell.toString().includes('Level') || 
    cell.toString().includes('District') ||
    cell.toString().includes('Grade') ||
    cell.toString().includes('Percent')
  ))) {
    console.log(`\nRow ${i} contains headers:`);
    console.log(row.filter(c => c));
  }
}