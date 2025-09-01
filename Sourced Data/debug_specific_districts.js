#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/district_data_complete.json'), 'utf8'));

// Check a few specific districts
['Denver County 1', 'Adams 12 Five Star Schools', 'Jefferson County R-1'].forEach(districtName => {
    const district = data[districtName];
    if (district && district.cmas_scores) {
        console.log(`\n${districtName} CMAS scores:`);
        district.cmas_scores.forEach(score => {
            if (score.met_or_exceeded_pct !== null) {
                console.log(`  ${score.year}: ${score.met_or_exceeded_pct}%`);
            } else if (score.note) {
                console.log(`  ${score.year}: ${score.note}`);
            }
        });
    }
});