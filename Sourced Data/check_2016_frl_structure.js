const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Demographic data/2016-17_PK-12_PupilMembership_bySchool_FRL_0.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Get raw data to see the structure
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('First 20 rows of 2016 FRL file:');
for (let i = 0; i < Math.min(20, rawData.length); i++) {
  if (rawData[i] && rawData[i].length > 0) {
    console.log(`Row ${i}:`, rawData[i].slice(0, 8));
  }
}

// Try to find the header row
let headerRow = -1;
for (let i = 0; i < 10; i++) {
  if (rawData[i] && rawData[i].some(cell => 
    cell && typeof cell === 'string' && 
    (cell.includes('ORGANIZATION') || cell.includes('DISTRICT') || cell.includes('SCHOOL'))
  )) {
    headerRow = i;
    console.log(`\nFound header row at index ${i}:`, rawData[i]);
    break;
  }
}