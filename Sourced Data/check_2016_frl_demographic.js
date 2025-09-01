#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Demographic data', '2016-17_PK-12_PupilMembership_bySchool_FRL_0.xlsx');

console.log('Checking 2016-17 FRL data from Demographic folder...\n');

try {
  const workbook = XLSX.readFile(filePath);
  
  console.log('Sheet names:', workbook.SheetNames);
  
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('\nTotal rows:', data.length);
  console.log('\nColumn names:', Object.keys(data[0] || {}));
  
  // Check sample data
  console.log('\nFirst 3 rows:');
  data.slice(0, 3).forEach((row, idx) => {
    console.log(`\nRow ${idx + 1}:`, {
      OrgName: row['ORGANIZATION_NAME'] || row['Organization Name'] || row['ORG_NAME'],
      SchoolName: row['SCHOOL_NAME'] || row['School Name'],
      Total: row['TOTAL'] || row['Total'] || row['PK-12 Total'],
      Free: row['FREE_LUNCH'] || row['Free Lunch'] || row['FREE'],
      Reduced: row['REDUCED_LUNCH'] || row['Reduced Lunch'] || row['REDUCED']
    });
  });
  
  // Calculate FRL for specific districts
  console.log('\n\nCalculating FRL for sample districts:');
  const testDistricts = ['ACADEMY 20', 'DENVER COUNTY 1', 'ADAMS 12 FIVE STAR SCHOOLS'];
  
  testDistricts.forEach(districtName => {
    const districtRows = data.filter(row => {
      const orgName = row['ORGANIZATION_NAME'] || row['Organization Name'] || row['ORG_NAME'] || '';
      return orgName.toUpperCase().includes(districtName);
    });
    
    if (districtRows.length > 0) {
      let totalEnrollment = 0;
      let totalFree = 0;
      let totalReduced = 0;
      
      districtRows.forEach(row => {
        // Try different possible column names
        const enrollment = row['TOTAL'] || row['Total'] || row['PK-12 Total'] || row['PUPIL_COUNT'] || 0;
        const free = row['FREE_LUNCH'] || row['Free Lunch'] || row['FREE'] || row['FREE_LUNCH_COUNT'] || 0;
        const reduced = row['REDUCED_LUNCH'] || row['Reduced Lunch'] || row['REDUCED'] || row['REDUCED_LUNCH_COUNT'] || 0;
        
        totalEnrollment += Number(enrollment) || 0;
        totalFree += Number(free) || 0;
        totalReduced += Number(reduced) || 0;
      });
      
      console.log(`\n${districtName}:`);
      console.log(`  Schools: ${districtRows.length}`);
      console.log(`  Total Enrollment: ${totalEnrollment}`);
      console.log(`  Free Lunch: ${totalFree}`);
      console.log(`  Reduced Lunch: ${totalReduced}`);
      console.log(`  FRL Total: ${totalFree + totalReduced}`);
      if (totalEnrollment > 0) {
        console.log(`  FRL %: ${Math.round((totalFree + totalReduced) / totalEnrollment * 1000) / 10}%`);
      }
    }
  });
  
} catch (error) {
  console.error('Error reading file:', error.message);
}