#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Excel file sheets:');
workbook.SheetNames.forEach((sheet, index) => {
    console.log(`${index + 1}. "${sheet}"`);
    
    // Check first few rows to understand structure
    const worksheet = workbook.Sheets[sheet];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length > 0) {
        console.log(`   Sample columns: ${Object.keys(data[0]).slice(0, 5).join(', ')}`);
        console.log(`   Total rows: ${data.length}`);
    }
    console.log('');
});