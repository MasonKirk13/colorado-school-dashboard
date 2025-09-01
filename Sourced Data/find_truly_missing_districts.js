#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

console.log('Finding districts that truly have no data...\n');

// Load all data sources
const geoData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/School_Districts.geojson'), 'utf8'));
const completeData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/district_data_complete.json'), 'utf8'));
const nameMapping = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/district_name_mapping.json'), 'utf8'));

// Also check raw data files
const enrollmentFile = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const enrollmentWorkbook = XLSX.readFile(enrollmentFile);

// Get all unique districts from enrollment data
const enrollmentDistricts = new Set();
enrollmentWorkbook.SheetNames.forEach(sheetName => {
  if (sheetName.includes('Cheat Sheet')) return;
  
  const worksheet = enrollmentWorkbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  data.forEach(row => {
    const districtName = row['Organization Name'];
    if (districtName && districtName !== '9999') {
      enrollmentDistricts.add(districtName);
    }
  });
});

// Function to match district names
function getDistrictData(name, districtData, mapping) {
  // Check manual mapping first
  if (mapping[name]) {
    const mappedName = mapping[name];
    if (mappedName && districtData[mappedName]) return mappedName;
  }
  
  // Direct match
  if (districtData[name]) return name;
  
  // Remove " School District" suffix if present
  const cleanName = name.replace(/ School District$/i, '').trim();
  if (districtData[cleanName]) return cleanName;
  
  // Try case-insensitive match
  const lowerName = cleanName.toLowerCase();
  const caseMatch = Object.keys(districtData).find(d => d.toLowerCase() === lowerName);
  if (caseMatch) return caseMatch;
  
  // Fuzzy match
  const fuzzyMatch = Object.keys(districtData).find((d) => {
    const dLower = d.toLowerCase();
    return lowerName.includes(dLower) || dLower.includes(lowerName);
  });
  return fuzzyMatch;
}

// Analyze each district in the map
const results = {
  hasData: [],
  noData: [],
  notInEnrollment: [],
  mappingIssues: []
};

geoData.features.forEach(feature => {
  const geoName = feature.properties.lgname;
  const match = getDistrictData(geoName, completeData, nameMapping);
  
  if (match) {
    const data = completeData[match];
    const hasEnrollment = data.enrollment_trends && data.enrollment_trends.length > 0;
    const hasCMAS = data.cmas_scores && data.cmas_scores.length > 0;
    
    results.hasData.push({
      geoName,
      dataName: match,
      hasEnrollment,
      hasCMAS,
      enrollmentYears: hasEnrollment ? data.enrollment_trends.length : 0,
      cmasYears: hasCMAS ? data.cmas_scores.length : 0
    });
  } else {
    // Check if it's in the raw enrollment data
    const cleanName = geoName.replace(/ School District$/i, '').trim();
    const inEnrollment = Array.from(enrollmentDistricts).some(d => 
      d.toLowerCase() === cleanName.toLowerCase() ||
      d.toLowerCase().includes(cleanName.toLowerCase()) ||
      cleanName.toLowerCase().includes(d.toLowerCase())
    );
    
    if (inEnrollment) {
      results.mappingIssues.push({
        geoName,
        note: 'Found in enrollment data but not in merged data'
      });
    } else {
      results.noData.push(geoName);
    }
  }
});

// Summary
console.log('=== SUMMARY ===');
console.log(`Total districts in map: ${geoData.features.length}`);
console.log(`Districts with data: ${results.hasData.length}`);
console.log(`Districts with no data: ${results.noData.length}`);
console.log(`Districts with mapping issues: ${results.mappingIssues.length}\n`);

// Show districts with no data
if (results.noData.length > 0) {
  console.log('=== DISTRICTS WITH NO DATA ===');
  results.noData.sort().forEach(name => {
    console.log(`  - ${name}`);
  });
}

// Show mapping issues
if (results.mappingIssues.length > 0) {
  console.log('\n=== DISTRICTS WITH MAPPING ISSUES ===');
  results.mappingIssues.forEach(issue => {
    console.log(`  - ${issue.geoName}: ${issue.note}`);
  });
}

// Data quality summary
console.log('\n=== DATA QUALITY SUMMARY ===');
let bothData = 0;
let enrollmentOnly = 0;
let cmasOnly = 0;

results.hasData.forEach(d => {
  if (d.hasEnrollment && d.hasCMAS) bothData++;
  else if (d.hasEnrollment) enrollmentOnly++;
  else if (d.hasCMAS) cmasOnly++;
});

console.log(`Districts with both enrollment and CMAS: ${bothData}`);
console.log(`Districts with enrollment only: ${enrollmentOnly}`);
console.log(`Districts with CMAS only: ${cmasOnly}`);

// Check enrollment file for unmatched districts
console.log('\n=== CHECKING ENROLLMENT FILE ===');
console.log(`Total unique districts in enrollment file: ${enrollmentDistricts.size}`);

// Save detailed report
fs.writeFileSync(
  path.join(__dirname, 'truly_missing_districts.json'),
  JSON.stringify({
    summary: {
      totalInMap: geoData.features.length,
      withData: results.hasData.length,
      noData: results.noData.length,
      mappingIssues: results.mappingIssues.length
    },
    districtsWithNoData: results.noData,
    mappingIssues: results.mappingIssues,
    dataQuality: {
      bothData,
      enrollmentOnly,
      cmasOnly
    }
  }, null, 2)
);

console.log('\n=== Report saved to truly_missing_districts.json ===');