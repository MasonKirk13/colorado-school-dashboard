const XLSX = require('xlsx');
const path = require('path');

console.log('Checking main FRL file for all years...\n');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Sheets in file:', workbook.SheetNames);
console.log('\nChecking each sheet for FRL data:\n');

workbook.SheetNames.forEach(sheetName => {
  if (sheetName.includes('Cheat Sheet')) return;
  
  console.log(`\n${sheetName}:`);
  
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Find header row
  let headerRow = -1;
  let headers = [];
  
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (row && row.some(cell => cell && cell.toString().toLowerCase().includes('organization'))) {
      headerRow = i;
      headers = row;
      break;
    }
  }
  
  if (headerRow >= 0) {
    console.log(`  Header row: ${headerRow}`);
    console.log(`  Headers: ${headers.slice(0, 12).join(' | ')}`);
    
    // Check for FRL columns
    const freeIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('free'));
    const reducedIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('reduced'));
    
    console.log(`  Free Lunch column: ${freeIdx >= 0 ? freeIdx + ' (' + headers[freeIdx] + ')' : 'NOT FOUND'}`);
    console.log(`  Reduced Lunch column: ${reducedIdx >= 0 ? reducedIdx + ' (' + headers[reducedIdx] + ')' : 'NOT FOUND'}`);
    
    // Check if columns have data
    if (freeIdx >= 0 && rawData.length > headerRow + 1) {
      let hasData = false;
      let sampleValue = null;
      
      for (let i = headerRow + 1; i < Math.min(headerRow + 20, rawData.length); i++) {
        const value = rawData[i][freeIdx];
        if (value !== undefined && value !== null && value !== '') {
          hasData = true;
          sampleValue = value;
          break;
        }
      }
      
      console.log(`  Has FRL data: ${hasData ? 'YES (sample: ' + sampleValue + ')' : 'NO - column empty'}`);
    }
  } else {
    console.log('  Could not find header row');
  }
});

// Check a specific district across years
console.log('\n\nChecking Denver County 1 FRL data across sheets:');
workbook.SheetNames.forEach(sheetName => {
  if (sheetName.includes('Cheat Sheet')) return;
  
  const year = sheetName.match(/(\d{4})/)?.[1];
  if (!year) return;
  
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  const denverRows = data.filter(row => {
    const org = row['Organization Name'] || row['ORGANIZATION_NAME'] || '';
    return org.includes('DENVER COUNTY 1');
  });
  
  if (denverRows.length > 0) {
    const firstRow = denverRows[0];
    const hasFreeLunch = firstRow['Free Lunch'] !== undefined || firstRow['FREE_LUNCH'] !== undefined;
    console.log(`  ${year}: ${denverRows.length} rows, has FRL columns: ${hasFreeLunch}`);
  }
});