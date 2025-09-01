#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');

console.log('Debugging 2016-2017 Excel sheet reading...\n');

// Try different read options
const options = [
  { description: 'Default options', opts: {} },
  { description: 'With cellDates', opts: { cellDates: true } },
  { description: 'With raw', opts: { raw: true } },
  { description: 'With type: buffer', opts: { type: 'buffer' } }
];

options.forEach(({ description, opts }) => {
  console.log(`\nTrying: ${description}`);
  try {
    const workbook = XLSX.readFile(filePath, opts);
    const worksheet = workbook.Sheets['2016-2017 Data'];
    
    // Check specific cells where FRL data should be
    console.log('  Checking cells I2-I5 (Free Lunch column):');
    for (let i = 2; i <= 5; i++) {
      const cell = worksheet[`I${i}`];
      if (cell) {
        console.log(`    I${i}: value=${cell.v}, type=${cell.t}, raw=${cell.w}`);
      } else {
        console.log(`    I${i}: empty/undefined`);
      }
    }
    
    // Try sheet_to_json
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    const firstRow = jsonData[0];
    if (firstRow) {
      console.log('  First row Free Lunch value:', firstRow['Free Lunch']);
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }
});

// Check if it's a formula or formatting issue
console.log('\n\nChecking worksheet properties:');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets['2016-2017 Data'];

// Look for any formulas or special properties
const range = XLSX.utils.decode_range(worksheet['!ref']);
console.log(`Sheet range: ${worksheet['!ref']}`);

// Sample some cells in the Free/Reduced columns
console.log('\nSampling cells in columns I and J:');
for (let row = 2; row <= 10; row++) {
  const freeCell = `I${row}`;
  const reducedCell = `J${row}`;
  
  console.log(`Row ${row}:`);
  if (worksheet[freeCell]) {
    console.log(`  ${freeCell}: ${JSON.stringify(worksheet[freeCell])}`);
  } else {
    console.log(`  ${freeCell}: not found`);
  }
  if (worksheet[reducedCell]) {
    console.log(`  ${reducedCell}: ${JSON.stringify(worksheet[reducedCell])}`);
  } else {
    console.log(`  ${reducedCell}: not found`);
  }
}