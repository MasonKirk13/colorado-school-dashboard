const data = require('../public/dps_schools_data_multi_year.json');

console.log('Testing worst schools sorting for 2023-2024...\n');

const selectedYear = '2023-2024';
const selectedMetric = 'attendance'; // Test attendance mode first

const filteredSchools = data.schools.slice(0, 20); // Test with first 20 schools

const worstSchools = filteredSchools
  .filter(school => {
    const att = school.attendance[selectedYear];
    return att && (att.chronicAbsentRate !== null || att.attendanceRate !== null);
  })
  .map(school => {
    const att = school.attendance[selectedYear];
    let attendanceRate;
    let displayMetric;
    
    if (selectedYear === '2023-2024') {
      if (selectedMetric === 'chronic' && att.chronicAbsentRate !== null) {
        const chronicRate = parseFloat(att.chronicAbsentRate);
        attendanceRate = 1 - chronicRate; // For sorting only
        displayMetric = chronicRate;
      } else if (att.attendanceRate !== null) {
        attendanceRate = parseFloat(att.attendanceRate);
        displayMetric = attendanceRate;
      }
    } else if (att.attendanceRate !== null) {
      attendanceRate = parseFloat(att.attendanceRate);
      displayMetric = attendanceRate;
    }
    
    return { name: school.name, attendanceRate, displayMetric };
  })
  .filter(school => school.attendanceRate !== undefined)
  .sort((a, b) => {
    // For chronic absenteeism mode, sort by highest chronic rates (worst first)
    // For attendance mode, sort by lowest attendance rates (worst first)
    if (selectedYear === '2023-2024' && selectedMetric === 'chronic') {
      return b.displayMetric - a.displayMetric; // Highest chronic rates first
    } else {
      return a.attendanceRate - b.attendanceRate; // Lowest attendance rates first
    }
  })
  .slice(0, 10);

console.log(`Worst schools (${selectedMetric} mode):`);
worstSchools.forEach((school, index) => {
  console.log(`${index + 1}. ${school.name}`);
  console.log(`   Attendance Rate: ${(school.attendanceRate * 100).toFixed(1)}%`);
  console.log(`   Display Metric: ${(school.displayMetric * 100).toFixed(1)}%`);
  console.log('');
});

// Now test chronic mode
console.log('\n--- Testing Chronic Mode ---\n');
const selectedMetricChronic = 'chronic';

const worstSchoolsChronic = filteredSchools
  .filter(school => {
    const att = school.attendance[selectedYear];
    return att && (att.chronicAbsentRate !== null || att.attendanceRate !== null);
  })
  .map(school => {
    const att = school.attendance[selectedYear];
    let attendanceRate;
    let displayMetric;
    
    if (selectedYear === '2023-2024') {
      if (selectedMetricChronic === 'chronic' && att.chronicAbsentRate !== null) {
        const chronicRate = parseFloat(att.chronicAbsentRate);
        attendanceRate = 1 - chronicRate; // For sorting only
        displayMetric = chronicRate;
      } else if (att.attendanceRate !== null) {
        attendanceRate = parseFloat(att.attendanceRate);
        displayMetric = attendanceRate;
      }
    } else if (att.attendanceRate !== null) {
      attendanceRate = parseFloat(att.attendanceRate);
      displayMetric = attendanceRate;
    }
    
    return { name: school.name, attendanceRate, displayMetric };
  })
  .filter(school => school.attendanceRate !== undefined)
  .sort((a, b) => {
    // For chronic absenteeism mode, sort by highest chronic rates (worst first)
    // For attendance mode, sort by lowest attendance rates (worst first)
    if (selectedYear === '2023-2024' && selectedMetricChronic === 'chronic') {
      return b.displayMetric - a.displayMetric; // Highest chronic rates first
    } else {
      return a.attendanceRate - b.attendanceRate; // Lowest attendance rates first
    }
  })
  .slice(0, 10);

console.log(`Worst schools (${selectedMetricChronic} mode):`);
worstSchoolsChronic.forEach((school, index) => {
  console.log(`${index + 1}. ${school.name}`);
  console.log(`   Attendance Rate: ${(school.attendanceRate * 100).toFixed(1)}%`);
  console.log(`   Display Metric (Chronic): ${(school.displayMetric * 100).toFixed(1)}%`);
  console.log('');
});