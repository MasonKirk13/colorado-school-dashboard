const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('Checking CMAS district names vs codes...\n');

// Check 2019 CMAS file
const cmasFile = path.join(__dirname, 'General CMAS Score Data/2019 CMAS ELA MATH District and School Achievement Results.xlsx');
const workbook = XLSX.readFile(cmasFile);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

// Read data starting from row 11 (0-indexed)
const data = XLSX.utils.sheet_to_json(worksheet, { range: 11 });

// Get unique district code/name pairs
const districtMap = new Map();
data.forEach(row => {
  const code = row['District Code'];
  const name = row['District Name'];
  if (code && name && !districtMap.has(code)) {
    districtMap.set(code, name);
  }
});

console.log(`Found ${districtMap.size} unique districts\n`);

// Show all districts with actual names
console.log('Districts with names (not codes):');
let namedDistricts = [];
districtMap.forEach((name, code) => {
  if (name !== code && name.trim() !== '') {
    namedDistricts.push({ code, name });
  }
});

namedDistricts.sort((a, b) => a.name.localeCompare(b.name));

console.log(`\nFound ${namedDistricts.length} districts with actual names\n`);

// Show first 30
namedDistricts.slice(0, 30).forEach(d => {
  console.log(`  ${d.code}: "${d.name}"`);
});

// Check for our missing districts
console.log('\n\nLooking for our missing districts:');
const missing = ['Alamosa', 'Adams-Arapahoe', 'Walsh', 'Las Animas', 'St Vrain'];

missing.forEach(search => {
  console.log(`\nSearching for "${search}":`);
  const found = namedDistricts.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );
  if (found.length > 0) {
    found.forEach(f => console.log(`  Found: ${f.code}: "${f.name}"`));
  } else {
    console.log('  Not found');
  }
});

// Save the mapping
const mapping = {};
namedDistricts.forEach(d => {
  mapping[d.code] = d.name;
});
fs.writeFileSync('cmas_district_mapping.json', JSON.stringify(mapping, null, 2));
console.log('\nSaved district code->name mapping to cmas_district_mapping.json');