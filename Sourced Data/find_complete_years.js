#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the complete data
const dataPath = path.join(__dirname, '../public/district_data_complete.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Find districts with 2016-2017 data
const districtsWithOldYears = Object.entries(data)
  .filter(([name, d]) => {
    if (!d.cmas_scores || d.cmas_scores.length === 0) return false;
    const years = d.cmas_scores.map(s => s.year);
    return years.includes('2016') || years.includes('2017');
  })
  .map(([name, d]) => ({
    name,
    years: d.cmas_scores.map(s => s.year).join(', ')
  }));

console.log('Districts with 2016 or 2017 data:\n');
if (districtsWithOldYears.length === 0) {
  console.log('None found!');
} else {
  districtsWithOldYears.slice(0, 10).forEach(d => {
    console.log(`${d.name}: ${d.years}`);
  });
  console.log(`\nTotal: ${districtsWithOldYears.length} districts`);
}