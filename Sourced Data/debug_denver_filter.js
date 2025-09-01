const XLSX = require('xlsx');
const path = require('path');

console.log('Debugging Denver County 1 filtering...\n');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

const sheetName = '2020-2021 Data';
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`Total rows in ${sheetName}: ${data.length}\n`);

// Find all Denver rows with different filtering approaches
console.log('Method 1 - Exact match:');
const exact = data.filter(row => row['Organization Name'] === 'Denver County 1');
console.log(`  Found: ${exact.length} rows`);

console.log('\nMethod 2 - Includes "DENVER COUNTY 1":');
const upperIncludes = data.filter(row => 
  row['Organization Name'] && row['Organization Name'].includes('DENVER COUNTY 1')
);
console.log(`  Found: ${upperIncludes.length} rows`);

console.log('\nMethod 3 - Case insensitive includes:');
const caseInsensitive = data.filter(row => 
  row['Organization Name'] && row['Organization Name'].toLowerCase().includes('denver county 1')
);
console.log(`  Found: ${caseInsensitive.length} rows`);

console.log('\nMethod 4 - Contains "denver" (case insensitive):');
const containsDenver = data.filter(row => 
  row['Organization Name'] && row['Organization Name'].toLowerCase().includes('denver')
);
console.log(`  Found: ${containsDenver.length} rows`);

// Show actual Denver org names
if (containsDenver.length > 0) {
  const denverOrgNames = new Set();
  containsDenver.forEach(row => denverOrgNames.add(row['Organization Name']));
  console.log('\nUnique Denver organization names found:');
  denverOrgNames.forEach(name => console.log(`  - "${name}"`));
  
  // Show sample data
  console.log('\nFirst Denver row:');
  const firstDenver = containsDenver[0];
  console.log(`  Organization: "${firstDenver['Organization Name']}"`);
  console.log(`  School: "${firstDenver['School Name']}"`);
  console.log(`  Enrollment: ${firstDenver['PK-12 Total']}`);
  console.log(`  Free Lunch: ${firstDenver['Free Lunch']}`);
  console.log(`  Reduced Lunch: ${firstDenver['Reduced Lunch']}`);
}

// Check what the actual column name is
console.log('\nColumn names in first row:');
if (data.length > 0) {
  Object.keys(data[0]).forEach(key => {
    if (key.toLowerCase().includes('org')) {
      console.log(`  - "${key}"`);
    }
  });
}