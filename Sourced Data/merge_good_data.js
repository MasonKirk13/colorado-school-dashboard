#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// First, backup current data
const currentData = JSON.parse(fs.readFileSync('../public/district_data_complete.json', 'utf8'));
fs.writeFileSync('../public/district_data_complete_backup.json', JSON.stringify(currentData, null, 2));

// Run the comprehensive CMAS processor to get good CMAS data
console.log('Getting comprehensive CMAS data...');
const { execSync } = require('child_process');
execSync('node process_all_cmas_comprehensive.js', { stdio: 'inherit' });

// Load the data with good CMAS
const dataWithGoodCMAS = JSON.parse(fs.readFileSync('../public/district_data_complete.json', 'utf8'));

// Run the original processor to get good enrollment data
console.log('\nGetting original enrollment data...');
execSync('node process_all_district_data.js', { stdio: 'inherit' });

// Load the data with good enrollment
const dataWithGoodEnrollment = JSON.parse(fs.readFileSync('../public/district_data_complete.json', 'utf8'));

// Merge: take enrollment from original, CMAS from comprehensive
console.log('\nMerging data...');
const finalData = {};

// Get all districts
const allDistricts = new Set([
  ...Object.keys(dataWithGoodCMAS),
  ...Object.keys(dataWithGoodEnrollment)
]);

allDistricts.forEach(district => {
  finalData[district] = {
    enrollment_trends: [],
    cmas_scores: []
  };
  
  // Take enrollment data from the original processor (has correct FRL)
  if (dataWithGoodEnrollment[district] && dataWithGoodEnrollment[district].enrollment_trends) {
    finalData[district].enrollment_trends = dataWithGoodEnrollment[district].enrollment_trends;
  }
  
  // Take CMAS data from the comprehensive processor (has all years)
  if (dataWithGoodCMAS[district] && dataWithGoodCMAS[district].cmas_scores) {
    finalData[district].cmas_scores = dataWithGoodCMAS[district].cmas_scores;
  }
});

// Save the merged data
fs.writeFileSync('../public/district_data_complete.json', JSON.stringify(finalData, null, 2));

console.log('\nMerge complete!');
console.log(`Total districts: ${Object.keys(finalData).length}`);

// Verify the merge
const testDistrict = 'Academy 20';
if (finalData[testDistrict]) {
  console.log(`\nVerification - ${testDistrict}:`);
  
  const enrollmentYears = finalData[testDistrict].enrollment_trends
    .map(e => `${e.year}: ${e.frl}% FRL`)
    .slice(0, 5);
  console.log('Enrollment/FRL:', enrollmentYears.join(', '));
  
  const cmasYears = finalData[testDistrict].cmas_scores
    .filter(c => c.met_or_exceeded_pct !== null)
    .map(c => c.year);
  console.log('CMAS years:', cmasYears.join(', '));
}