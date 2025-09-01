const data = require('../public/dps_schools_data_multi_year.json');

console.log('Testing 2023-2024 actual attendance statistics...\n');

let totalStudents = 0;
let totalDaysExpected = 0;
let totalDaysMissed = 0;
let schoolsBelow90 = 0;
let schoolsBelow80 = 0;
let schoolsBelow70 = 0;

data.schools.forEach(school => {
  const attendance = school.attendance['2023-2024'];
  if (attendance && attendance.attendanceRate !== null) {
    const studentCount = parseInt(attendance.studentCount) || 0;
    const attendRate = parseFloat(attendance.attendanceRate);
    
    totalStudents += studentCount;
    
    if (attendRate < 0.90) schoolsBelow90++;
    if (attendRate < 0.80) schoolsBelow80++;
    if (attendRate < 0.70) schoolsBelow70++;
    
    const daysInSession = 180;
    totalDaysExpected += studentCount * daysInSession;
    totalDaysMissed += studentCount * daysInSession * (1 - attendRate);
  }
});

const overallAttendanceRate = totalDaysExpected > 0 
  ? ((totalDaysExpected - totalDaysMissed) / totalDaysExpected * 100).toFixed(1)
  : 0;

console.log('2023-2024 using ACTUAL attendance rates:');
console.log(`  Students: ${totalStudents.toLocaleString()}`);
console.log(`  Overall Attendance: ${overallAttendanceRate}%`);
console.log(`  Schools <90%: ${schoolsBelow90}`);
console.log(`  Schools <80%: ${schoolsBelow80}`);
console.log(`  Schools <70%: ${schoolsBelow70}`);

// Also test chronic mode
totalStudents = 0;
totalDaysExpected = 0;
totalDaysMissed = 0;
schoolsBelow90 = 0;
schoolsBelow80 = 0;
schoolsBelow70 = 0;

data.schools.forEach(school => {
  const attendance = school.attendance['2023-2024'];
  if (attendance && attendance.chronicAbsentRate !== null) {
    const studentCount = parseInt(attendance.studentCount) || 0;
    const chronicRate = parseFloat(attendance.chronicAbsentRate);
    const attendRate = 1 - chronicRate;
    
    totalStudents += studentCount;
    
    if (attendRate < 0.90) schoolsBelow90++;
    if (attendRate < 0.80) schoolsBelow80++;
    if (attendRate < 0.70) schoolsBelow70++;
    
    const daysInSession = 180;
    totalDaysExpected += studentCount * daysInSession;
    totalDaysMissed += studentCount * daysInSession * chronicRate;
  }
});

const overallAttendanceRate2 = totalDaysExpected > 0 
  ? ((totalDaysExpected - totalDaysMissed) / totalDaysExpected * 100).toFixed(1)
  : 0;

console.log('\n2023-2024 using CHRONIC ABSENTEEISM (converted):');
console.log(`  Students: ${totalStudents.toLocaleString()}`);
console.log(`  Overall Attendance: ${overallAttendanceRate2}%`);
console.log(`  Schools <90%: ${schoolsBelow90}`);
console.log(`  Schools <80%: ${schoolsBelow80}`);
console.log(`  Schools <70%: ${schoolsBelow70}`);