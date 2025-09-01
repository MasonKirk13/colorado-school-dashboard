const XLSX = require('xlsx');
const path = require('path');

console.log('Inspecting 2016 CMAS file structure...\n');

const filePath = path.join(__dirname, 'General CMAS Score Data/2016 ELA Math District and School Summary final.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Sheet names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n\nSheet: ${sheetName}`);
  console.log('='.repeat(50));
  
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Show first 20 rows
  console.log('First 20 rows:');
  for (let i = 0; i < Math.min(20, rawData.length); i++) {
    const row = rawData[i];
    if (row && row.length > 0) {
      console.log(`Row ${i}:`, row.slice(0, 10).map(cell => 
        cell === undefined || cell === null ? '[empty]' : 
        typeof cell === 'string' && cell.length > 20 ? cell.substring(0, 20) + '...' : 
        cell
      ));
    }
  }
  
  // Find Level column and look for DISTRICT rows
  let levelCol = -1;
  let headerRow = -1;
  
  for (let i = 0; i < 10; i++) {
    if (rawData[i] && rawData[i][0] === 'Level') {
      levelCol = 0;
      headerRow = i;
      console.log(`\nFound header row at index ${i}`);
      console.log('Headers:', rawData[i]);
      break;
    }
  }
  
  if (headerRow !== -1) {
    // Count DISTRICT rows
    let districtCount = 0;
    for (let i = headerRow + 1; i < rawData.length; i++) {
      if (rawData[i] && rawData[i][0] === 'DISTRICT') {
        districtCount++;
        if (districtCount <= 3) {
          console.log(`\nSample DISTRICT row ${districtCount}:`, rawData[i]);
        }
      }
    }
    console.log(`\nTotal DISTRICT rows found: ${districtCount}`);
  }
});