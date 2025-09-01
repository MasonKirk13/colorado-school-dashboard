#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Process enrollment data with proper handling of missing/masked data
function processEnrollmentData() {
  console.log('Processing enrollment data...');
  const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
  const districtEnrollment = {};
  
  try {
    const workbook = XLSX.readFile(filePath);
    
    workbook.SheetNames.forEach(sheetName => {
      if (sheetName.includes('Cheat Sheet')) return;
      
      const yearMatch = sheetName.match(/(\d{4})-\d{4}/);
      if (!yearMatch) return;
      const year = yearMatch[1];
      
      console.log(`  Processing ${sheetName}...`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      data.forEach(row => {
        const districtName = row['Organization Name'];
        if (!districtName || !districtName.trim()) return;
        
        if (!districtEnrollment[districtName]) {
          districtEnrollment[districtName] = {};
        }
        
        if (!districtEnrollment[districtName][year]) {
          districtEnrollment[districtName][year] = {
            enrollment: 0,
            freeLunch: 0,
            reducedLunch: 0,
            hasValidFRLData: false,
            schools: 0
          };
        }
        
        const enrollment = row['PK-12 Total'] || 0;
        const freeLunch = row['Free Lunch'];
        const reducedLunch = row['Reduced Lunch'];
        
        districtEnrollment[districtName][year].enrollment += enrollment;
        
        // Check if FRL data is valid (not null, undefined, empty, or masked with *)
        const isValidFree = freeLunch !== null && 
                           freeLunch !== undefined && 
                           freeLunch !== '' && 
                           freeLunch !== '*' &&
                           !isNaN(freeLunch);
                           
        const isValidReduced = reducedLunch !== null && 
                              reducedLunch !== undefined && 
                              reducedLunch !== '' && 
                              reducedLunch !== '*' &&
                              !isNaN(reducedLunch);
        
        if (isValidFree) {
          districtEnrollment[districtName][year].freeLunch += parseFloat(freeLunch);
          districtEnrollment[districtName][year].hasValidFRLData = true;
        }
        if (isValidReduced) {
          districtEnrollment[districtName][year].reducedLunch += parseFloat(reducedLunch);
        }
        
        districtEnrollment[districtName][year].schools += 1;
      });
    });
    
    // Calculate FRL percentages
    Object.keys(districtEnrollment).forEach(district => {
      Object.keys(districtEnrollment[district]).forEach(year => {
        const data = districtEnrollment[district][year];
        
        // Only calculate FRL if we have valid data
        if (data.hasValidFRLData && data.enrollment > 0) {
          const frlTotal = data.freeLunch + data.reducedLunch;
          data.frlPercent = Math.round((frlTotal / data.enrollment) * 1000) / 10;
        } else {
          data.frlPercent = null; // Use null for missing/masked data
        }
      });
    });
    
    return districtEnrollment;
    
  } catch (error) {
    console.error('Error processing enrollment data:', error.message);
    return {};
  }
}

// Load good CMAS data from comprehensive processor
console.log('Running comprehensive CMAS processor...');
const { execSync } = require('child_process');
execSync('node process_all_cmas_comprehensive.js', { stdio: 'inherit' });

// Load the data with good CMAS
const dataWithCMAS = JSON.parse(fs.readFileSync('../public/district_data_complete.json', 'utf8'));

// Process enrollment data
const enrollmentData = processEnrollmentData();
console.log(`\nProcessed enrollment data for ${Object.keys(enrollmentData).length} districts`);

// Create final merged data
const finalData = {};

// Get all unique districts
const allDistricts = new Set([
  ...Object.keys(dataWithCMAS),
  ...Object.keys(enrollmentData)
]);

allDistricts.forEach(district => {
  finalData[district] = {
    enrollment_trends: [],
    cmas_scores: []
  };
  
  // Add enrollment data
  if (enrollmentData[district]) {
    Object.entries(enrollmentData[district]).forEach(([year, data]) => {
      finalData[district].enrollment_trends.push({
        year: year,
        enrollment: data.enrollment,
        frl: data.frlPercent
      });
    });
    finalData[district].enrollment_trends.sort((a, b) => a.year.localeCompare(b.year));
  }
  
  // Add CMAS data from comprehensive processor
  if (dataWithCMAS[district] && dataWithCMAS[district].cmas_scores) {
    finalData[district].cmas_scores = dataWithCMAS[district].cmas_scores;
  }
});

// Save final data
console.log('\nSaving final data...');
fs.writeFileSync('../public/district_data_complete.json', JSON.stringify(finalData, null, 2));

console.log('Done! Total districts:', Object.keys(finalData).length);

// Verify
const testDistrict = 'Academy 20';
if (finalData[testDistrict]) {
  console.log(`\nVerification - ${testDistrict}:`);
  console.log('Enrollment/FRL by year:');
  finalData[testDistrict].enrollment_trends.slice(-5).forEach(e => {
    console.log(`  ${e.year}: ${e.enrollment} students, ${e.frl !== null ? e.frl + '% FRL' : 'FRL data not available'}`);
  });
  
  console.log('\nCMAS years with data:');
  const cmasWithData = finalData[testDistrict].cmas_scores
    .filter(c => c.met_or_exceeded_pct !== null)
    .map(c => c.year);
  console.log(`  ${cmasWithData.join(', ')}`);
}