#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('Processing All DPS Attendance Data...\n');

// 1. Load existing school data
const schoolDataPath = path.join(__dirname, '../public/dps_schools_data.json');
const schoolData = JSON.parse(fs.readFileSync(schoolDataPath, 'utf8'));

// Create lookup map
const schoolsMap = new Map();
schoolData.schools.forEach(school => {
  const name = school.name.toLowerCase().trim();
  schoolsMap.set(name, school);
  // Clear existing attendance data
  school.attendance = {};
});

// 2. Process 2023-2024 Chronic Absenteeism (special handling)
console.log('Processing 2023-2024 Chronic Absenteeism data...');
const chronicPath = path.join(__dirname, 'Attendance Data/2023-2024 Chronic Absenteeism by School - Suppressed.xlsx');
try {
  const wb = XLSX.readFile(chronicPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  let denverCount = 0;
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (row[2] === 'Denver County 1') {
      const schoolName = row[4];
      const searchName = schoolName.toLowerCase().trim();
      
      let school = schoolsMap.get(searchName);
      if (!school) {
        // Try partial match
        for (const [key, value] of schoolsMap) {
          if (key.includes(searchName) || searchName.includes(key)) {
            school = value;
            break;
          }
        }
      }
      
      if (school) {
        school.attendance['2023-2024'] = {
          year: '2023-2024',
          metricType: 'chronicAbsenteeism',
          studentCount: row[5] === '*' ? null : parseInt(row[5]),
          chronicAbsentCount: row[6] === '*' ? null : parseInt(row[6]),
          chronicAbsentRate: row[7] === '*' ? null : parseFloat(row[7]),
          attendanceRate: null,
          truancyRate: null
        };
        denverCount++;
      }
    }
  }
  console.log(`  Found ${denverCount} DPS schools with chronic absenteeism data`);
} catch (err) {
  console.log(`  Error: ${err.message}`);
}

// 3. Process historical Truancy/Attendance data (2013-2023)
console.log('\nProcessing historical attendance/truancy data...');
const attendanceDir = path.join(__dirname, 'Attendance Data');
const truancyFiles = fs.readdirSync(attendanceDir)
  .filter(f => f.includes('TruancyData') && f.endsWith('.xlsx'))
  .sort();

// Also check for the 2023-2024 attendance file
if (fs.existsSync(path.join(attendanceDir, '2023-2024 Attendance and Truancy Rates by School - Suppressed.xlsx'))) {
  truancyFiles.push('2023-2024 Attendance and Truancy Rates by School - Suppressed.xlsx');
}

truancyFiles.forEach(file => {
  console.log(`\nProcessing ${file}...`);
  const filePath = path.join(attendanceDir, file);
  
  // Extract year
  const yearMatch = file.match(/(\d{4})-(\d{4})/);
  if (!yearMatch) return;
  const yearString = yearMatch[0];
  
  try {
    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find header row
    let headerRow = -1;
    for (let i = 0; i < Math.min(5, data.length); i++) {
      if (data[i] && data[i].some(cell => cell && cell.toString().includes('School Code'))) {
        headerRow = i;
        break;
      }
    }
    
    if (headerRow === -1) {
      console.log('  Could not find header row');
      return;
    }
    
    const headers = data[headerRow].map(h => h ? h.toString() : '');
    
    // Find column indices (handle different naming patterns across years)
    const schoolNameCol = headers.findIndex(h => h.includes('School Name'));
    const attendanceRateCol = headers.findIndex(h => h.includes('Attendance Rate'));
    const truancyRateCol = headers.findIndex(h => h.includes('Truancy Rate'));
    const studentCountCol = headers.findIndex(h => 
      h.includes('Student Count') || 
      h.includes('Students Counted') || 
      h.includes('PK-12 Student Count')
    );
    
    let denverCount = 0;
    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      // Check different column positions for Denver County 1 based on file structure
      const isDenver = (row && (row[2] === 'Denver County 1' || row[4] === 'Denver County 1'));
      if (isDenver) {
        const schoolName = row[schoolNameCol];
        if (!schoolName) continue;
        
        const searchName = schoolName.toLowerCase().trim();
        let school = schoolsMap.get(searchName);
        
        if (!school) {
          // Try partial match
          for (const [key, value] of schoolsMap) {
            if (key.includes(searchName) || searchName.includes(key)) {
              school = value;
              break;
            }
          }
        }
        
        if (school) {
          const studentCount = row[studentCountCol];
          // Handle student count with reasonability check for all years
          let reasonableCount = null;
          if (studentCount !== undefined && studentCount !== null && studentCount !== '*') {
            const parsedCount = parseInt(studentCount);
            if (!isNaN(parsedCount) && parsedCount > 0 && parsedCount < 5000) {
              reasonableCount = parsedCount;
            }
          }
          
          if (yearString === '2023-2024' && school.attendance[yearString]) {
            // Merge with existing chronic absenteeism data
            school.attendance[yearString].attendanceRate = row[attendanceRateCol] === '*' ? null : parseFloat(row[attendanceRateCol]) || null;
            school.attendance[yearString].truancyRate = row[truancyRateCol] === '*' ? null : parseFloat(row[truancyRateCol]) || null;
            school.attendance[yearString].metricType = 'both'; // Has both chronic and attendance
            if (!school.attendance[yearString].studentCount) {
              school.attendance[yearString].studentCount = reasonableCount;
            }
          } else {
            // Create new attendance data
            school.attendance[yearString] = {
              year: yearString,
              metricType: 'attendanceRate',
              studentCount: reasonableCount,
              attendanceRate: row[attendanceRateCol] === '*' ? null : parseFloat(row[attendanceRateCol]) || null,
              truancyRate: row[truancyRateCol] === '*' ? null : parseFloat(row[truancyRateCol]) || null,
              chronicAbsentRate: null,
              chronicAbsentCount: null
            };
          }
          denverCount++;
        }
      }
    }
    console.log(`  Found ${denverCount} DPS schools`);
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }
});

// 4. Save updated data
const outputPath = path.join(__dirname, '../public/dps_schools_data_multi_year.json');
fs.writeFileSync(outputPath, JSON.stringify(schoolData, null, 2));

console.log(`\nSaved multi-year data to: ${outputPath}`);

// Summary
const yearCoverage = {};
schoolData.schools.forEach(school => {
  Object.keys(school.attendance).forEach(year => {
    yearCoverage[year] = (yearCoverage[year] || 0) + 1;
  });
});

console.log('\nData coverage by year:');
Object.entries(yearCoverage).sort().forEach(([year, count]) => {
  const pct = (count / schoolData.schools.length * 100).toFixed(1);
  console.log(`  ${year}: ${count} schools (${pct}%)`);
});

// Check what years have what type of data
console.log('\nMetric types by year:');
const metricTypes = {};
schoolData.schools.forEach(school => {
  Object.entries(school.attendance).forEach(([year, data]) => {
    if (!metricTypes[year]) metricTypes[year] = new Set();
    metricTypes[year].add(data.metricType);
  });
});

Object.entries(metricTypes).sort().forEach(([year, types]) => {
  console.log(`  ${year}: ${Array.from(types).join(', ')}`);
});