#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Checking ALL columns in 2016-2017 sheet...\n');

const worksheet = workbook.Sheets['2016-2017 Data'];

// Get all cells in row 1 (headers) and row 2 (first data)
console.log('Row 1 (Headers):');
for (let col = 0; col < 26; col++) {
  const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
  const cell = worksheet[cellAddr];
  if (cell) {
    console.log(`  Column ${String.fromCharCode(65 + col)} (${col}): "${cell.v}"`);
  }
}

console.log('\nRow 2 (First data row):');
for (let col = 0; col < 26; col++) {
  const cellAddr = XLSX.utils.encode_cell({ r: 1, c: col });
  const cell = worksheet[cellAddr];
  if (cell) {
    console.log(`  Column ${String.fromCharCode(65 + col)} (${col}): "${cell.v}" (type: ${cell.t})`);
  }
}

// Check what columns actually have data
console.log('\n\nChecking which columns have ANY data in rows 2-10:');
const columnsWithData = new Set();
for (let row = 1; row <= 10; row++) {
  for (let col = 0; col < 26; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
    if (worksheet[cellAddr]) {
      columnsWithData.add(col);
    }
  }
}

console.log('Columns with data:', Array.from(columnsWithData).sort((a, b) => a - b).map(c => `${c} (${String.fromCharCode(65 + c)})`).join(', '));

// Try a different approach - use sheet_to_json with header:1
console.log('\n\nUsing sheet_to_json with header:1:');
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
if (rawData.length >= 2) {
  console.log('Headers:', rawData[0]);
  console.log('\nFirst data row:');
  rawData[1].forEach((val, idx) => {
    if (val !== undefined && val !== null) {
      console.log(`  Col ${idx}: ${val}`);
    }
  });
}