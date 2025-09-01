#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the complete data
const dataPath = path.join(__dirname, '../public/district_data_complete.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Find districts with most CMAS years
const districtsWithYears = Object.entries(data)
  .map(([name, d]) => ({
    name,
    years: d.cmas_scores ? d.cmas_scores.length : 0,
    firstYear: d.cmas_scores && d.cmas_scores.length > 0 ? d.cmas_scores[0].year : null,
    lastYear: d.cmas_scores && d.cmas_scores.length > 0 ? d.cmas_scores[d.cmas_scores.length - 1].year : null
  }))
  .filter(d => d.years > 0)
  .sort((a, b) => b.years - a.years);

console.log('Districts with most CMAS years:\n');

districtsWithYears.slice(0, 5).forEach(d => {
  console.log(`${d.name}: ${d.years} years (${d.firstYear}-${d.lastYear})`);
  
  // Show all years for this district
  const district = data[d.name];
  console.log('  Years:', district.cmas_scores.map(s => s.year).join(', '));
  console.log();
});