#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Checking 2016-2017 raw data...\n');

const worksheet = workbook.Sheets['2016-2017 Data'];

// Get raw data to see actual values
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('First 5 data rows (showing enrollment and lunch columns):');
for (let i = 1; i <= 5 && i < rawData.length; i++) {
  const row = rawData[i];
  console.log(`\nRow ${i}:`);
  console.log(`  Organization: ${row[1]}`);
  console.log(`  School: ${row[3]}`);
  console.log(`  PK-12 Total (col 7): ${row[7]}`);
  console.log(`  Free Lunch (col 8): "${row[8]}"`);
  console.log(`  Reduced Lunch (col 9): "${row[9]}"`);
  console.log(`  Paid Lunch (col 10): "${row[10]}"`);
}

// Check a specific district
console.log('\n\nChecking Denver County 1 rows:');
let denverRowCount = 0;
for (let i = 1; i < rawData.length && denverRowCount < 5; i++) {
  const row = rawData[i];
  if (row[1] && row[1].toString().includes('DENVER')) {
    console.log(`\nRow ${i}:`);
    console.log(`  Organization: ${row[1]}`);
    console.log(`  School: ${row[3]}`);
    console.log(`  PK-12 Total: ${row[7]}`);
    console.log(`  Free Lunch: "${row[8]}"`);
    console.log(`  Reduced Lunch: "${row[9]}"`);
    console.log(`  Paid Lunch: "${row[10]}"`);
    denverRowCount++;
  }
}

// Check if any row has FRL data
console.log('\n\nChecking if ANY row has FRL data...');
let hasAnyFRL = false;
for (let i = 1; i < Math.min(100, rawData.length); i++) {
  const row = rawData[i];
  if (row[8] || row[9]) {
    console.log(`Found FRL data at row ${i}: Free="${row[8]}", Reduced="${row[9]}"`);
    hasAnyFRL = true;
    break;
  }
}

if (!hasAnyFRL) {
  console.log('No FRL data found in first 100 rows - columns appear to be empty!');
}