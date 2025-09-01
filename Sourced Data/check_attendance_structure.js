const XLSX = require('xlsx');
const path = require('path');

// Check the structure of attendance files
const files = [
  '2022-2023_ChronicAbsenteeism.xlsx',
  '2021-2022_ChronicAbsenteeism.xlsx',
  '2023-2024 Chronic Absenteeism by School - Suppressed.xlsx'
];

files.forEach(file => {
  console.log(`\n=== ${file} ===`);
  const filePath = path.join(__dirname, 'Attendance Data', file);
  
  try {
    const wb = XLSX.readFile(filePath);
    console.log('Sheet names:', wb.SheetNames);
    
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log('Total rows:', data.length);
    console.log('\nFirst 5 rows:');
    data.slice(0, 5).forEach((row, i) => {
      if (row && row.length > 0) {
        console.log(`Row ${i}: [${row.slice(0, 8).map(c => c || '').join(' | ')}]`);
      }
    });
    
    // Look for Denver
    let denverCount = 0;
    data.forEach(row => {
      if (row && row.some(cell => cell && cell.toString().toLowerCase().includes('denver'))) {
        denverCount++;
      }
    });
    console.log(`\nRows containing "Denver": ${denverCount}`);
    
  } catch (err) {
    console.log('Error:', err.message);
  }
});