#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Re-checking 2016-2017 sheet for FRL data...\n');

const worksheet = workbook.Sheets['2016-2017 Data'];
const jsonData = XLSX.utils.sheet_to_json(worksheet);

console.log('Total rows:', jsonData.length);

// Check if columns exist with different names
console.log('\nAll column names from first row:');
if (jsonData.length > 0) {
  Object.keys(jsonData[0]).forEach(key => {
    console.log(`  "${key}"`);
  });
}

// Look for specific districts and show all their data
const testDistricts = ['ACADEMY 20', 'DENVER COUNTY 1', 'ADAMS 12 FIVE STAR SCHOOLS'];

testDistricts.forEach(districtName => {
  console.log(`\n\nChecking ${districtName}:`);
  const rows = jsonData.filter(row => 
    row['Organization Name'] && 
    row['Organization Name'].toUpperCase().includes(districtName)
  );
  
  if (rows.length > 0) {
    // Show first few rows with all lunch-related columns
    rows.slice(0, 3).forEach((row, idx) => {
      console.log(`\n  Row ${idx + 1}:`);
      Object.keys(row).forEach(key => {
        if (key.toLowerCase().includes('lunch') || 
            key.toLowerCase().includes('meal') || 
            key.toLowerCase().includes('frl') ||
            key.toLowerCase().includes('free') ||
            key.toLowerCase().includes('reduced') ||
            key === 'PK-12 Total' ||
            key === 'Organization Name' ||
            key === 'School Name') {
          console.log(`    ${key}: ${row[key]}`);
        }
      });
    });
    
    // Calculate district total
    let totalEnrollment = 0;
    let totalFree = 0;
    let totalReduced = 0;
    let hasAnyFRLData = false;
    
    rows.forEach(row => {
      const enrollment = row['PK-12 Total'] || 0;
      totalEnrollment += enrollment;
      
      // Check all possible FRL column names
      const possibleFreeColumns = ['Free Lunch', 'Free', 'Free Eligible', 'Free Lunch Eligible'];
      const possibleReducedColumns = ['Reduced Lunch', 'Reduced', 'Reduced Eligible', 'Reduced Lunch Eligible'];
      
      possibleFreeColumns.forEach(col => {
        if (row[col] !== undefined && row[col] !== null && row[col] !== '' && !isNaN(row[col])) {
          totalFree += parseFloat(row[col]);
          hasAnyFRLData = true;
        }
      });
      
      possibleReducedColumns.forEach(col => {
        if (row[col] !== undefined && row[col] !== null && row[col] !== '' && !isNaN(row[col])) {
          totalReduced += parseFloat(row[col]);
          hasAnyFRLData = true;
        }
      });
    });
    
    console.log(`\n  District Summary:`);
    console.log(`    Total Enrollment: ${totalEnrollment}`);
    console.log(`    Total Free: ${totalFree}`);
    console.log(`    Total Reduced: ${totalReduced}`);
    console.log(`    Has FRL Data: ${hasAnyFRLData}`);
    if (totalEnrollment > 0 && hasAnyFRLData) {
      console.log(`    FRL %: ${Math.round((totalFree + totalReduced) / totalEnrollment * 1000) / 10}%`);
    }
  } else {
    console.log('  No rows found');
  }
});

// Check raw data to see what's in the cells
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
console.log('\n\nChecking raw data for column 8 (Free Lunch) and 9 (Reduced Lunch):');
for (let i = 1; i <= 10 && i < rawData.length; i++) {
  const row = rawData[i];
  console.log(`Row ${i}: Free="${row[8]}", Reduced="${row[9]}", Type: Free=${typeof row[8]}, Reduced=${typeof row[9]}`);
}