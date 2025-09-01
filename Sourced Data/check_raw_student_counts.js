const XLSX = require('xlsx');
const path = require('path');

console.log('Checking raw student count data in 2019-2020 file...\n');

const filePath = path.join(__dirname, 'Attendance Data/2019-2020_TruancyData.xlsx');

try {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Find header row
  let headerRow = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    if (data[i] && data[i].some(cell => cell && cell.toString().includes('School Code'))) {
      headerRow = i;
      break;
    }
  }
  
  if (headerRow >= 0) {
    console.log('Headers:', data[headerRow]);
    
    const headers = data[headerRow].map(h => h ? h.toString() : '');
    const studentCountCol = headers.findIndex(h => h.includes('Student Count'));
    console.log(`Student Count column: ${studentCountCol}`);
    
    // Look at a few Denver schools
    let count = 0;
    for (let i = headerRow + 1; i < data.length && count < 5; i++) {
      const row = data[i];
      if (row && row[4] === 'Denver County 1') {
        console.log(`Denver school: ${row[6]} - Student Count: ${row[studentCountCol]} (type: ${typeof row[studentCountCol]})`);
        count++;
      }
    }
  }
  
} catch (err) {
  console.log(`Error: ${err.message}`);
}