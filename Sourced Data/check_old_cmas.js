#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Check the raw CMAS data
const cmasData = JSON.parse(fs.readFileSync(path.join(__dirname, 'cmas_complete_all_sources.json'), 'utf8'));

// Check Denver
const denver = cmasData['DENVER COUNTY 1'] || cmasData['Denver County 1'];
if (denver) {
    console.log('Denver CMAS in raw file:');
    console.log(JSON.stringify(denver, null, 2));
}

// Check how many districts have 2016-2018 data
let has2016 = 0, has2017 = 0, has2018 = 0;
Object.entries(cmasData).forEach(([district, data]) => {
    if (data.cmas_scores) {
        data.cmas_scores.forEach(score => {
            if (score.year === '2016') has2016++;
            if (score.year === '2017') has2017++;
            if (score.year === '2018') has2018++;
        });
    }
});

console.log('\n\nDistricts with data by year:');
console.log(`2016: ${has2016} districts`);
console.log(`2017: ${has2017} districts`);
console.log(`2018: ${has2018} districts`);