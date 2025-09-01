const data = require('../public/dps_schools_data.json');

// Check what grade data looks like for schools marked as "Other"
console.log('Analyzing schools without clear type indicators...\n');

let count = 0;
data.schools.forEach(school => {
  const name = school.name.toLowerCase();
  const hasTypeInName = name.includes('elementary') || name.includes('elem') || 
                       name.includes('middle') || name.includes('ms') ||
                       name.includes('high school') || name.includes('hs') ||
                       name.match(/k-8|k8/) || name.match(/k-12|k12/);
  
  if (!hasTypeInName && count < 20) {
    console.log(`\n${school.name}:`);
    if (school.enrollment && school.enrollment['2023']) {
      const enr = school.enrollment['2023'];
      console.log(`  Total: ${enr.total}`);
      console.log(`  Elementary (K-5): ${enr.elementary || 0}`);
      console.log(`  Middle (6-8): ${enr.middle || 0}`);
      console.log(`  High (9-12): ${enr.high || 0}`);
      
      // Determine type based on enrollment
      if (enr.elementary > 0 && enr.middle === 0 && enr.high === 0) {
        console.log(`  -> Should be: Elementary`);
      } else if (enr.middle > 0 && enr.elementary === 0 && enr.high === 0) {
        console.log(`  -> Should be: Middle`);
      } else if (enr.high > 0 && enr.middle === 0 && enr.elementary === 0) {
        console.log(`  -> Should be: High`);
      } else if (enr.elementary > 0 && enr.middle > 0 && enr.high === 0) {
        console.log(`  -> Should be: K-8`);
      } else if ((enr.elementary > 0 || enr.middle > 0) && enr.high > 0) {
        console.log(`  -> Should be: K-12`);
      } else {
        console.log(`  -> Type unclear`);
      }
    } else {
      console.log('  No 2023 enrollment data');
    }
    count++;
  }
});