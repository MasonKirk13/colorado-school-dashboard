#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/district_data_complete.json'), 'utf8'));

// Get all unique years across all districts
const allYears = new Set();

Object.entries(data).forEach(([district, districtData]) => {
    if (districtData.enrollment_trends) {
        districtData.enrollment_trends.forEach(e => {
            allYears.add(e.year);
        });
    }
});

const sortedYears = Array.from(allYears).sort();
console.log('All enrollment years in data:');
console.log(sortedYears);

console.log('\nTotal unique years:', sortedYears.length);