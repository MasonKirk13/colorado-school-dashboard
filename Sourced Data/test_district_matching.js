#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load data sources
const geoData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/School_Districts.geojson'), 'utf8'));
const completeData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/district_data_complete.json'), 'utf8'));

console.log('Testing district name matching...\n');

// Test the matching logic
function getDistrictData(name, districtData) {
  // Direct match
  if (districtData[name]) return { match: name, type: 'direct' };
  
  // Remove " School District" suffix if present
  const cleanName = name.replace(/ School District$/i, '').trim();
  if (districtData[cleanName]) return { match: cleanName, type: 'suffix_removed' };
  
  // Try case-insensitive match
  const lowerName = cleanName.toLowerCase();
  const caseMatch = Object.keys(districtData).find(d => d.toLowerCase() === lowerName);
  if (caseMatch) return { match: caseMatch, type: 'case_insensitive' };
  
  // Fuzzy match
  const fuzzyMatch = Object.keys(districtData).find((d) => {
    const dLower = d.toLowerCase();
    return lowerName.includes(dLower) || dLower.includes(lowerName);
  });
  if (fuzzyMatch) return { match: fuzzyMatch, type: 'fuzzy' };
  
  return null;
}

// Test all districts
const results = {
  matched: 0,
  unmatched: [],
  matchTypes: {
    direct: 0,
    suffix_removed: 0,
    case_insensitive: 0,
    fuzzy: 0
  }
};

geoData.features.forEach(feature => {
  const geoName = feature.properties.lgname;
  const match = getDistrictData(geoName, completeData);
  
  if (match) {
    results.matched++;
    results.matchTypes[match.type]++;
  } else {
    results.unmatched.push(geoName);
  }
});

console.log('=== MATCHING RESULTS ===');
console.log(`Total districts in map: ${geoData.features.length}`);
console.log(`Successfully matched: ${results.matched}`);
console.log(`Failed to match: ${results.unmatched.length}\n`);

console.log('Match types:');
Object.entries(results.matchTypes).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

if (results.unmatched.length > 0) {
  console.log('\n=== UNMATCHED DISTRICTS ===');
  results.unmatched.sort().forEach(name => {
    console.log(`  - ${name}`);
  });
  
  // Try to find potential matches for unmatched
  console.log('\n=== SEARCHING FOR POTENTIAL MATCHES ===');
  results.unmatched.forEach(geoName => {
    const cleanGeo = geoName.replace(/ School District$/i, '').trim();
    const geoWords = cleanGeo.toLowerCase().split(/\s+/);
    
    // Find best match
    let bestMatch = null;
    let bestScore = 0;
    
    Object.keys(completeData).forEach(dataName => {
      const dataWords = dataName.toLowerCase().split(/\s+/);
      let score = 0;
      
      // Count matching words
      geoWords.forEach(geoWord => {
        if (dataWords.some(dataWord => 
          geoWord === dataWord || 
          (geoWord.length > 3 && dataWord.includes(geoWord)) ||
          (dataWord.length > 3 && geoWord.includes(dataWord))
        )) {
          score++;
        }
      });
      
      // Bonus for same first word
      if (geoWords[0] === dataWords[0]) score += 2;
      
      // Normalize by total words
      score = score / Math.max(geoWords.length, dataWords.length);
      
      if (score > bestScore && score > 0.4) {
        bestScore = score;
        bestMatch = dataName;
      }
    });
    
    if (bestMatch) {
      console.log(`  "${cleanGeo}" -> "${bestMatch}" (score: ${bestScore.toFixed(2)})`);
    } else {
      console.log(`  "${cleanGeo}" -> NO MATCH FOUND`);
    }
  });
}

// Save detailed report
fs.writeFileSync(
  path.join(__dirname, 'district_matching_test.json'),
  JSON.stringify({
    summary: {
      totalInMap: geoData.features.length,
      matched: results.matched,
      unmatched: results.unmatched.length
    },
    matchTypes: results.matchTypes,
    unmatchedDistricts: results.unmatched
  }, null, 2)
);

console.log('\n=== Report saved to district_matching_test.json ===');