#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

// Check raw data structure
const file = path.join(__dirname, 'General CMAS Score Data/2024 CMAS ELA and Math District and School Summary Results.xlsx');

const workbook = XLSX.readFile(file);
const sheet = workbook.Sheets['CMAS ELA and Math'];

// Get raw data
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Find where headers start
let headerRow = -1;
rawData.forEach((row, index) => {
    if (row.includes('District Code') || row.includes('District Name') || row.includes('Level')) {
        console.log(`Found potential header row at index ${index}:`, row.slice(0, 10));
        if (headerRow === -1) headerRow = index;
    }
});

// Check data with found header row
if (headerRow >= 0) {
    console.log('\nUsing header row:', headerRow);
    const dataWithHeader = XLSX.utils.sheet_to_json(sheet, { range: headerRow });
    
    console.log('\nColumn names:', Object.keys(dataWithHeader[0]));
    
    // Find district rows
    const districtRows = dataWithHeader.filter(row => 
        row['Level'] === 'DISTRICT' && 
        row['Grade'] === 'All Grades' && 
        row['Content'] === 'ELA'
    );
    
    console.log(`\nFound ${districtRows.length} district ELA rows`);
    
    console.log('\nSample district rows:');
    districtRows.slice(0, 3).forEach(row => {
        // Look for percentage columns
        const percentCols = Object.keys(row).filter(col => 
            col.includes('Percent') || col.includes('%')
        );
        
        console.log({
            district: row['District Name'],
            subject: row['Content'],
            metPercent: row['Percent Met Expectations'],
            exceededPercent: row['Percent Exceeded Expectations'],
            percentCols: percentCols
        });
    });
}