#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Searching for actual FRL values in 2016-2017 sheet...\n');

const worksheet = workbook.Sheets['2016-2017 Data'];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

let foundNumericFree = 0;
let foundNumericReduced = 0;
let totalRows = 0;

// Check all rows for numeric FRL data
for (let i = 1; i < rawData.length; i++) {
  const row = rawData[i];
  totalRows++;
  
  // Check Free Lunch (column 8)
  if (typeof row[8] === 'number' && !isNaN(row[8])) {
    foundNumericFree++;
    if (foundNumericFree <= 5) {
      console.log(`Found numeric Free Lunch at row ${i}: ${row[1]} - ${row[3]}: ${row[8]}`);
    }
  }
  
  // Check Reduced Lunch (column 9)
  if (typeof row[9] === 'number' && !isNaN(row[9])) {
    foundNumericReduced++;
    if (foundNumericReduced <= 5) {
      console.log(`Found numeric Reduced Lunch at row ${i}: ${row[1]} - ${row[3]}: ${row[9]}`);
    }
  }
}

console.log(`\nSummary:`);
console.log(`Total data rows: ${totalRows}`);
console.log(`Rows with numeric Free Lunch data: ${foundNumericFree}`);
console.log(`Rows with numeric Reduced Lunch data: ${foundNumericReduced}`);

// Check if the issue is with how the data is being read
console.log('\n\nChecking cell values directly:');
const testCells = ['I2', 'I3', 'I4', 'I5', 'I10', 'I20', 'I50', 'I100'];
testCells.forEach(cell => {
  if (worksheet[cell]) {
    const cellData = worksheet[cell];
    console.log(`Cell ${cell}: value="${cellData.v}", type="${cellData.t}", formula="${cellData.f || 'none'}"`);
  }
});

// Try reading with different options
console.log('\n\nTrying raw parsing:');
const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: null });
const sampleRows = jsonData.slice(0, 5);
sampleRows.forEach((row, idx) => {
  if (row['Free Lunch'] !== null && row['Free Lunch'] !== undefined) {
    console.log(`Row ${idx}: Free Lunch = "${row['Free Lunch']}" (type: ${typeof row['Free Lunch']})`);
  }
});