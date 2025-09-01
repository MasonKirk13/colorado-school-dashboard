const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('Inspecting CMAS file structure...\n');

// Check 2019 CMAS file
const cmasFile = path.join(__dirname, 'General CMAS Score Data/2019 CMAS ELA MATH District and School Achievement Results.xlsx');
const workbook = XLSX.readFile(cmasFile);

console.log('Sheet names in 2019 CMAS file:');
workbook.SheetNames.forEach((name, idx) => {
  console.log(`  ${idx}: "${name}"`);
});

// Check each sheet
workbook.SheetNames.forEach((sheetName, idx) => {
  console.log(`\n\nSheet ${idx}: "${sheetName}"`);
  const worksheet = workbook.Sheets[sheetName];
  
  // Get range
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  console.log(`Range: ${worksheet['!ref']} (${range.e.r + 1} rows, ${range.e.c + 1} columns)`);
  
  // Check first few cells to understand structure
  console.log('\nFirst few cells:');
  for (let r = 0; r <= Math.min(10, range.e.r); r++) {
    let rowInfo = `Row ${r}: `;
    for (let c = 0; c <= Math.min(5, range.e.c); c++) {
      const cellAddress = XLSX.utils.encode_cell({r, c});
      const cell = worksheet[cellAddress];
      if (cell) {
        rowInfo += `[${cellAddress}:${cell.v}] `;
      }
    }
    console.log(rowInfo);
  }
  
  // Try to find where actual data starts
  console.log('\nLooking for district names...');
  for (let r = 0; r <= Math.min(20, range.e.r); r++) {
    for (let c = 0; c <= Math.min(10, range.e.c); c++) {
      const cellAddress = XLSX.utils.encode_cell({r, c});
      const cell = worksheet[cellAddress];
      if (cell && cell.v && typeof cell.v === 'string') {
        const value = cell.v.toString();
        if (value.includes('ADAMS') || value.includes('Adams') || value.includes('DENVER') || value.includes('Denver')) {
          console.log(`Found at ${cellAddress}: "${value}"`);
        }
      }
    }
  }
});