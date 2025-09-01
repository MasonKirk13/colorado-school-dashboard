#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Checking FRL data availability across all years...\n');

// Check each sheet
workbook.SheetNames.forEach(sheetName => {
  if (sheetName.includes('Cheat Sheet')) return;
  
  const yearMatch = sheetName.match(/(\d{4})-\d{4}/);
  if (!yearMatch) return;
  
  console.log(`\nChecking ${sheetName}:`);
  
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Find FRL columns
  let freeCol = -1;
  let reducedCol = -1;
  
  if (rawData.length > 0) {
    const headers = rawData[0];
    headers.forEach((header, idx) => {
      if (header && header.toString().includes('Free Lunch')) freeCol = idx;
      if (header && header.toString().includes('Reduced Lunch')) reducedCol = idx;
    });
  }
  
  console.log(`  Free Lunch column: ${freeCol >= 0 ? freeCol : 'NOT FOUND'}`);
  console.log(`  Reduced Lunch column: ${reducedCol >= 0 ? reducedCol : 'NOT FOUND'}`);
  
  // Check if columns have data
  if (freeCol >= 0 && rawData.length > 1) {
    let hasData = false;
    for (let i = 1; i < Math.min(50, rawData.length); i++) {
      if (rawData[i][freeCol] !== undefined && 
          rawData[i][freeCol] !== null && 
          rawData[i][freeCol] !== '') {
        hasData = true;
        break;
      }
    }
    console.log(`  Has FRL data: ${hasData ? 'YES' : 'NO (columns empty)'}`);
    
    if (!hasData) {
      console.log(`  ⚠️  WARNING: FRL columns exist but contain no data!`);
    }
  }
});