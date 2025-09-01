const data = require('../public/dps_schools_data.json');

const getSchoolType = (school) => {
  const name = school.name.toLowerCase();
  if (name.includes('elementary') || name.includes('elem')) return 'Elementary';
  if (name.includes('middle') || name.includes('ms')) return 'Middle';
  if (name.includes('high school') || name.includes('hs')) return 'High';
  if (name.match(/k-8|k8/)) return 'K-8';
  if (name.match(/k-12|k12/)) return 'K-12';
  if (school.enrollment && school.enrollment['2023']) {
    const enr = school.enrollment['2023'];
    if (enr.high > 0 && enr.middle === 0 && enr.elementary === 0) return 'High';
    if (enr.middle > 0 && enr.high === 0 && enr.elementary === 0) return 'Middle';
    if (enr.elementary > 0 && enr.middle === 0 && enr.high === 0) return 'Elementary';
    if (enr.elementary > 0 && enr.middle > 0 && enr.high === 0) return 'K-8';
    if (enr.elementary > 0 && enr.middle > 0 && enr.high > 0) return 'K-12';
  }
  return 'Other';
};

const typeCounts = {};
const schoolsByType = {};

data.schools.forEach(school => {
  const type = getSchoolType(school);
  typeCounts[type] = (typeCounts[type] || 0) + 1;
  if (!schoolsByType[type]) schoolsByType[type] = [];
  schoolsByType[type].push(school.name);
});

const total = data.schools.length;
console.log('Total schools:', total);
console.log('\nSchool type breakdown:');
Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`${type}: ${count} schools (${(count/total*100).toFixed(1)}%)`);
});

const totalPercentage = Object.values(typeCounts).reduce((sum, count) => sum + count/total*100, 0);
console.log(`\nTotal percentage: ${totalPercentage.toFixed(1)}%`);

// Show some examples of "Other" schools
console.log('\nExamples of "Other" schools:');
if (schoolsByType['Other']) {
  schoolsByType['Other'].slice(0, 10).forEach(name => console.log(`  - ${name}`));
}