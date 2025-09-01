#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

['2016-2017 Data', '2017-2018 Data', '2018-2019 Data'].forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length > 0) {
        console.log(`\n${sheetName} columns:`);
        console.log(Object.keys(data[0]).filter(col => col.includes('Lunch') || col.includes('lunch') || col.includes('FRL')));
    }
});