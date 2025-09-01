#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const file = path.join(__dirname, 'General CMAS Score Data/2024 CMAS ELA and Math District and School Summary Results.xlsx');

const workbook = XLSX.readFile(file);
const sheet = workbook.Sheets['CMAS ELA and Math'];

// Get data with proper header
const dataWithHeader = XLSX.utils.sheet_to_json(sheet, { range: 12 });

// Find district rows for both ELA and Math
const districtRows = dataWithHeader.filter(row => 
    row['Level'] === 'DISTRICT' && 
    row['Grade'] === 'All Grades' && 
    (row['Content'] === 'English Language Arts' || row['Content'] === 'Mathematics')
);

console.log(`Found ${districtRows.length} district rows for ELA and Math`);

// Check Denver County 1
const denverRows = districtRows.filter(row => row['District Name'].includes('DENVER'));
console.log('\nDenver rows:');
denverRows.forEach(row => {
    const metPercent = parseFloat(row['Percent Met Expectations']);
    const exceededPercent = parseFloat(row['Percent Exceeded Expectations']);
    const total = metPercent + exceededPercent;
    
    console.log({
        district: row['District Name'],
        content: row['Content'],
        met: metPercent,
        exceeded: exceededPercent,
        total: total
    });
});

// Check if there are any values over 100
console.log('\nChecking for values over 100:');
let overHundredCount = 0;
districtRows.forEach(row => {
    const metPercent = parseFloat(row['Percent Met Expectations']);
    const exceededPercent = parseFloat(row['Percent Exceeded Expectations']);
    const total = metPercent + exceededPercent;
    
    if (total > 100) {
        overHundredCount++;
        console.log(`${row['District Name']} - ${row['Content']}: ${total}%`);
    }
});
console.log(`Total districts with combined > 100%: ${overHundredCount}`);