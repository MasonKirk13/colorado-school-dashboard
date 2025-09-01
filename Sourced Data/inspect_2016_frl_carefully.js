#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Carefully inspecting 2016-2017 sheet in the FINAL file...\n');

const worksheet = workbook.Sheets['2016-2017 Data'];

// Get raw data with header: 1 to see actual cell values
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

console.log('First 3 rows of raw data:');
for (let i = 0; i < 3 && i < rawData.length; i++) {
  console.log(`\nRow ${i}:`);
  for (let j = 0; j < Math.min(12, rawData[i].length); j++) {
    const value = rawData[i][j];
    console.log(`  Col ${j}: "${value}" (type: ${typeof value})`);
  }
}

// Now check specific rows with school data
console.log('\n\nChecking rows with actual school data:');
for (let i = 1; i < 20 && i < rawData.length; i++) {
  const row = rawData[i];
  if (row[1] && row[1].toString().includes('ACADEMY 20')) {
    console.log(`\nRow ${i} - ${row[1]} - ${row[3]}:`);
    console.log(`  Enrollment (col 7): ${row[7]}`);
    console.log(`  Free Lunch (col 8): "${row[8]}" (type: ${typeof row[8]})`);
    console.log(`  Reduced Lunch (col 9): "${row[9]}" (type: ${typeof row[9]})`);
    console.log(`  Paid Lunch (col 10): "${row[10]}" (type: ${typeof row[10]})`);
    
    // Check if the values are numbers
    if (typeof row[8] === 'number') {
      console.log(`  Free Lunch is a NUMBER: ${row[8]}`);
    }
    if (typeof row[9] === 'number') {
      console.log(`  Reduced Lunch is a NUMBER: ${row[9]}`);
    }
  }
}

// Try different parsing options
console.log('\n\nTrying different parsing options:');
const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

if (jsonData.length > 0) {
  console.log('\nFirst row keys:', Object.keys(jsonData[0]));
  
  // Find Academy 20 rows
  const academy20Rows = jsonData.filter(row => 
    row['Organization Name'] && row['Organization Name'].includes('ACADEMY 20')
  );
  
  if (academy20Rows.length > 0) {
    console.log('\nAcademy 20 first row:');
    console.log(JSON.stringify(academy20Rows[0], null, 2));
  }
}

// Check sheet properties
console.log('\n\nSheet info:');
const range = XLSX.utils.decode_range(worksheet['!ref']);
console.log(`Sheet range: ${worksheet['!ref']}`);
console.log(`Columns: ${range.s.c} to ${range.e.c}`);
console.log(`Rows: ${range.s.r} to ${range.e.r}`);

// Check specific cells
console.log('\n\nChecking specific cells:');
const checkCells = ['I1', 'I2', 'I3', 'J1', 'J2', 'J3'];
checkCells.forEach(cell => {
  if (worksheet[cell]) {
    console.log(`Cell ${cell}: value="${worksheet[cell].v}", type="${worksheet[cell].t}"`);
  } else {
    console.log(`Cell ${cell}: empty`);
  }
});