const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Copy the normalizeDistrictName function from the processor
function normalizeDistrictName(name) {
  if (!name) return name;
  
  // Convert to title case
  return name.trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\b(\d+)\w\b/g, match => match.toUpperCase()); // Keep numbers with letters uppercase (e.g., 27J)
}

console.log('Testing CMAS name normalization...\n');

// Test cases
const testCases = [
  'ADAMS-ARAPAHOE 28J',
  'ALAMOSA RE-11J',
  'ST VRAIN VALLEY RE 1J',
  'ADAMS 12 FIVE STAR SCHOOLS',
  'LAS ANIMAS RE-1'
];

console.log('Normalization test:');
testCases.forEach(test => {
  console.log(`  "${test}" -> "${normalizeDistrictName(test)}"`);
});

// Load our current data to see what names we have
const currentData = JSON.parse(fs.readFileSync('../public/district_data_complete.json', 'utf8'));
const ourNames = Object.keys(currentData);

console.log('\n\nChecking if normalized CMAS names match our data:');
testCases.forEach(cmasName => {
  const normalized = normalizeDistrictName(cmasName);
  const exactMatch = ourNames.includes(normalized);
  const caseInsensitiveMatch = ourNames.find(n => n.toLowerCase() === normalized.toLowerCase());
  
  console.log(`\n"${cmasName}"`);
  console.log(`  Normalized: "${normalized}"`);
  console.log(`  Exact match: ${exactMatch ? 'YES' : 'NO'}`);
  if (!exactMatch && caseInsensitiveMatch) {
    console.log(`  Case-insensitive match: "${caseInsensitiveMatch}"`);
  }
});

// Check the actual CMAS processing for a specific year
console.log('\n\nChecking 2019 CMAS file processing...');
const cmasFile = path.join(__dirname, 'General CMAS Score Data/2019 CMAS ELA MATH District and School Achievement Results.xlsx');
const workbook = XLSX.readFile(cmasFile);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet, { range: 11 });

// Count districts in CMAS
const cmasDistricts = new Set();
data.forEach(row => {
  const districtName = row['District Name'];
  if (districtName && districtName !== '0000') {
    cmasDistricts.add(normalizeDistrictName(districtName));
  }
});

console.log(`\nUnique districts in 2019 CMAS (normalized): ${cmasDistricts.size}`);

// Check how many match our data
let matches = 0;
let mismatches = [];
cmasDistricts.forEach(cmasDistrict => {
  if (ourNames.includes(cmasDistrict)) {
    matches++;
  } else {
    mismatches.push(cmasDistrict);
  }
});

console.log(`Matching our data: ${matches}`);
console.log(`Not matching: ${mismatches.length}`);

console.log('\nFirst 10 mismatches:');
mismatches.slice(0, 10).forEach(m => {
  console.log(`  CMAS: "${m}"`);
  // Try to find close match
  const closeMatch = ourNames.find(n => 
    n.toLowerCase().includes(m.toLowerCase().split(' ')[0]) ||
    m.toLowerCase().includes(n.toLowerCase().split(' ')[0])
  );
  if (closeMatch) {
    console.log(`    Possible match: "${closeMatch}"`);
  }
});