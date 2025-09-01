#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

// Check the 2024 CMAS file
const file2024 = path.join(__dirname, 'General CMAS Score Data/2024_PRELIMINARY_CMAS District and School Achievement Results_ELA and Math.xlsx');

try {
    const workbook = XLSX.readFile(file2024);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log('2024 CMAS file structure:');
    console.log('Columns:', Object.keys(data[0]));
    
    // Find some sample values
    console.log('\nSample rows:');
    const districtRows = data.filter(row => row['Level'] === 'DISTRICT' && row['Subject'] === 'ELA');
    districtRows.slice(0, 5).forEach(row => {
        console.log({
            district: row['District Name'],
            grade: row['Grade'],
            value: row['2024 % Met or Exceeded Expectations']
        });
    });
} catch (error) {
    console.error('Error:', error.message);
}