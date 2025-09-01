#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/district_data_complete.json'), 'utf8'));

// Check CMAS values across districts
console.log('Checking CMAS values to find those above 100:\n');

let maxValue = 0;
let examplesAbove100 = [];

Object.entries(data).forEach(([district, districtData]) => {
    if (districtData.cmas_scores) {
        districtData.cmas_scores.forEach(score => {
            if (score.met_or_exceeded_pct && score.met_or_exceeded_pct > 100) {
                examplesAbove100.push({
                    district,
                    year: score.year,
                    value: score.met_or_exceeded_pct
                });
                if (score.met_or_exceeded_pct > maxValue) {
                    maxValue = score.met_or_exceeded_pct;
                }
            }
        });
    }
});

console.log(`Maximum CMAS value found: ${maxValue}`);
console.log(`\nExamples of values above 100:`);
examplesAbove100.slice(0, 10).forEach(ex => {
    console.log(`  ${ex.district} (${ex.year}): ${ex.value}`);
});

// Also check the raw CMAS data file
const cmasRaw = JSON.parse(fs.readFileSync(path.join(__dirname, 'cmas_complete_all_sources.json'), 'utf8'));
console.log('\n\nChecking raw CMAS data:');
const sampleDistrict = Object.keys(cmasRaw)[0];
console.log(`Sample district: ${sampleDistrict}`);
console.log(JSON.stringify(cmasRaw[sampleDistrict], null, 2));