#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Normalize district names to handle case variations
function normalizeDistrictName(name) {
  if (!name) return name;
  
  // Convert to title case but preserve "RE" as uppercase
  return name.trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\b(\d+)\w\b/g, match => match.toUpperCase()) // Keep numbers with letters uppercase (e.g., 27J)
    .replace(/\bRe\b/g, 'RE') // Keep "RE" uppercase as it appears in enrollment data
    .replace(/\bRe-/g, 'RE-'); // Also handle "RE-" pattern
}

// Process enrollment data with name normalization
function processEnrollmentDataComplete() {
  console.log('Processing enrollment data with name normalization...');
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
      
      // Track unique districts for this year
      const yearDistricts = new Set();
      
      data.forEach(row => {
        const rawDistrictName = row['Organization Name'];
        if (!rawDistrictName || !rawDistrictName.trim()) return;
        
        // Normalize the district name
        const districtName = normalizeDistrictName(rawDistrictName);
        yearDistricts.add(districtName);
        
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
        
        // Check if FRL data is valid
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
      
      console.log(`    Found ${yearDistricts.size} districts`);
    });
    
    // Calculate FRL percentages
    Object.keys(districtEnrollment).forEach(district => {
      Object.keys(districtEnrollment[district]).forEach(year => {
        const data = districtEnrollment[district][year];
        
        if (data.hasValidFRLData && data.enrollment > 0) {
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

// Load current CMAS data (which is good)
console.log('Loading current CMAS data...');
const currentData = JSON.parse(fs.readFileSync('../public/district_data_complete.json', 'utf8'));

// Process enrollment data with normalization
const enrollmentData = processEnrollmentDataComplete();
console.log(`\nProcessed enrollment data for ${Object.keys(enrollmentData).length} districts`);

// Create final merged data
const finalData = {};

// Get all unique districts
const allDistricts = new Set([
  ...Object.keys(currentData).map(d => normalizeDistrictName(d)),
  ...Object.keys(enrollmentData)
]);

console.log(`\nMerging ${allDistricts.size} total districts...`);

allDistricts.forEach(district => {
  const normalizedDistrict = normalizeDistrictName(district);
  
  finalData[normalizedDistrict] = {
    enrollment_trends: [],
    cmas_scores: []
  };
  
  // Add enrollment data
  if (enrollmentData[normalizedDistrict]) {
    Object.entries(enrollmentData[normalizedDistrict]).forEach(([year, data]) => {
      finalData[normalizedDistrict].enrollment_trends.push({
        year: year,
        enrollment: data.enrollment,
        frl: data.frlPercent
      });
    });
    finalData[normalizedDistrict].enrollment_trends.sort((a, b) => a.year.localeCompare(b.year));
  }
  
  // Add CMAS data - check both original name and normalized name
  let cmasSource = null;
  if (currentData[district] && currentData[district].cmas_scores) {
    cmasSource = currentData[district].cmas_scores;
  } else if (currentData[normalizedDistrict] && currentData[normalizedDistrict].cmas_scores) {
    cmasSource = currentData[normalizedDistrict].cmas_scores;
  }
  
  if (cmasSource) {
    finalData[normalizedDistrict].cmas_scores = cmasSource;
  }
});

// Save final data
console.log('\nSaving final data...');
fs.writeFileSync('../public/district_data_complete.json', JSON.stringify(finalData, null, 2));

console.log('Done! Total districts:', Object.keys(finalData).length);

// Verify multiple districts
const testDistricts = ['Academy 20', 'Denver County 1', 'Adams 12 Five Star Schools'];
testDistricts.forEach(district => {
  if (finalData[district]) {
    console.log(`\n${district}:`);
    const enrollmentYears = finalData[district].enrollment_trends.map(e => e.year);
    console.log(`  Enrollment years: ${enrollmentYears.join(', ')}`);
    
    // Show sample data
    if (finalData[district].enrollment_trends.length > 0) {
      const first = finalData[district].enrollment_trends[0];
      const last = finalData[district].enrollment_trends[finalData[district].enrollment_trends.length - 1];
      console.log(`  First year: ${first.year} - ${first.enrollment} students, ${first.frl !== null ? first.frl + '% FRL' : 'no FRL'}`);
      console.log(`  Last year: ${last.year} - ${last.enrollment} students, ${last.frl !== null ? last.frl + '% FRL' : 'no FRL'}`);
    }
    
    const cmasYears = finalData[district].cmas_scores
      .filter(c => c.met_or_exceeded_pct !== null)
      .map(c => c.year);
    console.log(`  CMAS years: ${cmasYears.join(', ')}`);
  } else {
    console.log(`\n${district}: NOT FOUND`);
  }
});