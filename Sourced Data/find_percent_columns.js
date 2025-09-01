const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const cmasDir = path.join(__dirname, 'General CMAS Score Data');
const files = fs.readdirSync(cmasDir).filter(f => f.endsWith('.xlsx') && !f.includes('inspect'));

console.log('Finding percentage columns in CMAS files...\n');

files.forEach(file => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`FILE: ${file}`);
  console.log('='.repeat(80));
  
  const filePath = path.join(cmasDir, file);
  const workbook = XLSX.readFile(filePath);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\nSHEET: ${sheetName}`);
    
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Look for header row with Level, District, Grade
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(50, rawData.length); i++) {
      if (rawData[i] && Array.isArray(rawData[i])) {
        const hasLevel = rawData[i].some(cell => cell && cell.toString() === 'Level');
        const hasDistrict = rawData[i].some(cell => cell && cell.toString().includes('District'));
        const hasGrade = rawData[i].some(cell => cell && cell.toString().includes('Grade'));
        
        if (hasLevel && hasDistrict && hasGrade) {
          headerRowIndex = i;
          break;
        }
      }
    }
    
    if (headerRowIndex >= 0) {
      console.log(`Header row found at index ${headerRowIndex}`);
      const headers = rawData[headerRowIndex];
      
      // Show all columns
      console.log('All columns:');
      headers.forEach((h, idx) => {
        if (h) console.log(`  Col ${idx}: ${h}`);
      });
      
      // Find percentage/score columns
      console.log('\nPercentage/Score columns:');
      headers.forEach((h, idx) => {
        if (h && (
          h.toString().toLowerCase().includes('percent') ||
          h.toString().toLowerCase().includes('%') ||
          h.toString().toLowerCase().includes('met or exceeded') ||
          h.toString().toLowerCase().includes('score') ||
          h.toString().toLowerCase().includes('mean')
        )) {
          console.log(`  Col ${idx}: ${h}`);
          
          // Show sample data from this column
          console.log('    Sample values:');
          for (let row = headerRowIndex + 1; row < Math.min(headerRowIndex + 6, rawData.length); row++) {
            if (rawData[row] && rawData[row][0] === 'DISTRICT') {
              console.log(`      ${rawData[row][2]} (${rawData[row][6]}): ${rawData[row][idx]}`);
            }
          }
        }
      });
    } else {
      console.log('Could not find header row');
    }
  });
});