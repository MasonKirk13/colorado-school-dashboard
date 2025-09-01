const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const cmasDir = path.join(__dirname, 'General CMAS Score Data');
const files = fs.readdirSync(cmasDir).filter(f => f.endsWith('.xlsx') && !f.includes('inspect'));

console.log('Analyzing CMAS file structures...\n');

files.forEach(file => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`FILE: ${file}`);
  console.log('='.repeat(80));
  
  const filePath = path.join(cmasDir, file);
  const workbook = XLSX.readFile(filePath);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\nSHEET: ${sheetName}`);
    console.log('-'.repeat(40));
    
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Show first 30 rows to understand structure
    console.log('First 30 rows (showing first 8 columns):');
    for (let i = 0; i < Math.min(30, rawData.length); i++) {
      if (rawData[i] && rawData[i].length > 0) {
        const row = rawData[i].slice(0, 8).map(cell => 
          cell === null || cell === undefined ? 'null' : 
          cell.toString().substring(0, 30)
        );
        console.log(`Row ${i}: [${row.join(' | ')}]`);
      }
    }
    
    // Look for potential header rows
    console.log('\nSearching for header patterns...');
    for (let i = 0; i < Math.min(50, rawData.length); i++) {
      if (rawData[i]) {
        const rowStr = rawData[i].join(' ').toLowerCase();
        if (rowStr.includes('level') && rowStr.includes('district') && rowStr.includes('grade')) {
          console.log(`Potential header at row ${i}: ${rawData[i].slice(0, 10).join(' | ')}`);
        }
      }
    }
  });
});