const XLSX = require('xlsx');
const path = require('path');

console.log('Diagnosing FRL data processing issues...\n');

const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const workbook = XLSX.readFile(filePath);

// Focus on Denver County 1 as an example
const testYears = ['2019-2020', '2020-2021', '2021-2022', '2022-2023', '2023-2024'];

testYears.forEach(yearSheet => {
  const sheetName = `${yearSheet} Data`;
  if (!workbook.SheetNames.includes(sheetName)) return;
  
  console.log(`\n${yearSheet}:`);
  console.log('='.repeat(50));
  
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  // Find Denver rows
  const denverRows = data.filter(row => 
    row['Organization Name'] && row['Organization Name'].includes('DENVER COUNTY 1')
  );
  
  console.log(`Found ${denverRows.length} Denver County 1 rows`);
  
  if (denverRows.length > 0) {
    // Check first few rows
    console.log('\nFirst 3 rows:');
    denverRows.slice(0, 3).forEach((row, idx) => {
      console.log(`\nRow ${idx + 1}:`);
      console.log(`  School: ${row['School Name']}`);
      console.log(`  Enrollment: ${row['PK-12 Total']}`);
      console.log(`  Free Lunch: "${row['Free Lunch']}" (type: ${typeof row['Free Lunch']})`);
      console.log(`  Reduced Lunch: "${row['Reduced Lunch']}" (type: ${typeof row['Reduced Lunch']})`);
    });
    
    // Calculate totals
    let totalEnrollment = 0;
    let totalFree = 0;
    let totalReduced = 0;
    let validFreeCount = 0;
    let validReducedCount = 0;
    let invalidValues = new Set();
    
    denverRows.forEach(row => {
      const enrollment = row['PK-12 Total'] || 0;
      const free = row['Free Lunch'];
      const reduced = row['Reduced Lunch'];
      
      totalEnrollment += enrollment;
      
      // Check free lunch
      if (free !== null && free !== undefined && free !== '' && free !== '*') {
        const freeNum = parseFloat(free);
        if (!isNaN(freeNum)) {
          totalFree += freeNum;
          validFreeCount++;
        } else {
          invalidValues.add(`Free: "${free}"`);
        }
      } else {
        invalidValues.add(`Free: "${free}"`);
      }
      
      // Check reduced lunch
      if (reduced !== null && reduced !== undefined && reduced !== '' && reduced !== '*') {
        const reducedNum = parseFloat(reduced);
        if (!isNaN(reducedNum)) {
          totalReduced += reducedNum;
          validReducedCount++;
        } else {
          invalidValues.add(`Reduced: "${reduced}"`);
        }
      } else {
        invalidValues.add(`Reduced: "${reduced}"`);
      }
    });
    
    console.log('\nSummary:');
    console.log(`  Total Enrollment: ${totalEnrollment}`);
    console.log(`  Total Free: ${totalFree} (from ${validFreeCount}/${denverRows.length} valid rows)`);
    console.log(`  Total Reduced: ${totalReduced} (from ${validReducedCount}/${denverRows.length} valid rows)`);
    console.log(`  FRL Total: ${totalFree + totalReduced}`);
    
    if (totalEnrollment > 0 && (totalFree + totalReduced) > 0) {
      console.log(`  FRL %: ${Math.round((totalFree + totalReduced) / totalEnrollment * 1000) / 10}%`);
    } else {
      console.log(`  FRL %: Cannot calculate (no valid data)`);
    }
    
    if (invalidValues.size > 0) {
      console.log(`\nInvalid values found: ${Array.from(invalidValues).slice(0, 5).join(', ')}`);
    }
  }
});