#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Step 1: Running original processor to get complete enrollment data (2014-2024)...');
execSync('node process_all_district_data.js', { stdio: 'inherit' });

// Save the enrollment data
const enrollmentData = JSON.parse(fs.readFileSync('../public/district_data_complete.json', 'utf8'));
fs.writeFileSync('temp_enrollment.json', JSON.stringify(enrollmentData, null, 2));

console.log('\nStep 2: Running comprehensive CMAS processor to get all CMAS years...');
execSync('node process_all_cmas_comprehensive.js', { stdio: 'inherit' });

// Load both datasets
const cmasData = JSON.parse(fs.readFileSync('../public/district_data_complete.json', 'utf8'));
const fullEnrollmentData = JSON.parse(fs.readFileSync('temp_enrollment.json', 'utf8'));

console.log('\nStep 3: Merging data - taking enrollment from original, CMAS from comprehensive...');

// Create final merged data
const finalData = {};

// Get all unique districts
const allDistricts = new Set([
  ...Object.keys(cmasData),
  ...Object.keys(fullEnrollmentData)
]);

allDistricts.forEach(district => {
  finalData[district] = {
    enrollment_trends: [],
    cmas_scores: []
  };
  
  // Take enrollment data from original processor (has all years 2014-2024)
  if (fullEnrollmentData[district] && fullEnrollmentData[district].enrollment_trends) {
    finalData[district].enrollment_trends = fullEnrollmentData[district].enrollment_trends;
  }
  
  // Take CMAS data from comprehensive processor (has all available years)
  if (cmasData[district] && cmasData[district].cmas_scores) {
    finalData[district].cmas_scores = cmasData[district].cmas_scores;
  }
});

// Save final merged data
fs.writeFileSync('../public/district_data_complete.json', JSON.stringify(finalData, null, 2));

// Clean up temp file
fs.unlinkSync('temp_enrollment.json');

console.log('\nDone! Total districts:', Object.keys(finalData).length);

// Verify the merge worked
const testDistrict = 'Academy 20';
if (finalData[testDistrict]) {
  console.log(`\nVerification - ${testDistrict}:`);
  
  console.log('Enrollment years:', finalData[testDistrict].enrollment_trends.map(e => e.year).join(', '));
  
  console.log('Sample enrollment data:');
  finalData[testDistrict].enrollment_trends.slice(0, 3).forEach(e => {
    console.log(`  ${e.year}: ${e.enrollment} students, ${e.frl !== null ? e.frl + '% FRL' : 'no FRL data'}`);
  });
  
  console.log('\nCMAS years with data:', 
    finalData[testDistrict].cmas_scores
      .filter(c => c.met_or_exceeded_pct !== null)
      .map(c => c.year)
      .join(', ')
  );
}