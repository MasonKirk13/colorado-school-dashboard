const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('Diagnosing missing CMAS data...\n');

// Load current data to see what districts we have
const currentData = JSON.parse(fs.readFileSync('../public/district_data_complete.json', 'utf8'));
const districtsInOurData = Object.keys(currentData);

// Get districts that are missing CMAS
const missingCMAS = districtsInOurData.filter(name => {
  const district = currentData[name];
  return !district.cmas_scores || district.cmas_scores.every(s => s.met_or_exceeded_pct === null);
});

console.log(`Total districts: ${districtsInOurData.length}`);
console.log(`Missing CMAS data: ${missingCMAS.length}`);
console.log('\nChecking a few missing districts to see if they exist in CMAS files...\n');

// Check 2019 CMAS file (which should have good coverage)
const cmasFile = path.join(__dirname, 'General CMAS Score Data/2019 CMAS ELA MATH District and School Achievement Results.xlsx');
const workbook = XLSX.readFile(cmasFile);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const cmasData = XLSX.utils.sheet_to_json(worksheet);

// Get unique district names from CMAS file
const cmasDistrictNames = new Set();
cmasData.forEach(row => {
  // Try different possible column names
  const districtName = row['District Name'] || row['DISTRICT_NAME'] || row['District'] || row['Organization Name'];
  if (districtName && typeof districtName === 'string') {
    cmasDistrictNames.add(districtName.trim());
  }
});

console.log(`Districts in 2019 CMAS file: ${cmasDistrictNames.size}`);

// Check some specific missing districts
const testDistricts = missingCMAS.slice(0, 10);
console.log('\nChecking if these missing districts exist in CMAS with different names:');

testDistricts.forEach(ourName => {
  console.log(`\nOur name: "${ourName}"`);
  
  // Look for exact match
  if (cmasDistrictNames.has(ourName)) {
    console.log('  ✓ Found exact match in CMAS');
    return;
  }
  
  // Look for close matches
  const ourNameLower = ourName.toLowerCase();
  const closeMatches = Array.from(cmasDistrictNames).filter(cmasName => {
    const cmasNameLower = cmasName.toLowerCase();
    // Check if either contains the other
    return cmasNameLower.includes(ourNameLower) || ourNameLower.includes(cmasNameLower) ||
           // Check if they share significant words
           ourNameLower.split(' ').some(word => word.length > 3 && cmasNameLower.includes(word));
  });
  
  if (closeMatches.length > 0) {
    console.log('  Possible matches in CMAS:');
    closeMatches.forEach(match => console.log(`    - "${match}"`));
  } else {
    console.log('  ✗ No matches found');
  }
});

// Show some CMAS district names that might not be in our data
console.log('\n\nSample of district names from CMAS file:');
Array.from(cmasDistrictNames).slice(0, 20).forEach(name => {
  console.log(`  - "${name}"`);
});

// Check column headers to understand the structure
const headers = Object.keys(cmasData[0] || {});
console.log('\n\nColumn headers in 2019 CMAS file:');
headers.forEach(h => console.log(`  - ${h}`));