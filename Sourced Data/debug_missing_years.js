const { processAllCMASData, combineAllData } = require('./process_all_district_data.js');
const fs = require('fs');

console.log('Checking CMAS data processing for missing years...\n');

// Process CMAS data
const cmasResults = processAllCMASData();

// Group by year to see what we got
const byYear = {};
cmasResults.forEach(result => {
  if (!byYear[result.year]) {
    byYear[result.year] = new Set();
  }
  byYear[result.year].add(result.district);
});

// Show districts per year
console.log('Districts with data by year:');
Object.entries(byYear).sort().forEach(([year, districts]) => {
  console.log(`  ${year}: ${districts.size} districts`);
});

// Check specific districts across years
console.log('\nChecking specific districts across all years:');
const testDistricts = ['Academy 20', 'Denver County 1', 'Adams 12 Five Star Schools'];

testDistricts.forEach(district => {
  console.log(`\n${district}:`);
  const districtResults = cmasResults.filter(r => r.district === district);
  const years = [...new Set(districtResults.map(r => r.year))].sort();
  console.log(`  Years with data: ${years.join(', ')}`);
  
  // Show sample data for each year
  years.forEach(year => {
    const yearData = districtResults.filter(r => r.year === year);
    const avgPercent = yearData.reduce((sum, r) => sum + r.percent, 0) / yearData.length;
    console.log(`    ${year}: ${yearData.length} subjects, avg ${avgPercent.toFixed(1)}%`);
  });
});

// Check if district names might be different in early years
console.log('\n\nChecking for district name variations in 2016:');
const results2016 = cmasResults.filter(r => r.year === '2016');
const uniqueDistricts2016 = [...new Set(results2016.map(r => r.district))].sort();
console.log(`Found ${uniqueDistricts2016.length} districts in 2016`);
console.log('Sample districts from 2016:', uniqueDistricts2016.slice(0, 10));