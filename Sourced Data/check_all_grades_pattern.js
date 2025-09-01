const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('Checking "All Grades" pattern across all CMAS files...\n');

const cmasDir = path.join(__dirname, 'General CMAS Score Data');
const files = fs.readdirSync(cmasDir).filter(f => f.endsWith('.xlsx')).sort();

files.forEach(fileName => {
  const year = fileName.match(/(\d{4})/)?.[1];
  if (!year) return;
  
  console.log(`\n${year} - ${fileName}:`);
  
  try {
    const workbook = XLSX.readFile(path.join(cmasDir, fileName));
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Find header row
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(50, rawData.length); i++) {
      const row = rawData[i];
      if (row && row.some(cell => cell && cell.toString().includes('Grade'))) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex !== -1) {
      const headers = rawData[headerRowIndex];
      const gradeIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('grade'));
      const levelIdx = headers.findIndex(h => h && h.toString() === 'Level');
      
      // Collect grade values
      const grades = new Set();
      let districtRows = 0;
      let allGradesRows = 0;
      
      for (let i = headerRowIndex + 1; i < rawData.length && i < headerRowIndex + 5000; i++) {
        const row = rawData[i];
        if (row && row[levelIdx] === 'DISTRICT') {
          districtRows++;
          const grade = row[gradeIdx];
          if (grade) {
            grades.add(grade.toString());
            if (grade === 'All Grades') allGradesRows++;
          }
        }
      }
      
      console.log(`  Total district rows: ${districtRows}`);
      console.log(`  "All Grades" rows: ${allGradesRows}`);
      console.log(`  Grade values found: ${Array.from(grades).sort().join(', ')}`);
      
      if (!grades.has('All Grades')) {
        console.log('  ⚠️  NO "All Grades" aggregate - individual grades must be averaged');
      }
    }
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
});