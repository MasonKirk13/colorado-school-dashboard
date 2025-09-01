#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Process enrollment data properly
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
            hasFreeLunchData: false,
            schools: 0
          };
        }
        
        const enrollment = row['PK-12 Total'] || 0;
        const freeLunch = row['Free Lunch'];
        const reducedLunch = row['Reduced Lunch'];
        
        districtEnrollment[districtName][year].enrollment += enrollment;
        
        // Only add FRL data if it exists (not null/undefined)
        if (freeLunch !== null && freeLunch !== undefined && freeLunch !== '') {
          districtEnrollment[districtName][year].freeLunch += freeLunch;
          districtEnrollment[districtName][year].hasFreeLunchData = true;
        }
        if (reducedLunch !== null && reducedLunch !== undefined && reducedLunch !== '') {
          districtEnrollment[districtName][year].reducedLunch += reducedLunch;
        }
        
        districtEnrollment[districtName][year].schools += 1;
      });
    });
    
    // Calculate FRL percentages
    Object.keys(districtEnrollment).forEach(district => {
      Object.keys(districtEnrollment[district]).forEach(year => {
        const data = districtEnrollment[district][year];
        
        // Only calculate FRL if we have actual data
        if (data.hasFreeLunchData && data.enrollment > 0) {
          const frlTotal = data.freeLunch + data.reducedLunch;
          data.frlPercent = Math.round((frlTotal / data.enrollment) * 1000) / 10;
        } else {
          data.frlPercent = null; // Use null instead of 0 for missing data
        }
      });
    });
    
    return districtEnrollment;
    
  } catch (error) {
    console.error('Error processing enrollment data:', error.message);
    return {};
  }
}

// Load the current data with good CMAS
console.log('Loading current data...');
const currentData = JSON.parse(fs.readFileSync('../public/district_data_complete.json', 'utf8'));

// Process enrollment data properly
const enrollmentData = processEnrollmentData();
console.log(`Processed enrollment data for ${Object.keys(enrollmentData).length} districts`);

// Create final merged data
const finalData = {};

// Get all unique districts
const allDistricts = new Set([
  ...Object.keys(currentData),
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
  
  // Keep existing CMAS data (which is good)
  if (currentData[district] && currentData[district].cmas_scores) {
    finalData[district].cmas_scores = currentData[district].cmas_scores;
  }
});

// Now fix the chart display issue - only include years with actual CMAS data
// Update normalization to only show years 2016-2024 for CMAS
console.log('\nSaving final data...');
fs.writeFileSync('../public/district_data_complete.json', JSON.stringify(finalData, null, 2));

console.log('Done! Total districts:', Object.keys(finalData).length);

// Verify
const testDistrict = 'Academy 20';
if (finalData[testDistrict]) {
  console.log(`\nVerification - ${testDistrict}:`);
  console.log('Enrollment/FRL by year:');
  finalData[testDistrict].enrollment_trends.forEach(e => {
    console.log(`  ${e.year}: ${e.enrollment} students, ${e.frl !== null ? e.frl + '%' : 'no'} FRL`);
  });
  
  console.log('\nCMAS years with data:');
  finalData[testDistrict].cmas_scores.forEach(c => {
    if (c.met_or_exceeded_pct !== null) {
      console.log(`  ${c.year}: ${c.met_or_exceeded_pct}%`);
    }
  });
}