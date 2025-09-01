#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Normalize district name function
function normalizeDistrictName(name) {
  if (!name) return name;
  
  return name.trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\b(\d+)\w\b/g, match => match.toUpperCase())
    .replace(/\bRe\b/g, 'RE')
    .replace(/\bRe-/g, 'RE-');
}

// Process enrollment data with better FRL handling
function processEnrollmentDataFixed() {
  console.log('Processing enrollment data with fixed FRL handling...');
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
        const rawDistrictName = row['Organization Name'];
        if (!rawDistrictName || !rawDistrictName.trim()) return;
        
        const districtName = normalizeDistrictName(rawDistrictName);
        
        if (!districtEnrollment[districtName]) {
          districtEnrollment[districtName] = {};
        }
        
        if (!districtEnrollment[districtName][year]) {
          districtEnrollment[districtName][year] = {
            enrollment: 0,
            freeLunch: 0,
            reducedLunch: 0,
            validFRLSchools: 0,
            totalSchools: 0
          };
        }
        
        const enrollment = row['PK-12 Total'] || 0;
        const freeLunch = row['Free Lunch'];
        const reducedLunch = row['Reduced Lunch'];
        
        districtEnrollment[districtName][year].enrollment += enrollment;
        districtEnrollment[districtName][year].totalSchools += 1;
        
        // Process FRL data - accept numeric values, skip "*" and other invalid values
        let hasValidFRL = false;
        
        if (freeLunch !== '*' && freeLunch !== undefined && freeLunch !== null && freeLunch !== '') {
          const freeNum = parseFloat(freeLunch);
          if (!isNaN(freeNum)) {
            districtEnrollment[districtName][year].freeLunch += freeNum;
            hasValidFRL = true;
          }
        }
        
        if (reducedLunch !== '*' && reducedLunch !== undefined && reducedLunch !== null && reducedLunch !== '') {
          const reducedNum = parseFloat(reducedLunch);
          if (!isNaN(reducedNum)) {
            districtEnrollment[districtName][year].reducedLunch += reducedNum;
            hasValidFRL = true;
          }
        }
        
        if (hasValidFRL) {
          districtEnrollment[districtName][year].validFRLSchools += 1;
        }
      });
      
      console.log(`    Found ${Object.keys(districtEnrollment).length} districts`);
    });
    
    // Calculate FRL percentages
    Object.keys(districtEnrollment).forEach(district => {
      Object.keys(districtEnrollment[district]).forEach(year => {
        const data = districtEnrollment[district][year];
        
        // Only require SOME schools to have valid data, not all
        if (data.validFRLSchools > 0 && data.enrollment > 0) {
          const frlTotal = data.freeLunch + data.reducedLunch;
          data.frlPercent = Math.round((frlTotal / data.enrollment) * 1000) / 10;
        } else {
          data.frlPercent = null;
        }
      });
    });
    
    return districtEnrollment;
    
  } catch (error) {
    console.error('Error processing enrollment data:', error.message);
    return {};
  }
}

// Main execution
console.log('Fixing FRL data processing...\n');

// Load current data
const currentData = JSON.parse(fs.readFileSync('../public/district_data_complete.json', 'utf8'));

// Process enrollment data with fixed logic
const enrollmentData = processEnrollmentDataFixed();

// Update the data
console.log('\nUpdating district data with fixed FRL values...');
let updatedCount = 0;

Object.entries(currentData).forEach(([districtName, district]) => {
  const normalizedName = normalizeDistrictName(districtName);
  
  if (enrollmentData[normalizedName] && district.enrollment_trends) {
    district.enrollment_trends.forEach(trend => {
      const yearData = enrollmentData[normalizedName][trend.year];
      if (yearData && yearData.frlPercent !== null && trend.frl !== yearData.frlPercent) {
        console.log(`Updating ${districtName} ${trend.year}: ${trend.frl} -> ${yearData.frlPercent}%`);
        trend.frl = yearData.frlPercent;
        updatedCount++;
      }
    });
  }
});

// Save updated data
fs.writeFileSync('../public/district_data_complete.json', JSON.stringify(currentData, null, 2));

console.log(`\nUpdated ${updatedCount} district-year FRL values`);
console.log('Done!');

// Verify some results
console.log('\nVerification - Sample districts:');
['Denver County 1', 'Academy 20', 'Cherry Creek 5'].forEach(districtName => {
  const district = currentData[districtName];
  if (district && district.enrollment_trends) {
    console.log(`\n${districtName}:`);
    district.enrollment_trends.slice(-5).forEach(trend => {
      console.log(`  ${trend.year}: ${trend.frl !== null ? trend.frl + '%' : 'null'}`);
    });
  }
});