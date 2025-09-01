const data = require('../public/dps_schools_data_multi_year.json');

console.log('2023-2024 Data Comparison for sample schools:\n');

// Get schools that have both chronic and attendance data
const schoolsWithBoth = data.schools.filter(school => {
  const att = school.attendance['2023-2024'];
  return att && att.chronicAbsentRate !== null && att.attendanceRate !== null;
}).slice(0, 10);

schoolsWithBoth.forEach(school => {
  const att = school.attendance['2023-2024'];
  const chronicRate = parseFloat(att.chronicAbsentRate);
  const actualAttendance = parseFloat(att.attendanceRate);
  const calculatedAttendance = 1 - chronicRate;
  
  console.log(`${school.name}:`);
  console.log(`  Chronic Absenteeism: ${(chronicRate * 100).toFixed(1)}%`);
  console.log(`  Actual Attendance Rate: ${(actualAttendance * 100).toFixed(1)}%`);
  console.log(`  Calculated (1-chronic): ${(calculatedAttendance * 100).toFixed(1)}%`);
  console.log(`  Difference: ${((actualAttendance - calculatedAttendance) * 100).toFixed(1)}%\n`);
});