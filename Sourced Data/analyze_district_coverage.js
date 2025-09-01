#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Analyzing Colorado District Data Coverage...\n');

// Load all data sources
const geoData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/School_Districts.geojson'), 'utf8'));
const completeData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/district_data_complete.json'), 'utf8'));
const enrollmentExcel = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const cmasComplete = JSON.parse(fs.readFileSync(path.join(__dirname, 'cmas_complete_all_sources.json'), 'utf8'));

// Get all districts from GeoJSON
const geoDistricts = new Set();
geoData.features.forEach(feature => {
  if (feature.properties && feature.properties.lgname) {
    geoDistricts.add(feature.properties.lgname);
  }
});

// Get all districts from our complete data
const dataDistricts = new Set(Object.keys(completeData));

// Get all districts from CMAS
const cmasDistricts = new Set(Object.keys(cmasComplete));

// Analyze coverage
console.log('=== SUMMARY ===');
console.log(`Total districts in map (GeoJSON): ${geoDistricts.size}`);
console.log(`Total districts with data: ${dataDistricts.size}`);
console.log(`Total districts in CMAS: ${cmasDistricts.size}\n`);

// Find districts in map but not in data
const missingFromData = [];
geoDistricts.forEach(district => {
  if (!dataDistricts.has(district)) {
    missingFromData.push(district);
  }
});

console.log('=== DISTRICTS IN MAP BUT NO DATA ===');
console.log(`Count: ${missingFromData.length}`);
if (missingFromData.length > 0) {
  console.log('\nMissing districts:');
  missingFromData.sort().forEach(d => console.log(`  - ${d}`));
}

// Check for fuzzy matches
console.log('\n=== CHECKING FOR POTENTIAL NAME MISMATCHES ===');
const potentialMatches = [];

missingFromData.forEach(geoName => {
  const geoLower = geoName.toLowerCase();
  
  // Check against data districts
  dataDistricts.forEach(dataName => {
    const dataLower = dataName.toLowerCase();
    
    // Check various matching strategies
    if (
      // Partial match
      (geoLower.includes(dataLower) || dataLower.includes(geoLower)) ||
      // Same first word
      (geoLower.split(' ')[0] === dataLower.split(' ')[0]) ||
      // Similar length and some overlap
      (Math.abs(geoName.length - dataName.length) < 5 && 
       geoLower.split(' ').some(word => dataLower.includes(word)))
    ) {
      potentialMatches.push({
        geoName,
        dataName,
        similarity: calculateSimilarity(geoLower, dataLower)
      });
    }
  });
  
  // Also check against CMAS districts
  cmasDistricts.forEach(cmasName => {
    const cmasLower = cmasName.toLowerCase();
    
    if (
      (geoLower.includes(cmasLower) || cmasLower.includes(geoLower)) ||
      (geoLower.split(' ')[0] === cmasLower.split(' ')[0])
    ) {
      potentialMatches.push({
        geoName,
        cmasName,
        source: 'CMAS',
        similarity: calculateSimilarity(geoLower, cmasLower)
      });
    }
  });
});

// Sort by similarity and show best matches
const uniqueMatches = {};
potentialMatches.forEach(match => {
  const key = match.geoName;
  if (!uniqueMatches[key] || uniqueMatches[key].similarity < match.similarity) {
    uniqueMatches[key] = match;
  }
});

console.log('\nPotential name mismatches found:');
Object.values(uniqueMatches)
  .sort((a, b) => b.similarity - a.similarity)
  .forEach(match => {
    if (match.dataName) {
      console.log(`  "${match.geoName}" might be "${match.dataName}" (similarity: ${match.similarity.toFixed(2)})`);
    } else if (match.cmasName) {
      console.log(`  "${match.geoName}" found in CMAS as "${match.cmasName}" (similarity: ${match.similarity.toFixed(2)})`);
    }
  });

// Check data quality
console.log('\n=== DATA QUALITY CHECK ===');
let noEnrollment = 0;
let noCMAS = 0;
let noFRL = 0;
let hasAllData = 0;

dataDistricts.forEach(district => {
  const data = completeData[district];
  
  if (!data.enrollment_trends || data.enrollment_trends.length === 0) {
    noEnrollment++;
  }
  
  if (!data.cmas_scores || data.cmas_scores.length === 0) {
    noCMAS++;
  }
  
  if (data.enrollment_trends && data.enrollment_trends.length > 0) {
    const hasFRL = data.enrollment_trends.some(e => e.frl !== null && e.frl !== 0);
    if (!hasFRL) {
      noFRL++;
    }
  }
  
  if (data.enrollment_trends && data.enrollment_trends.length > 0 &&
      data.cmas_scores && data.cmas_scores.length > 0) {
    hasAllData++;
  }
});

console.log(`Districts with no enrollment data: ${noEnrollment}`);
console.log(`Districts with no CMAS data: ${noCMAS}`);
console.log(`Districts with no FRL data: ${noFRL}`);
console.log(`Districts with complete data: ${hasAllData}`);

// Simple similarity calculation
function calculateSimilarity(str1, str2) {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  let matches = 0;
  words1.forEach(w1 => {
    if (words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))) {
      matches++;
    }
  });
  
  return matches / Math.max(words1.length, words2.length);
}

// Write detailed report
const report = {
  summary: {
    totalInMap: geoDistricts.size,
    totalWithData: dataDistricts.size,
    totalInCMAS: cmasDistricts.size,
    missingFromData: missingFromData.length
  },
  missingDistricts: missingFromData.sort(),
  potentialMatches: Object.values(uniqueMatches).sort((a, b) => b.similarity - a.similarity),
  dataQuality: {
    noEnrollment,
    noCMAS,
    noFRL,
    hasAllData
  }
};

fs.writeFileSync(
  path.join(__dirname, 'district_coverage_report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n=== Report saved to district_coverage_report.json ===');