#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Checking 2016-2017 sheet columns...\n');

const worksheet = workbook.Sheets['2016-2017 Data'];

// Get raw data to see headers
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('First row (headers):');
if (rawData.length > 0) {
  rawData[0].forEach((header, idx) => {
    if (header) {
      console.log(`  Column ${idx}: "${header}"`);
    }
  });
}

// Get JSON data with headers
const jsonData = XLSX.utils.sheet_to_json(worksheet);

console.log('\n\nFirst data row keys:');
if (jsonData.length > 0) {
  Object.keys(jsonData[0]).forEach(key => {
    console.log(`  "${key}": ${jsonData[0][key]}`);
  });
}

// Check for any columns that might contain lunch data
console.log('\n\nSearching for lunch-related columns:');
if (jsonData.length > 0) {
  Object.keys(jsonData[0]).forEach(key => {
    if (key.toLowerCase().includes('lunch') || 
        key.toLowerCase().includes('frl') || 
        key.toLowerCase().includes('free') ||
        key.toLowerCase().includes('reduced') ||
        key.toLowerCase().includes('meal')) {
      console.log(`  Found: "${key}"`);
    }
  });
}