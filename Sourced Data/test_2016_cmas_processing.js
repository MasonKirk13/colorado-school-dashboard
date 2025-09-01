const XLSX = require('xlsx');
const path = require('path');

console.log('Testing 2016 CMAS processing...\n');

const filePath = path.join(__dirname, 'General CMAS Score Data/2016 ELA Math District and School Summary final.xlsx');
const workbook = XLSX.readFile(filePath);

// Process ELA sheet
const sheet = workbook.Sheets['ELA'];
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Find header row
let headerRow = -1;
for (let i = 0; i < 10; i++) {
  if (rawData[i] && rawData[i][0] === 'Level') {
    headerRow = i;
    break;
  }
}

console.log('Header row:', headerRow);
console.log('Headers at key columns:');
console.log('  Column 0:', rawData[headerRow][0]);
console.log('  Column 2:', rawData[headerRow][2]);
console.log('  Column 6:', rawData[headerRow][6]);
console.log('  Column 23:', rawData[headerRow][23]);

// Process some district rows
console.log('\nProcessing district rows:');
let districtCount = 0;
const districtResults = {};

for (let i = headerRow + 1; i < rawData.length && districtCount < 10; i++) {
  const row = rawData[i];
  if (row[0] === 'DISTRICT') {
    const districtName = row[2];
    const grade = row[6];
    const percent = row[23];
    
    console.log(`\nDistrict: ${districtName}`);
    console.log(`  Grade: ${grade}`);
    console.log(`  Percent (column 23): ${percent}`);
    console.log(`  Type of percent value: ${typeof percent}`);
    
    // Store results for aggregation
    if (!districtResults[districtName]) {
      districtResults[districtName] = [];
    }
    
    if (percent !== '*' && percent !== undefined && percent !== null && percent !== '') {
      const percentNum = parseFloat(percent);
      if (!isNaN(percentNum)) {
        districtResults[districtName].push(percentNum);
      }
    }
    
    districtCount++;
  }
}

// Show aggregated results
console.log('\n\nAggregated results for first few districts:');
Object.entries(districtResults).slice(0, 5).forEach(([district, scores]) => {
  if (scores.length > 0) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    console.log(`${district}: ${scores.length} grades, average: ${avg.toFixed(1)}%`);
  }
});