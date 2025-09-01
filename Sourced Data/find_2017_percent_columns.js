#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const file2017 = path.join(__dirname, 'General CMAS Score Data', '2017 CMAS ELA Math District & School Overall Results FINAL.xlsx');

const workbook = XLSX.readFile(file2017);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Find the header row
let headerRow = -1;
for (let i = 0; i < Math.min(10, data.length); i++) {
  if (data[i] && data[i][0] === 'Level') {
    headerRow = i;
    break;
  }
}

if (headerRow >= 0) {
  console.log('Headers found at row', headerRow);
  const headers = data[headerRow];
  console.log('\nAll headers:');
  headers.forEach((h, idx) => {
    if (h) console.log(`  Column ${idx}: ${h}`);
  });
  
  console.log('\nLooking past visible headers...');
  // Check data rows to see if there are percent values
  const districtRow = data.find(row => row[0] === 'DISTRICT');
  if (districtRow) {
    console.log('\nFirst district row values:');
    districtRow.forEach((val, idx) => {
      if (val && idx > 10) {
        console.log(`  Column ${idx}: ${val}`);
      }
    });
  }
}