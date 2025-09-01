const data = require('../public/dps_schools_data_multi_year.json');

// Sample a few schools to compare their data across years
const sampleSchools = data.schools.slice(0, 5);

console.log('=== DATA COMPARISON FOR SAMPLE SCHOOLS ===\n');

sampleSchools.forEach(school => {
  console.log(`School: ${school.name}`);
  
  Object.keys(school.attendance).sort().forEach(year => {
    const att = school.attendance[year];
    if (att.chronicAbsentRate !== null) {
      const attendanceFromChronic = (1 - parseFloat(att.chronicAbsentRate)) * 100;
      console.log(`  ${year}: Chronic Absent ${(parseFloat(att.chronicAbsentRate) * 100).toFixed(1)}% → Attendance ${attendanceFromChronic.toFixed(1)}%`);
    } else if (att.attendanceRate !== null) {
      console.log(`  ${year}: Direct Attendance ${(parseFloat(att.attendanceRate) * 100).toFixed(1)}%`);
    }
  });
  console.log('');
});

// Check overall district statistics
console.log('\n=== DISTRICT-WIDE STATISTICS ===\n');

const years = ['2019-2020', '2020-2021', '2021-2022', '2022-2023', '2023-2024'];

years.forEach(year => {
  let totalStudents = 0;
  let totalDaysExpected = 0;
  let totalDaysMissed = 0;
  let schoolsBelow90 = 0;
  let schoolsBelow80 = 0;
  let schoolsBelow70 = 0;
  
  data.schools.forEach(school => {
    const attendance = school.attendance[year];
    if (attendance && attendance.studentCount) {
      const studentCount = parseInt(attendance.studentCount) || 0;
      totalStudents += studentCount;
      
      if (year === '2023-2024' && attendance.chronicAbsentRate !== null) {
        const chronicRate = parseFloat(attendance.chronicAbsentRate);
        const attendRate = 1 - chronicRate;
        
        if (attendRate < 0.90) schoolsBelow90++;
        if (attendRate < 0.80) schoolsBelow80++;
        if (attendRate < 0.70) schoolsBelow70++;
        
        const daysInSession = 180;
        totalDaysExpected += studentCount * daysInSession;
        totalDaysMissed += studentCount * daysInSession * chronicRate;
        
      } else if (attendance.attendanceRate !== null) {
        const attendRate = parseFloat(attendance.attendanceRate);
        
        if (attendRate < 0.90) schoolsBelow90++;
        if (attendRate < 0.80) schoolsBelow80++;
        if (attendRate < 0.70) schoolsBelow70++;
        
        const daysInSession = 180;
        totalDaysExpected += studentCount * daysInSession;
        totalDaysMissed += studentCount * daysInSession * (1 - attendRate);
      }
    }
  });
  
  const overallAttendanceRate = totalDaysExpected > 0 
    ? ((totalDaysExpected - totalDaysMissed) / totalDaysExpected * 100).toFixed(1)
    : 0;
  
  console.log(`${year}:`);
  console.log(`  Students: ${totalStudents.toLocaleString()}`);
  console.log(`  Overall Attendance: ${overallAttendanceRate}%`);
  console.log(`  Schools <90%: ${schoolsBelow90}`);
  console.log(`  Schools <80%: ${schoolsBelow80}`);
  console.log(`  Schools <70%: ${schoolsBelow70}`);
  console.log('');
});