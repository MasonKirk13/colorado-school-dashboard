const XLSX = require('xlsx');
const path = require('path');

console.log('Checking 2021 CMAS grade values...\n');

const file = path.join(__dirname, 'General CMAS Score Data/2021 CMAS ELA and Math District and School Summary Achievement Results - Required Tests.xlsx');
const workbook = XLSX.readFile(file);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

// Read raw data
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Find header row
let headerRowIndex = -1;
for (let i = 0; i < Math.min(50, rawData.length); i++) {
  const row = rawData[i];
  if (row && row.some(cell => cell && cell.toString().includes('Level'))) {
    headerRowIndex = i;
    break;
  }
}

console.log(`Header row found at index: ${headerRowIndex}`);

if (headerRowIndex !== -1) {
  const headers = rawData[headerRowIndex];
  const gradeIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('grade'));
  const levelIdx = headers.findIndex(h => h && h.toString() === 'Level');
  
  console.log(`Grade column index: ${gradeIdx}`);
  console.log(`\nUnique grade values in 2021 file:`);
  
  const grades = new Set();
  for (let i = headerRowIndex + 1; i < rawData.length && i < headerRowIndex + 1000; i++) {
    const row = rawData[i];
    if (row && row[levelIdx] === 'DISTRICT' && row[gradeIdx]) {
      grades.add(row[gradeIdx].toString());
    }
  }
  
  const sortedGrades = Array.from(grades).sort();
  sortedGrades.forEach(grade => console.log(`  - "${grade}"`));
  
  // Check if "All Grades" exists
  if (grades.has('All Grades')) {
    console.log('\n✓ "All Grades" found in 2021 data!');
  } else {
    console.log('\n✗ "All Grades" NOT found in 2021 data');
    console.log('This explains why the code uses individual grades for 2021');
  }
}