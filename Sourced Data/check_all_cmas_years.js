#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/district_data_complete.json'), 'utf8'));

// Check Denver's full CMAS data
const denver = data['Denver County 1'];
if (denver) {
    console.log('Denver County 1 CMAS scores (all years):');
    denver.cmas_scores.forEach(score => {
        console.log(`  ${score.year}: ${score.met_or_exceeded_pct !== null ? score.met_or_exceeded_pct + '%' : score.note || 'No data'}`);
    });
}

// Check if any values are above 60
console.log('\n\nChecking for any CMAS values above 60%:');
let highCount = 0;
Object.entries(data).forEach(([district, districtData]) => {
    if (districtData.cmas_scores) {
        districtData.cmas_scores.forEach(score => {
            if (score.met_or_exceeded_pct && score.met_or_exceeded_pct > 60) {
                highCount++;
                if (highCount <= 5) {
                    console.log(`  ${district} (${score.year}): ${score.met_or_exceeded_pct}%`);
                }
            }
        });
    }
});
console.log(`Total districts with scores > 60%: ${highCount}`);