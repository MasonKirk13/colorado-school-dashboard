const XLSX = require('xlsx');
const path = require('path');

// Check truancy files
const files = [
  '2022-2023_TruancyData.xlsx',
  '2021-2022_TruancyData.xlsx',
  '2023-2024 Attendance and Truancy Rates by School - Suppressed.xlsx'
];

files.forEach(file => {
  console.log(`\n=== ${file} ===`);
  const filePath = path.join(__dirname, 'Attendance Data', file);
  
  try {
    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log('Total rows:', data.length);
    console.log('\nFirst 10 rows:');
    data.slice(0, 10).forEach((row, i) => {
      if (row && row.length > 0) {
        console.log(`Row ${i}: [${row.slice(0, 6).map(c => c || '').join(' | ')}]`);
      }
    });
    
    // Check if it's school-level or district-level
    let hasSchoolCode = false;
    let hasSchoolName = false;
    data.slice(0, 5).forEach(row => {
      if (row && row.some(cell => cell && cell.toString().toLowerCase().includes('school code'))) {
        hasSchoolCode = true;
      }
      if (row && row.some(cell => cell && cell.toString().toLowerCase().includes('school name'))) {
        hasSchoolName = true;
      }
    });
    
    console.log(`\nData level: ${hasSchoolCode || hasSchoolName ? 'SCHOOL-LEVEL' : 'DISTRICT-LEVEL'}`);
    
    // Count Denver schools
    let denverCount = 0;
    data.forEach(row => {
      if (row && row.some(cell => cell && cell.toString().includes('Denver County 1'))) {
        denverCount++;
      }
    });
    console.log(`Denver rows: ${denverCount}`);
    
  } catch (err) {
    console.log('Error:', err.message);
  }
});

console.log('\n\n=== UNDERSTANDING THE METRICS ===');
console.log('Chronic Absenteeism: Missing 10% or more of school days (18+ days)');
console.log('Truancy: Unexcused absences only (varies by district policy)');
console.log('Attendance Rate: Percentage of days present');
console.log('\nNote: Chronic absenteeism is generally considered a more comprehensive metric');