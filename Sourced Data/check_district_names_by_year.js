const XLSX = require('xlsx');
const path = require('path');

console.log('Checking district names in recent years...\n');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

const recentYears = ['2020-2021', '2021-2022', '2022-2023', '2023-2024', '2024-2025'];

recentYears.forEach(yearSheet => {
  const sheetName = `${yearSheet} Data`;
  if (!workbook.SheetNames.includes(sheetName)) return;
  
  console.log(`\n${yearSheet}:`);
  console.log('='.repeat(50));
  
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  // Get unique organization names
  const orgNames = new Set();
  data.forEach(row => {
    if (row['Organization Name']) {
      orgNames.add(row['Organization Name']);
    }
  });
  
  console.log(`Total rows: ${data.length}`);
  console.log(`Unique organizations: ${orgNames.size}`);
  
  // Look for Denver-related names
  const denverNames = Array.from(orgNames).filter(name => 
    name.toLowerCase().includes('denver')
  );
  
  if (denverNames.length > 0) {
    console.log('\nDenver-related organizations:');
    denverNames.forEach(name => console.log(`  - "${name}"`));
  } else {
    console.log('\nNO Denver organizations found!');
  }
  
  // Show first few org names
  console.log('\nFirst 10 organization names:');
  Array.from(orgNames).slice(0, 10).forEach(name => {
    console.log(`  - "${name}"`);
  });
  
  // Check if data looks valid
  if (data.length > 0) {
    const firstRow = data[0];
    console.log('\nFirst row data:');
    console.log(`  Organization: "${firstRow['Organization Name']}"`);
    console.log(`  School: "${firstRow['School Name']}"`);
    console.log(`  Enrollment: ${firstRow['PK-12 Total']}`);
    console.log(`  Free Lunch: ${firstRow['Free Lunch']}`);
  }
});