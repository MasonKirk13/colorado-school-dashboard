#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Searching for all districts in 2019-2020 and earlier:\n');

['2019-2020 Data', '2018-2019 Data', '2017-2018 Data', '2016-2017 Data', '2015-2016 Data', '2014-2015 Data'].forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // Get all unique district names
    const districtNames = new Set();
    data.forEach(row => {
        const name = row['Organization Name'];
        if (name && name !== '9999') {
            districtNames.add(name);
        }
    });
    
    console.log(`\n${sheetName} - Total districts: ${districtNames.size}`);
    console.log('Districts containing "Denver":');
    
    Array.from(districtNames).sort().forEach(name => {
        if (name.toLowerCase().includes('denver')) {
            console.log(`  - "${name}"`);
        }
    });
});