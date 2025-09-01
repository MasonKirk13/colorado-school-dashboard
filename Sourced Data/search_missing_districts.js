#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

// Districts we're looking for
const missingDistricts = [
  'Consolidated C-1',
  'Gilcrest RE-1',
  'Platte Valley RE-3'
];

console.log('Searching for missing districts in enrollment data...\n');

// Load enrollment file
const enrollmentFile = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(enrollmentFile);

// Search all sheets
const foundDistricts = new Set();
const allDistricts = [];

workbook.SheetNames.forEach(sheetName => {
  if (sheetName.includes('Cheat Sheet')) return;
  
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  data.forEach(row => {
    const districtName = row['Organization Name'];
    if (districtName && districtName !== '9999') {
      allDistricts.push(districtName);
      
      // Check if it matches any of our missing districts
      missingDistricts.forEach(missing => {
        const missingLower = missing.toLowerCase();
        const districtLower = districtName.toLowerCase();
        
        if (districtLower.includes('consolidated') || 
            districtLower.includes('gilcrest') || 
            districtLower.includes('platte valley')) {
          foundDistricts.add(districtName);
        }
      });
    }
  });
});

// Show results
console.log('=== SEARCH RESULTS ===');
missingDistricts.forEach(missing => {
  console.log(`\nSearching for: "${missing}"`);
  const found = Array.from(foundDistricts).filter(d => {
    const dLower = d.toLowerCase();
    const mLower = missing.toLowerCase();
    return dLower.includes(mLower.split(' ')[0]);
  });
  
  if (found.length > 0) {
    console.log('  Found potential matches:');
    found.forEach(f => console.log(`    - ${f}`));
  } else {
    console.log('  No matches found');
  }
});

// Also search more broadly
console.log('\n=== BROADER SEARCH ===');
console.log('\nAll districts containing "Platte":');
const platteDistricts = [...new Set(allDistricts)].filter(d => 
  d.toLowerCase().includes('platte')
).sort();
platteDistricts.forEach(d => console.log(`  - ${d}`));

console.log('\nAll districts containing "Gilcrest":');
const gilcrestDistricts = [...new Set(allDistricts)].filter(d => 
  d.toLowerCase().includes('gilcrest')
).sort();
gilcrestDistricts.forEach(d => console.log(`  - ${d}`));

console.log('\nAll districts containing "Consolidated":');
const consolidatedDistricts = [...new Set(allDistricts)].filter(d => 
  d.toLowerCase().includes('consolidated')
).sort();
consolidatedDistricts.forEach(d => console.log(`  - ${d}`));

// Show all unique districts sorted
console.log(`\n=== TOTAL UNIQUE DISTRICTS IN ENROLLMENT: ${new Set(allDistricts).size} ===`);