#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the complete data
const dataPath = path.join(__dirname, '../public/district_data_complete.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('Verifying complete district data...\n');

// Find a district with complete data
const exampleDistricts = Object.entries(data)
  .filter(([name, d]) => d.cmas_scores && d.cmas_scores.length > 0)
  .sort((a, b) => b[1].cmas_scores.length - a[1].cmas_scores.length)
  .slice(0, 3);

exampleDistricts.forEach(([name, district]) => {
  console.log(`\n=== ${name} ===`);
  
  console.log('\nCMAS Scores:');
  district.cmas_scores.forEach(score => {
    if (score.note) {
      console.log(`  ${score.year}: ${score.note}`);
    } else if (score.met_or_exceeded_pct !== null) {
      console.log(`  ${score.year}: ${score.met_or_exceeded_pct}%`);
    } else {
      console.log(`  ${score.year}: No data`);
    }
  });
  
  // Check for all years
  const years = district.cmas_scores.map(s => s.year);
  console.log(`\nYears included: ${years.join(', ')}`);
  console.log(`Total years: ${years.length}`);
});

// Statistics
const districtsWithCMAS = Object.values(data).filter(d => d.cmas_scores && d.cmas_scores.length > 0).length;
const districtsWithAllYears = Object.values(data).filter(d => 
  d.cmas_scores && d.cmas_scores.length >= 8 // 2016-2024 minus 2020 = 8 possible data years
).length;

console.log('\n=== Summary ===');
console.log(`Total districts: ${Object.keys(data).length}`);
console.log(`Districts with CMAS data: ${districtsWithCMAS}`);
console.log(`Districts with 8+ years of data: ${districtsWithAllYears}`);