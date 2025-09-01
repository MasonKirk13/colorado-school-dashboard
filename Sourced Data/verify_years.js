#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/district_data_complete.json'), 'utf8'));

// Check Denver County 1
const denver = data['Denver County 1'];
if (denver) {
    console.log('Denver County 1 enrollment years:');
    denver.enrollment_trends.forEach(e => {
        console.log(`  ${e.year}: ${e.enrollment} students, ${e.frl}% FRL`);
    });
    
    console.log('\nDenver County 1 CMAS years:');
    denver.cmas_scores.forEach(c => {
        console.log(`  ${c.year}: ${c.met_or_exceeded_pct ? c.met_or_exceeded_pct + '%' : c.note || 'N/A'}`);
    });
}

// Check another district
const adams = data['Adams 12 Five Star Schools'];
if (adams) {
    console.log('\n\nAdams 12 Five Star Schools enrollment years:');
    adams.enrollment_trends.forEach(e => {
        console.log(`  ${e.year}: ${e.enrollment} students, ${e.frl}% FRL`);
    });
}