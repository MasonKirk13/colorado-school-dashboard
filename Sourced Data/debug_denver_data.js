#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/district_data_complete.json'), 'utf8'));

// Check Denver County 1
const denver = data['Denver County 1'];
if (denver) {
    console.log('Denver County 1 full data structure:');
    console.log(JSON.stringify(denver, null, 2));
} else {
    console.log('Denver County 1 not found!');
    // Try to find similar names
    const denverLike = Object.keys(data).filter(k => k.toLowerCase().includes('denver'));
    console.log('\nDistricts containing "denver":', denverLike);
}