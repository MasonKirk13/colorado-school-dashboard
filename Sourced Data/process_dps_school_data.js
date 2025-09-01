#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('Processing DPS School Data...\n');

// 1. Load geocoded schools
console.log('1. Loading DPS school locations...');
const geoPath = path.join(__dirname, 'Enrollment Zones/DPSSchools_Geocoded.xlsx');
const geoWb = XLSX.readFile(geoPath);
const geoSheet = geoWb.Sheets[geoWb.SheetNames[0]];
const schools = XLSX.utils.sheet_to_json(geoSheet);
console.log(`   Found ${schools.length} DPS schools with locations`);

// Create lookup map by school name
const schoolsMap = new Map();
schools.forEach(school => {
  const name = school['School Name'].toLowerCase().trim();
  schoolsMap.set(name, {
    name: school['School Name'],
    address: school.Address,
    category: school.Category,
    phone: school['Phone Number'],
    website: school['School Website'],
    latitude: school.Latitude,
    longitude: school.Longitude,
    attendance: {},
    enrollment: {},
    cmas: {},
    frl: {}
  });
});

// 2. Process attendance data
console.log('\n2. Processing attendance data...');
const attendanceFiles = [
  '2023-2024 Chronic Absenteeism by School - Suppressed.xlsx',
  '2022-2023_ChronicAbsenteeism.xlsx',
  '2021-2022_ChronicAbsenteeism.xlsx'
];

attendanceFiles.forEach(file => {
  const filePath = path.join(__dirname, 'Attendance Data', file);
  if (!fs.existsSync(filePath)) {
    console.log(`   Skipping ${file} - not found`);
    return;
  }
  
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Find Denver schools
  let denverCount = 0;
  for (let i = 2; i < rawData.length; i++) {
    const row = rawData[i];
    if (row[2] === 'Denver County 1') {
      const schoolName = row[4];
      const year = row[0] || file.match(/(\d{4})-(\d{4})/)?.[0] || 'unknown';
      const studentCount = row[5];
      const absentCount = row[6];
      const absentRate = row[7];
      
      // Try to match with geocoded schools
      const searchName = schoolName.toLowerCase().trim();
      let school = schoolsMap.get(searchName);
      
      // If no exact match, try partial match
      if (!school) {
        for (const [key, value] of schoolsMap) {
          if (key.includes(searchName) || searchName.includes(key)) {
            school = value;
            break;
          }
        }
      }
      
      if (school) {
        school.attendance[year] = {
          studentCount: studentCount === '*' ? null : studentCount,
          chronicAbsentCount: absentCount === '*' ? null : absentCount,
          chronicAbsentRate: absentRate === '*' ? null : absentRate
        };
        denverCount++;
      }
    }
  }
  console.log(`   ${file}: Found ${denverCount} DPS schools`);
});

// 3. Process enrollment/FRL data from main file
console.log('\n3. Processing enrollment and FRL data...');
const frlPath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
const frlWb = XLSX.readFile(frlPath);

frlWb.SheetNames.forEach(sheetName => {
  if (sheetName.includes('Cheat Sheet')) return;
  
  const yearMatch = sheetName.match(/(\d{4})-\d{4}/);
  if (!yearMatch) return;
  const year = yearMatch[1];
  
  const sheet = frlWb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  let dpsCount = 0;
  data.forEach(row => {
    if (row['Organization Name'] === 'Denver County 1') {
      const schoolName = row['School Name'];
      const searchName = schoolName.toLowerCase().trim();
      
      // Find matching school
      let school = schoolsMap.get(searchName);
      if (!school) {
        for (const [key, value] of schoolsMap) {
          if (key.includes(searchName) || searchName.includes(key)) {
            school = value;
            break;
          }
        }
      }
      
      if (school) {
        school.enrollment[year] = {
          total: row['PK-12 Total'] || 0,
          pk: row['PK'] || 0,
          k: row['K'] || 0,
          elementary: (row['1'] || 0) + (row['2'] || 0) + (row['3'] || 0) + 
                     (row['4'] || 0) + (row['5'] || 0),
          middle: (row['6'] || 0) + (row['7'] || 0) + (row['8'] || 0),
          high: (row['9'] || 0) + (row['10'] || 0) + (row['11'] || 0) + (row['12'] || 0)
        };
        
        const freeLunch = row['Free Lunch'];
        const reducedLunch = row['Reduced Lunch'];
        
        if (freeLunch !== '*' && reducedLunch !== '*' && 
            freeLunch !== undefined && reducedLunch !== undefined) {
          const free = parseFloat(freeLunch) || 0;
          const reduced = parseFloat(reducedLunch) || 0;
          const total = school.enrollment[year].total;
          
          school.frl[year] = {
            freeCount: free,
            reducedCount: reduced,
            totalCount: free + reduced,
            percentage: total > 0 ? Math.round((free + reduced) / total * 1000) / 10 : null
          };
        }
        dpsCount++;
      }
    }
  });
  console.log(`   ${sheetName}: Found ${dpsCount} DPS schools`);
});

// 4. Process CMAS data
console.log('\n4. Processing CMAS data...');
const cmasDir = path.join(__dirname, 'General CMAS Score Data');
const cmasFiles = fs.readdirSync(cmasDir).filter(f => f.endsWith('.xlsx'));

// For now, just note that CMAS data exists
console.log(`   Found ${cmasFiles.length} CMAS files - processing TBD`);

// 5. Create output
const dpsSchoolData = {
  generated: new Date().toISOString(),
  schoolCount: schools.length,
  schools: Array.from(schoolsMap.values())
};

// Save to public folder
const outputPath = path.join(__dirname, '../public/dps_schools_data.json');
fs.writeFileSync(outputPath, JSON.stringify(dpsSchoolData, null, 2));

console.log(`\nSaved DPS school data to: ${outputPath}`);

// Summary statistics
const schoolsWithAttendance = dpsSchoolData.schools.filter(s => 
  Object.keys(s.attendance).length > 0
).length;
const schoolsWithEnrollment = dpsSchoolData.schools.filter(s => 
  Object.keys(s.enrollment).length > 0
).length;
const schoolsWithFRL = dpsSchoolData.schools.filter(s => 
  Object.keys(s.frl).length > 0
).length;

console.log('\nSummary:');
console.log(`- Total DPS schools: ${schools.length}`);
console.log(`- Schools with attendance data: ${schoolsWithAttendance}`);
console.log(`- Schools with enrollment data: ${schoolsWithEnrollment}`);
console.log(`- Schools with FRL data: ${schoolsWithFRL}`);

// Show sample school
console.log('\nSample school data:');
const sampleSchool = dpsSchoolData.schools.find(s => 
  Object.keys(s.attendance).length > 0 && Object.keys(s.enrollment).length > 0
);
if (sampleSchool) {
  console.log(JSON.stringify(sampleSchool, null, 2));
}