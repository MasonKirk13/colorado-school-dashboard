#!/usr/bin/env node

/**
 * Inspect the enrollment data file to understand its structure
 */

const XLSX = require('xlsx');
const path = require('path');

function inspectEnrollmentData() {
    const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
    console.log(`Inspecting enrollment data: ${filePath}\n`);
    
    try {
        const workbook = XLSX.readFile(filePath);
        
        // List all sheets
        console.log('Available sheets:', workbook.SheetNames);
        console.log('\n');
        
        // Examine first sheet
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        
        // Get raw data to find headers
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Show first few rows
        console.log(`First 10 rows of sheet "${firstSheet}":`);
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
            console.log(`Row ${i}:`, rawData[i].slice(0, 10)); // First 10 columns
        }
        
        // Try to parse with headers
        const data = XLSX.utils.sheet_to_json(worksheet);
        if (data.length > 0) {
            console.log('\nColumn headers found:');
            console.log(Object.keys(data[0]));
            
            console.log('\nSample data (first 3 rows):');
            data.slice(0, 3).forEach((row, idx) => {
                console.log(`\nRow ${idx + 1}:`);
                Object.entries(row).slice(0, 8).forEach(([key, value]) => {
                    console.log(`  ${key}: ${value}`);
                });
            });
        }
        
    } catch (error) {
        console.error('Error reading file:', error.message);
    }
}

inspectEnrollmentData();