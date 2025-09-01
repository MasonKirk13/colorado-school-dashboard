const XLSX = require('xlsx');
const path = require('path');

// Check a specific truancy file
const file = '2022-2023_TruancyData.xlsx';
const filePath = path.join(__dirname, 'Attendance Data', file);

console.log(`Debugging ${file}...`);

const wb = XLSX.readFile(filePath);
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Look at the actual structure
console.log('\nFirst 15 rows:');
data.slice(0, 15).forEach((row, i) => {
  console.log(`Row ${i}:`, row.slice(0, 10));
});

// Find Denver rows
console.log('\nLooking for Denver rows...');
let found = 0;
for (let i = 0; i < data.length && found < 5; i++) {
  const row = data[i];
  if (row && row.some(cell => cell && cell.toString().includes('Denver'))) {
    console.log(`Row ${i}:`, row);
    found++;
  }
}