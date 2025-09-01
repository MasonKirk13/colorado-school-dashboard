const XLSX = require('xlsx');
const path = require('path');

console.log('Checking 2022-2023 file structure...\n');

const filePath = path.join(__dirname, 'Attendance Data/2022-2023_TruancyData.xlsx');

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
  for (let i = 0; i < Math.min(10, data.length); i++) {
    if (data[i] && data[i].some(cell => cell && cell.toString().includes('School Code'))) {
      headerRow = i;
      console.log(`Header row found at: ${i}`);
      console.log('Headers:', data[i]);
      break;
    }
  }
  
  // Check for Denver County 1
  let denverCount = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row[2] === 'Denver County 1') {
      denverCount++;
      if (denverCount <= 3) {
        console.log(`Denver school ${denverCount}:`, row.slice(0, 10));
      }
    }
  }
  console.log(`\nTotal Denver County 1 schools found: ${denverCount}`);
  
} catch (err) {
  console.log(`Error: ${err.message}`);
}