const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('Finding districts in CMAS files...\n');

// Check 2019 CMAS file
const cmasFile = path.join(__dirname, 'General CMAS Score Data/2019 CMAS ELA MATH District and School Achievement Results.xlsx');
const workbook = XLSX.readFile(cmasFile);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

// Try reading with header row at different positions
console.log('Trying to find header row...');
for (let headerRow = 10; headerRow < 30; headerRow++) {
  const testData = XLSX.utils.sheet_to_json(worksheet, { 
    range: headerRow,
    header: 1  // Use array of values
  });
  
  if (testData.length > 0 && testData[0].length > 0) {
    // Check if this looks like a header row
    const firstRow = testData[0];
    const hasDistrictColumn = firstRow.some(cell => 
      cell && typeof cell === 'string' && 
      (cell.toLowerCase().includes('district') || cell.toLowerCase().includes('organization'))
    );
    
    if (hasDistrictColumn) {
      console.log(`\nFound likely header at row ${headerRow + 1}:`);
      console.log('Headers:', firstRow.slice(0, 10));
      
      // Now try to read actual data
      console.log('\nReading data with found header...');
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        range: headerRow 
      });
      
      console.log(`Total rows: ${data.length}`);
      
      // Find district column
      const districtColumns = Object.keys(data[0] || {}).filter(col => 
        col.toLowerCase().includes('district') || 
        col.toLowerCase().includes('organization')
      );
      
      console.log('District columns found:', districtColumns);
      
      if (districtColumns.length > 0 && data.length > 0) {
        const districtCol = districtColumns[0];
        
        // Get unique districts
        const districts = new Set();
        data.forEach(row => {
          const districtName = row[districtCol];
          if (districtName && typeof districtName === 'string' && districtName.trim()) {
            districts.add(districtName.trim());
          }
        });
        
        console.log(`\nUnique districts found: ${districts.size}`);
        console.log('\nFirst 20 districts:');
        Array.from(districts).slice(0, 20).forEach(d => console.log(`  - "${d}"`));
        
        // Check if specific districts exist
        console.log('\n\nChecking for specific districts:');
        const checkDistricts = ['Adams', 'Denver', 'Alamosa', 'Adams-Arapahoe'];
        checkDistricts.forEach(check => {
          const found = Array.from(districts).filter(d => 
            d.toLowerCase().includes(check.toLowerCase())
          );
          console.log(`\n"${check}":`);
          if (found.length > 0) {
            found.forEach(f => console.log(`  - "${f}"`));
          } else {
            console.log('  Not found');
          }
        });
        
        // Save districts to file for comparison
        fs.writeFileSync('cmas_2019_districts.json', JSON.stringify(Array.from(districts).sort(), null, 2));
        console.log('\nSaved district list to cmas_2019_districts.json');
        
        break;
      }
    }
  }
}