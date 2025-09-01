#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('Processing DPS School Data (Enhanced)...\n');

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

// 2. Process ALL attendance data files
console.log('\n2. Processing attendance data...');
const attendanceDir = path.join(__dirname, 'Attendance Data');
const attendanceFiles = fs.readdirSync(attendanceDir)
  .filter(f => f.includes('ChronicAbsenteeism') && f.endsWith('.xlsx'))
  .sort();

console.log(`Found ${attendanceFiles.length} chronic absenteeism files`);

attendanceFiles.forEach(file => {
  const filePath = path.join(attendanceDir, file);
  console.log(`\nProcessing ${file}...`);
  
  // Extract year from filename
  const yearMatch = file.match(/(\d{4})-(\d{4})/);
  if (!yearMatch) {
    console.log('   Could not extract year from filename');
    return;
  }
  const yearString = yearMatch[0]; // e.g., "2023-2024"
  
  try {
    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find header row (contains "District Name" or similar)
    let headerRow = -1;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (row && row.some(cell => 
        cell && cell.toString().toLowerCase().includes('district'))) {
        headerRow = i;
        break;
      }
    }
    
    if (headerRow === -1) {
      console.log('   Could not find header row');
      return;
    }
    
    // Find column indices
    const headers = rawData[headerRow].map(h => h ? h.toString().toLowerCase() : '');
    const districtCol = headers.findIndex(h => h.includes('district'));
    const schoolCol = headers.findIndex(h => h.includes('school') && !h.includes('code'));
    const studentCountCol = headers.findIndex(h => h.includes('student') && h.includes('count'));
    const absentCountCol = headers.findIndex(h => h.includes('chronic') && h.includes('count'));
    const absentRateCol = headers.findIndex(h => h.includes('chronic') && h.includes('rate'));
    
    // Process data rows
    let denverCount = 0;
    for (let i = headerRow + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !row[districtCol]) continue;
      
      // Check if it's Denver
      if (row[districtCol].toString().toLowerCase().includes('denver')) {
        const schoolName = row[schoolCol];
        if (!schoolName) continue;
        
        const studentCount = row[studentCountCol];
        const absentCount = row[absentCountCol];
        const absentRate = row[absentRateCol];
        
        // Try to match with geocoded schools
        const searchName = schoolName.toString().toLowerCase().trim();
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
          school.attendance[yearString] = {
            studentCount: studentCount === '*' ? null : parseInt(studentCount) || null,
            chronicAbsentCount: absentCount === '*' ? null : parseInt(absentCount) || null,
            chronicAbsentRate: absentRate === '*' ? null : parseFloat(absentRate) || null
          };
          denverCount++;
        }
      }
    }
    console.log(`   Found ${denverCount} DPS schools with data`);
  } catch (err) {
    console.log(`   Error processing file: ${err.message}`);
  }
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

// 4. Create output
const dpsSchoolData = {
  generated: new Date().toISOString(),
  schoolCount: schools.length,
  schools: Array.from(schoolsMap.values())
};

// Save to public folder
const outputPath = path.join(__dirname, '../public/dps_schools_data_enhanced.json');
fs.writeFileSync(outputPath, JSON.stringify(dpsSchoolData, null, 2));

console.log(`\nSaved enhanced DPS school data to: ${outputPath}`);

// Summary statistics
const attendanceYearCounts = {};
dpsSchoolData.schools.forEach(school => {
  Object.keys(school.attendance).forEach(year => {
    attendanceYearCounts[year] = (attendanceYearCounts[year] || 0) + 1;
  });
});

console.log('\nAttendance data coverage by year:');
Object.entries(attendanceYearCounts).sort().forEach(([year, count]) => {
  console.log(`  ${year}: ${count} schools`);
});

console.log('\nSchools missing all attendance data:');
const missingAll = dpsSchoolData.schools.filter(s => 
  Object.keys(s.attendance).length === 0
);
console.log(`  ${missingAll.length} schools (${(missingAll.length/schools.length*100).toFixed(1)}%)`);

if (missingAll.length > 0 && missingAll.length < 10) {
  missingAll.forEach(s => console.log(`    - ${s.name}`));
}