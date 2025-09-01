const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const cmasDir = path.join(__dirname, 'General CMAS Score Data');
const files = fs.readdirSync(cmasDir).filter(f => f.endsWith('.xlsx') && !f.includes('inspect'));

console.log('Inspecting CMAS file formats...\n');

files.forEach(file => {
  console.log(`\n=== ${file} ===`);
  const filePath = path.join(cmasDir, file);
  
  try {
    const workbook = XLSX.readFile(filePath);
    console.log(`Sheets: ${workbook.SheetNames.join(', ')}`);
    
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    
    // Find header row
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rawData.length, 40); i++) {
      if (rawData[i] && rawData[i].some(cell => 
        cell && (cell.toString().toLowerCase().includes('level') || 
                 cell.toString().toLowerCase().includes('district')))) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex >= 0) {
      console.log(`Header row found at index: ${headerRowIndex}`);
      console.log('Headers:', rawData[headerRowIndex].filter(h => h).slice(0, 10));
      
      // Look for key columns
      const headers = rawData[headerRowIndex];
      const levelIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('level'));
      const districtIdx = headers.findIndex(h => h && 
        (h.toString().toLowerCase().includes('district name') || 
         h.toString().toLowerCase().includes('organization name')));
      const gradeIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('grade'));
      
      console.log(`Key columns - Level: ${levelIdx}, District: ${districtIdx}, Grade: ${gradeIdx}`);
      
      // Sample first few data rows
      console.log('\nFirst few data rows:');
      for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 5, rawData.length); i++) {
        if (rawData[i] && rawData[i][levelIdx]) {
          console.log(`  Row ${i}: Level="${rawData[i][levelIdx]}", District="${rawData[i][districtIdx]}", Grade="${rawData[i][gradeIdx]}"`);
        }
      }
    } else {
      console.log('Could not find header row!');
    }
  } catch (error) {
    console.log(`Error reading file: ${error.message}`);
  }
});