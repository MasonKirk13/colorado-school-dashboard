#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

const worksheet = workbook.Sheets['2016-2017 Data'];
const data = XLSX.utils.sheet_to_json(worksheet);

// Check Denver data
const denverRows = data.filter(row => {
    const name = row['Organization Name'];
    return name && name.includes('DENVER');
});

console.log('Sample Denver rows from 2016-2017:');
denverRows.slice(0, 3).forEach(row => {
    console.log({
        name: row['Organization Name'],
        enrollment: row['PK-12 Total'],
        free: row['Free Lunch'],
        reduced: row['Reduced Lunch'],
        paid: row['Paid Lunch']
    });
});