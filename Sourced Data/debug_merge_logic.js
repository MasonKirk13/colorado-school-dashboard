#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the old CMAS data
const oldCmasData = JSON.parse(fs.readFileSync(path.join(__dirname, 'cmas_all_years_complete_fixed.json'), 'utf8'));

console.log('Checking case matching for DENVER COUNTY 1...\n');

// Create a test finalData object
const finalData = {
  "Denver County 1": {
    enrollment_trends: [],
    cmas_scores: []
  }
};

// Test the matching logic
const cmasDistrict = "DENVER COUNTY 1";
let matchedDistrict = cmasDistrict;

if (!finalData[cmasDistrict]) {
  console.log(`No exact match for "${cmasDistrict}"`);
  const lowerCMAS = cmasDistrict.toLowerCase();
  console.log(`Looking for case-insensitive match: "${lowerCMAS}"`);
  
  matchedDistrict = Object.keys(finalData).find(d => d.toLowerCase() === lowerCMAS);
  console.log(`Found match: "${matchedDistrict}"`);
}

// Show what districts exist
console.log('\nExisting districts in finalData:');
Object.keys(finalData).forEach(d => {
  console.log(`  "${d}" (lowercase: "${d.toLowerCase()}")`);
});

// Check what's in old CMAS
console.log('\nSample districts in old CMAS data:');
Object.keys(oldCmasData).slice(0, 5).forEach(d => {
  console.log(`  "${d}"`);
});