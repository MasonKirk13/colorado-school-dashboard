#!/usr/bin/env node

/**
 * Create complete CMAS data by properly merging all sources
 */

const fs = require('fs');
const path = require('path');

// Load both CMAS data sources
const multiYear = JSON.parse(fs.readFileSync(path.join(__dirname, 'cmas_district_simplified_multi_year.json'), 'utf8'));
const oldYears = JSON.parse(fs.readFileSync(path.join(__dirname, 'cmas_all_years_complete_fixed.json'), 'utf8'));

console.log('Creating complete CMAS data...\n');

// Create a comprehensive map of all CMAS data
const completeData = {};

// First process old years data
Object.entries(oldYears).forEach(([district, data]) => {
  completeData[district] = {
    cmas_scores: [...(data.cmas_scores || [])]
  };
});

// Then merge in multi-year data
Object.entries(multiYear).forEach(([district, data]) => {
  if (!completeData[district]) {
    completeData[district] = { cmas_scores: [] };
  }
  
  // Create a map of existing years
  const yearMap = new Map();
  completeData[district].cmas_scores.forEach(score => {
    yearMap.set(score.year, score);
  });
  
  // Add/update with multi-year data
  data.cmas_scores.forEach(score => {
    // For 2021, prefer the COVID message over 0%
    if (score.year === '2021' && score.met_or_exceeded_pct === 0) {
      if (!yearMap.has('2021') || yearMap.get('2021').note) {
        return; // Skip if we already have COVID message
      }
    }
    yearMap.set(score.year, score);
  });
  
  // Convert back to array and sort
  completeData[district].cmas_scores = Array.from(yearMap.values())
    .sort((a, b) => a.year.localeCompare(b.year));
});

// Add 2018 as missing (no data file) and ensure 2020 has COVID message
Object.values(completeData).forEach(district => {
  const yearMap = new Map();
  district.cmas_scores.forEach(score => {
    yearMap.set(score.year, score);
  });
  
  // Ensure 2020 has COVID message
  if (!yearMap.has('2020')) {
    yearMap.set('2020', {
      year: '2020',
      met_or_exceeded_pct: null,
      note: 'No testing due to COVID-19'
    });
  }
  
  // Sort and reassign
  district.cmas_scores = Array.from(yearMap.values())
    .sort((a, b) => a.year.localeCompare(b.year));
});

// Save the complete data
const outputPath = path.join(__dirname, 'cmas_complete_all_sources.json');
fs.writeFileSync(outputPath, JSON.stringify(completeData, null, 2));

console.log(`Saved to: ${outputPath}`);
console.log(`Total districts: ${Object.keys(completeData).length}`);

// Show sample
const sample = Object.entries(completeData).find(([name, d]) => 
  d.cmas_scores.some(s => s.year === '2016') &&
  d.cmas_scores.some(s => s.year === '2024')
);

if (sample) {
  console.log(`\nSample district with full range (${sample[0]}):`);
  sample[1].cmas_scores.forEach(score => {
    const value = score.met_or_exceeded_pct !== null ? 
      `${score.met_or_exceeded_pct}%` : 
      score.note || 'No data';
    console.log(`  ${score.year}: ${value}`);
  });
}