#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Normalize district name function (same as in other processors)
function normalizeDistrictName(name) {
  if (!name) return name;
  
  return name.trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\b(\d+)\w\b/g, match => match.toUpperCase())
    .replace(/\bRe\b/g, 'RE')
    .replace(/\bRe-/g, 'RE-');
}

console.log('Processing 2016-17 FRL data from demographic file...\n');

const filePath = path.join(__dirname, 'Demographic data', '2016-17_PK-12_PupilMembership_bySchool_FRL_0.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

// Get raw data
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Find header row
let headerRow = -1;
for (let i = 0; i < 10; i++) {
  if (rawData[i] && rawData[i][0] === 'COUNTY CODE') {
    headerRow = i;
    break;
  }
}

if (headerRow < 0) {
  console.error('Could not find header row');
  process.exit(1);
}

// Process data
const districtData = {};
let totalRows = 0;

for (let i = headerRow + 1; i < rawData.length; i++) {
  const row = rawData[i];
  if (!row || !row[3]) continue; // Skip empty rows
  
  const districtName = normalizeDistrictName(row[3].replace(/\t/g, ' ').trim());
  const enrollment = parseInt(row[6]) || 0;
  const frlCount = row[7] === 'N/A' ? 0 : parseInt(row[7]) || 0;
  
  totalRows++;
  
  if (!districtData[districtName]) {
    districtData[districtName] = {
      enrollment: 0,
      frlCount: 0,
      schools: 0
    };
  }
  
  districtData[districtName].enrollment += enrollment;
  districtData[districtName].frlCount += frlCount;
  districtData[districtName].schools += 1;
}

console.log(`Processed ${totalRows} rows`);
console.log(`Found ${Object.keys(districtData).length} districts\n`);

// Calculate FRL percentages
const results = {};
Object.entries(districtData).forEach(([district, data]) => {
  const frlPercent = data.enrollment > 0 
    ? Math.round((data.frlCount / data.enrollment) * 1000) / 10 
    : null;
    
  results[district] = {
    enrollment: data.enrollment,
    frlCount: data.frlCount,
    frlPercent: frlPercent,
    schools: data.schools
  };
});

// Show sample results
console.log('Sample results:');
['Academy 20', 'Denver County 1', 'Adams 12 Five Star Schools'].forEach(district => {
  if (results[district]) {
    const data = results[district];
    console.log(`\n${district}:`);
    console.log(`  Enrollment: ${data.enrollment.toLocaleString()}`);
    console.log(`  FRL Count: ${data.frlCount.toLocaleString()}`);
    console.log(`  FRL %: ${data.frlPercent}%`);
    console.log(`  Schools: ${data.schools}`);
  } else {
    console.log(`\n${district}: Not found`);
  }
});

// Now update the main district data file
console.log('\n\nUpdating district_data_complete.json with 2016 FRL data...');

const mainDataPath = path.join(__dirname, '../public/district_data_complete.json');
const mainData = JSON.parse(fs.readFileSync(mainDataPath, 'utf8'));

let updatedCount = 0;
Object.entries(mainData).forEach(([district, districtData]) => {
  if (!districtData.enrollment_trends) return;
  
  // Find 2016 entry
  const entry2016 = districtData.enrollment_trends.find(e => e.year === '2016');
  if (entry2016 && results[district]) {
    const oldFRL = entry2016.frl;
    entry2016.frl = results[district].frlPercent;
    
    if (oldFRL !== entry2016.frl) {
      updatedCount++;
      console.log(`Updated ${district}: ${oldFRL} -> ${entry2016.frl}%`);
    }
  }
});

// Save updated data
fs.writeFileSync(mainDataPath, JSON.stringify(mainData, null, 2));

console.log(`\nUpdated ${updatedCount} districts with 2016 FRL data`);
console.log('Done!');