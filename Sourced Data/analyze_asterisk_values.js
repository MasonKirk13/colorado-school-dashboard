const XLSX = require('xlsx');
const path = require('path');

console.log('Analyzing "*" values in FRL data...\n');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

const yearsToCheck = ['2020-2021', '2021-2022', '2022-2023'];

yearsToCheck.forEach(yearSheet => {
  const sheetName = `${yearSheet} Data`;
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`\n${yearSheet}:`);
  console.log('='.repeat(50));
  
  let totalRows = 0;
  let rowsWithAsteriskFree = 0;
  let rowsWithAsteriskReduced = 0;
  let rowsWithValidFree = 0;
  let rowsWithValidReduced = 0;
  
  data.forEach(row => {
    totalRows++;
    
    const free = row['Free Lunch'];
    const reduced = row['Reduced Lunch'];
    
    // Check free lunch
    if (free === '*') {
      rowsWithAsteriskFree++;
    } else if (typeof free === 'number' || (!isNaN(parseFloat(free)) && free !== '')) {
      rowsWithValidFree++;
    }
    
    // Check reduced lunch
    if (reduced === '*') {
      rowsWithAsteriskReduced++;
    } else if (typeof reduced === 'number' || (!isNaN(parseFloat(reduced)) && reduced !== '')) {
      rowsWithValidReduced++;
    }
  });
  
  console.log(`Total rows: ${totalRows}`);
  console.log(`Rows with "*" in Free Lunch: ${rowsWithAsteriskFree} (${Math.round(rowsWithAsteriskFree/totalRows*100)}%)`);
  console.log(`Rows with valid Free Lunch: ${rowsWithValidFree} (${Math.round(rowsWithValidFree/totalRows*100)}%)`);
  console.log(`Rows with "*" in Reduced Lunch: ${rowsWithAsteriskReduced} (${Math.round(rowsWithAsteriskReduced/totalRows*100)}%)`);
  console.log(`Rows with valid Reduced Lunch: ${rowsWithValidReduced} (${Math.round(rowsWithValidReduced/totalRows*100)}%)`);
  
  // Check specific districts
  console.log('\nSample district analysis:');
  ['Denver County 1', 'Academy 20', 'Cherry Creek 5'].forEach(districtName => {
    const districtRows = data.filter(row => row['Organization Name'] === districtName);
    if (districtRows.length > 0) {
      let validCount = 0;
      let asteriskCount = 0;
      
      districtRows.forEach(row => {
        if (row['Free Lunch'] === '*' || row['Reduced Lunch'] === '*') {
          asteriskCount++;
        } else if ((typeof row['Free Lunch'] === 'number' || !isNaN(parseFloat(row['Free Lunch']))) &&
                   (typeof row['Reduced Lunch'] === 'number' || !isNaN(parseFloat(row['Reduced Lunch'])))) {
          validCount++;
        }
      });
      
      console.log(`  ${districtName}: ${districtRows.length} schools, ${validCount} with valid FRL, ${asteriskCount} with "*"`);
    }
  });
});