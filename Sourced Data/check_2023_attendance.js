const XLSX = require('xlsx');
const path = require('path');

console.log('Checking 2023-2024 Attendance file structure...\n');

const filePath = path.join(__dirname, 'Attendance Data/2023-2024 Attendance and Truancy Rates by School - Suppressed.xlsx');

try {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log('First 10 rows:');
  for (let i = 0; i < Math.min(10, data.length); i++) {
    console.log(`Row ${i}:`, data[i]);
  }
  
  // Find header row
  let headerRow = -1;
  for (let i = 0; i < Math.min(5, data.length); i++) {
    if (data[i] && data[i].some(cell => cell && cell.toString().includes('School Code'))) {
      headerRow = i;
      break;
    }
  }
  
  console.log(`\nHeader row found at: ${headerRow}`);
  if (headerRow >= 0) {
    console.log('Headers:', data[headerRow]);
  }
  
  // Check for Denver data
  let denverCount = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row[4] === 'Denver County 1') {
      denverCount++;
      if (denverCount <= 5) {
        console.log(`Denver school ${denverCount}:`, row);
      }
    }
  }
  console.log(`\nTotal Denver schools found: ${denverCount}`);
  
} catch (err) {
  console.log(`Error: ${err.message}`);
}