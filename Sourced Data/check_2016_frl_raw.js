#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Demographic data', '2016-17_PK-12_PupilMembership_bySchool_FRL_0.xlsx');

console.log('Checking 2016-17 FRL raw data structure...\n');

try {
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // Get raw data to see the actual structure
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log('First 10 rows (raw):');
  rawData.slice(0, 10).forEach((row, idx) => {
    console.log(`Row ${idx}: [${row.slice(0, 10).map(cell => `"${cell}"`).join(', ')}]`);
  });
  
  // Find where the actual data starts
  let headerRow = -1;
  for (let i = 0; i < Math.min(20, rawData.length); i++) {
    const row = rawData[i];
    if (row.some(cell => cell && cell.toString().toLowerCase().includes('organization'))) {
      headerRow = i;
      break;
    }
  }
  
  if (headerRow >= 0) {
    console.log(`\nFound headers at row ${headerRow}:`);
    console.log(rawData[headerRow]);
    
    // Parse data starting from header row
    const headers = rawData[headerRow];
    const jsonData = [];
    
    for (let i = headerRow + 1; i < rawData.length; i++) {
      const row = rawData[i];
      const obj = {};
      headers.forEach((header, idx) => {
        if (header) obj[header] = row[idx];
      });
      if (obj[headers[0]]) { // Skip empty rows
        jsonData.push(obj);
      }
    }
    
    console.log(`\nParsed ${jsonData.length} data rows`);
    
    // Check sample data
    console.log('\nFirst data row:');
    console.log(jsonData[0]);
    
    // Calculate FRL for Academy 20
    const academy20Rows = jsonData.filter(row => {
      const orgName = row['ORGANIZATION_NAME'] || row['Organization Name'] || '';
      return orgName.includes('ACADEMY 20');
    });
    
    if (academy20Rows.length > 0) {
      console.log(`\nFound ${academy20Rows.length} rows for Academy 20`);
      
      let total = 0, free = 0, reduced = 0;
      academy20Rows.forEach(row => {
        total += Number(row['PUPIL_COUNT'] || row['Total'] || row['TOTAL'] || 0) || 0;
        free += Number(row['FREE_LUNCH_COUNT'] || row['Free Lunch'] || row['FREE'] || 0) || 0;
        reduced += Number(row['REDUCED_LUNCH_COUNT'] || row['Reduced Lunch'] || row['REDUCED'] || 0) || 0;
      });
      
      console.log(`Academy 20 totals: ${total} students, ${free} free, ${reduced} reduced`);
      if (total > 0) {
        console.log(`FRL %: ${Math.round((free + reduced) / total * 1000) / 10}%`);
      }
    }
  }
  
} catch (error) {
  console.error('Error:', error.message);
}