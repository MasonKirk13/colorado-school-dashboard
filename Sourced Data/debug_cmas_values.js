#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const file = path.join(__dirname, 'General CMAS Score Data/2024 CMAS ELA and Math District and School Summary Results.xlsx');

const workbook = XLSX.readFile(file);
const sheet = workbook.Sheets['CMAS ELA and Math'];

// Get raw data with header row 12
const dataWithHeader = XLSX.utils.sheet_to_json(sheet, { range: 12 });

// Check unique values in Level and Content
const levels = new Set();
const contents = new Set();
const grades = new Set();

dataWithHeader.forEach(row => {
    if (row['Level']) levels.add(row['Level']);
    if (row['Content']) contents.add(row['Content']);
    if (row['Grade']) grades.add(row['Grade']);
});

console.log('Unique Level values:', Array.from(levels));
console.log('Unique Content values:', Array.from(contents));
console.log('Unique Grade values:', Array.from(grades).slice(0, 10));

// Show first few rows
console.log('\nFirst 5 data rows:');
dataWithHeader.slice(0, 5).forEach((row, i) => {
    console.log(`Row ${i}:`, {
        level: row['Level'],
        content: row['Content'],
        grade: row['Grade'],
        district: row['District Name']
    });
});