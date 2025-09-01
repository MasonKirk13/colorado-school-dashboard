#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Searching for Denver County 1 across all years:\n');

workbook.SheetNames.forEach(sheetName => {
    if (sheetName.includes('Cheat Sheet')) return;
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // Search for Denver County 1
    const denverRows = data.filter(row => {
        const name = row['Organization Name'];
        return name && name.includes('Denver');
    });
    
    if (denverRows.length > 0) {
        console.log(`${sheetName}:`);
        // Get unique district names
        const uniqueNames = [...new Set(denverRows.map(r => r['Organization Name']))];
        uniqueNames.forEach(name => {
            console.log(`  - "${name}"`);
        });
    }
});