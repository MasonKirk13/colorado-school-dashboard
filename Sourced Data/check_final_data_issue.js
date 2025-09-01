#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/district_data_complete.json'), 'utf8'));

// Check a few districts for unusual CMAS values
console.log('Checking for any unusual CMAS values in final data:\n');

let issueCount = 0;
Object.entries(data).forEach(([district, districtData]) => {
    if (districtData.cmas_scores) {
        districtData.cmas_scores.forEach(score => {
            // Check if value exists and is a number
            if (score.met_or_exceeded_pct !== null && score.met_or_exceeded_pct !== undefined) {
                const value = parseFloat(score.met_or_exceeded_pct);
                if (value > 100 || value < 0 || isNaN(value)) {
                    issueCount++;
                    console.log(`Issue found: ${district} (${score.year}): ${score.met_or_exceeded_pct}`);
                }
            }
        });
    }
});

console.log(`\nTotal issues found: ${issueCount}`);

// Also check if there are any string values
console.log('\nChecking for non-numeric values:');
let stringCount = 0;
Object.entries(data).forEach(([district, districtData]) => {
    if (districtData.cmas_scores) {
        districtData.cmas_scores.forEach(score => {
            if (score.met_or_exceeded_pct !== null && 
                score.met_or_exceeded_pct !== undefined && 
                typeof score.met_or_exceeded_pct === 'string') {
                stringCount++;
                if (stringCount <= 5) {
                    console.log(`String value: ${district} (${score.year}): "${score.met_or_exceeded_pct}"`);
                }
            }
        });
    }
});
console.log(`Total string values: ${stringCount}`);