#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load all data sources
const cmasMultiYear = JSON.parse(fs.readFileSync(path.join(__dirname, 'cmas_district_simplified_multi_year.json'), 'utf8'));
const cmasOld = JSON.parse(fs.readFileSync(path.join(__dirname, 'cmas_all_years_complete_fixed.json'), 'utf8'));
const finalData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/district_data_complete.json'), 'utf8'));

console.log('Tracing Denver County data...\n');

// Check multi-year file
console.log('In cmas_district_simplified_multi_year.json:');
const denverMulti = Object.entries(cmasMultiYear).find(([k, v]) => k.toLowerCase().includes('denver'));
if (denverMulti) {
  console.log(`  Key: "${denverMulti[0]}"`);
  console.log('  Years:', denverMulti[1].cmas_scores.map(s => s.year).join(', '));
}

// Check old CMAS file
console.log('\nIn cmas_all_years_complete_fixed.json:');
const denverOld = Object.entries(cmasOld).find(([k, v]) => k.toLowerCase().includes('denver'));
if (denverOld) {
  console.log(`  Key: "${denverOld[0]}"`);
  console.log('  Years:', denverOld[1].cmas_scores.map(s => s.year).join(', '));
  console.log('  All scores:', denverOld[1].cmas_scores);
}

// Check final merged data
console.log('\nIn district_data_complete.json:');
const denverFinal = Object.entries(finalData).find(([k, v]) => k.toLowerCase().includes('denver'));
if (denverFinal) {
  console.log(`  Key: "${denverFinal[0]}"`);
  console.log('  Years:', denverFinal[1].cmas_scores.map(s => s.year).join(', '));
  console.log('  First few scores:', denverFinal[1].cmas_scores.slice(0, 5));
}