const fs = require('fs');
const path = require('path');

const schoolData = JSON.parse(fs.readFileSync('../public/dps_schools_data.json', 'utf8'));

console.log('=== DATA COVERAGE ANALYSIS ===\n');

// 1. Check attendance coverage
console.log('1. ATTENDANCE DATA COVERAGE:');
console.log('Total geocoded schools:', schoolData.schools.length);

const attendanceYears = ['2021-2022', '2022-2023', '2023-2024'];
const schoolsWithAttendance = new Set();
const attendanceCoverage = {};

attendanceYears.forEach(year => {
  attendanceCoverage[year] = 0;
  schoolData.schools.forEach(school => {
    if (school.attendance[year]) {
      attendanceCoverage[year]++;
      schoolsWithAttendance.add(school.name);
    }
  });
});

console.log('\nSchools with ANY attendance data:', schoolsWithAttendance.size);
console.log('Schools with NO attendance data:', schoolData.schools.length - schoolsWithAttendance.size);

console.log('\nAttendance coverage by year:');
Object.entries(attendanceCoverage).forEach(([year, count]) => {
  console.log(`  ${year}: ${count} schools (${(count/schoolData.schools.length*100).toFixed(1)}%)`);
});

// Show schools missing attendance data
const missingAttendance = schoolData.schools.filter(s => 
  !s.attendance['2023-2024'] && !s.attendance['2022-2023'] && !s.attendance['2021-2022']
);

console.log('\nExamples of schools WITHOUT attendance data:');
missingAttendance.slice(0, 10).forEach(school => {
  console.log(`  - ${school.name} (${school.category})`);
});

// 2. Check what attendance files we have
console.log('\n\n2. AVAILABLE ATTENDANCE FILES:');
const attendanceDir = path.join(__dirname, 'Attendance Data');
const attendanceFiles = fs.readdirSync(attendanceDir)
  .filter(f => f.includes('Chronic'))
  .sort();

console.log('Chronic Absenteeism files found:');
attendanceFiles.forEach(file => {
  console.log(`  - ${file}`);
});

// 3. Check enrollment/FRL coverage
console.log('\n\n3. ENROLLMENT/FRL DATA COVERAGE:');
const enrollmentYears = Object.keys(schoolData.schools[0].enrollment || {});
console.log('Years with enrollment data:', enrollmentYears.join(', '));

const frlCoverage = {};
enrollmentYears.forEach(year => {
  frlCoverage[year] = schoolData.schools.filter(s => s.frl[year]).length;
});

console.log('\nFRL coverage by year:');
Object.entries(frlCoverage).forEach(([year, count]) => {
  console.log(`  ${year}: ${count} schools (${(count/schoolData.schools.length*100).toFixed(1)}%)`);
});

// 4. Check if zones data exists
console.log('\n\n4. ENROLLMENT ZONES DATA:');
const zonesFile = path.join(__dirname, 'Enrollment Zones/DPSSchools_Geocoded.xlsx');
console.log('Geocoded file exists:', fs.existsSync(zonesFile));

// Check for actual zone boundary files
const zoneFiles = fs.readdirSync(path.join(__dirname, 'Enrollment Zones'))
  .filter(f => f.includes('Boundary') || f.includes('Zone'));
console.log('\nZone/Boundary files:');
zoneFiles.forEach(file => {
  console.log(`  - ${file}`);
});