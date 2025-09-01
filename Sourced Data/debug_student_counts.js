const data = require('../public/dps_schools_data_multi_year.json');

console.log('Checking student counts for early years...\n');

const years = ['2019-2020', '2020-2021', '2021-2022', '2022-2023'];

years.forEach(year => {
  console.log(`=== ${year} ===`);
  
  let schoolsWithData = 0;
  let schoolsWithStudentCount = 0;
  let totalStudentCount = 0;
  
  const sampleSchools = [];
  
  data.schools.forEach(school => {
    const att = school.attendance[year];
    if (att) {
      schoolsWithData++;
      const studentCount = parseInt(att.studentCount);
      if (!isNaN(studentCount) && studentCount > 0) {
        schoolsWithStudentCount++;
        totalStudentCount += studentCount;
      }
      
      if (sampleSchools.length < 3) {
        sampleSchools.push({
          name: school.name,
          studentCount: att.studentCount,
          attendanceRate: att.attendanceRate
        });
      }
    }
  });
  
  console.log(`Schools with attendance data: ${schoolsWithData}`);
  console.log(`Schools with valid student counts: ${schoolsWithStudentCount}`);
  console.log(`Total students: ${totalStudentCount}`);
  console.log('Sample schools:');
  sampleSchools.forEach(s => {
    console.log(`  ${s.name}: ${s.studentCount} students, ${s.attendanceRate} attendance`);
  });
  console.log('');
});