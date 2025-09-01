#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

// Let's check how 2024 CMAS is being processed
const file = path.join(__dirname, 'General CMAS Score Data/2024 CMAS ELA and Math District and School Summary Results.xlsx');

const workbook = XLSX.readFile(file);
const sheet = workbook.Sheets['CMAS ELA and Math'];
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Find header row
let headerRowIndex = -1;
for (let i = 0; i < 40; i++) {
    if (rawData[i] && rawData[i].some(cell => cell && cell.toString() === 'Level')) {
        headerRowIndex = i;
        break;
    }
}

console.log('Header row found at index:', headerRowIndex);

const headers = rawData[headerRowIndex];
console.log('\nRelevant column indices:');
headers.forEach((h, idx) => {
    if (h && (
        h.toString().includes('Level') ||
        h.toString().includes('Grade') ||
        h.toString().includes('District') ||
        h.toString().includes('Content') ||
        h.toString().includes('Percent') ||
        h.toString().includes('2024')
    )) {
        console.log(`  [${idx}] ${h}`);
    }
});

// Get data with headers
const dataWithHeaders = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });

// Find Denver County 1 data
const denverData = dataWithHeaders.filter(row => 
    row['Level'] === 'DISTRICT' && 
    row['District Name'] && row['District Name'].includes('DENVER') &&
    row['Grade'] === 'All Grades'
);

console.log('\n\nDenver County 1 data:');
denverData.forEach(row => {
    console.log({
        content: row['Content'],
        percentMet: row['Percent Met Expectations'],
        percentExceeded: row['Percent Exceeded Expectations'],
        yearColumn2024: row['2024'],
        yearColumn2023: row['2023'],
        yearColumn2019: row['2019']
    });
});

// Check what values are in year columns
console.log('\n\nChecking year column values for ALL districts:');
const allDistricts = dataWithHeaders.filter(row => 
    row['Level'] === 'DISTRICT' && 
    row['Grade'] === 'All Grades' &&
    row['Content'] === 'English Language Arts'
);

console.log(`Found ${allDistricts.length} district ELA rows`);
console.log('\nFirst 5 districts:');
allDistricts.slice(0, 5).forEach(row => {
    console.log({
        district: row['District Name'],
        value2024: row['2024'],
        value2023: row['2023'],
        met: row['Percent Met Expectations'],
        exceeded: row['Percent Exceeded Expectations']
    });
});

// Check what the process_all_cmas_years.js would calculate
console.log('\n\nWhat the processing script sees:');
const metIdx = headers.findIndex(h => h && h.toString() === 'Percent Met Expectations');
const exceededIdx = headers.findIndex(h => h && h.toString() === 'Percent Exceeded Expectations');
console.log('Met index:', metIdx);
console.log('Exceeded index:', exceededIdx);

// Check for year columns
console.log('\nYear columns found:');
headers.forEach((h, idx) => {
    if (h && /^\d{4}$/.test(h.toString())) {
        console.log(`  Column ${idx}: "${h}"`);
    }
});