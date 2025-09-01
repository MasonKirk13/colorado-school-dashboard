#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

// Check the actual 2024 CMAS file
const file2024 = path.join(__dirname, 'General CMAS Score Data/2024 CMAS ELA and Math District and School Summary Results.xlsx');

try {
    const workbook = XLSX.readFile(file2024);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log('2024 CMAS file check:');
    console.log('Total rows:', data.length);
    console.log('First row columns:', Object.keys(data[0]));
    
    // Find percentage columns
    const firstRow = data[0];
    const percentCols = Object.keys(firstRow).filter(col => col.includes('%') || col.includes('Percent'));
    console.log('\nPercentage columns found:', percentCols);
    
    // Check some values
    const districtRows = data.filter(row => row['Level'] === 'DISTRICT' && row['Grade'] === 'All Grades');
    console.log('\nSample district values:');
    districtRows.slice(0, 3).forEach(row => {
        percentCols.forEach(col => {
            if (row[col]) {
                console.log(`${row['District Name']} - ${col}: ${row[col]}`);
            }
        });
    });
} catch (error) {
    console.error('Error:', error.message);
}