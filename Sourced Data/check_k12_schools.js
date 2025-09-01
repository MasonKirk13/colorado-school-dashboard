const data = require('../public/dps_schools_data.json');

const getSchoolType = (school) => {
  const name = school.name.toLowerCase();
  
  // Direct name matches
  if (name.includes('elementary') || name.includes('elem')) return 'Elementary';
  if (name.includes('middle school') || name.includes(' ms') || name.includes(' ms ')) return 'Middle';
  if (name.includes('high school') || name.includes(' hs') || name.includes(' hs ')) return 'High';
  if (name.match(/k-8|k8|prek-8|ece-8/)) return 'K-8';
  if (name.match(/k-12|k12|6-12/)) return 'K-12';
  
  // Common DPS patterns
  if (name.includes('early college')) return 'High';
  if (name.includes('academy') && !name.includes('prep')) return 'K-8';
  if (name.includes('prep')) return 'High';
  if (name.includes('montessori')) return 'Elementary';
  if (name.includes('international') && !name.includes('high')) return 'K-8';
  if (name.includes('ece-')) return 'Elementary';
  
  // If still unclear, use category to help
  if (school.category) {
    const cat = school.category.toLowerCase();
    if (cat.includes('pathways')) return 'High';
  }
  
  return 'Other';
};

// Check for K-12 schools
const k12Schools = data.schools.filter(school => {
  const type = getSchoolType(school);
  return type === 'K-12' || school.name.toLowerCase().includes('k-12') || 
         school.name.toLowerCase().includes('k12') || 
         school.name.toLowerCase().includes('6-12');
});

console.log('K-12 Schools found:', k12Schools.length);
if (k12Schools.length > 0) {
  console.log('\nK-12 Schools:');
  k12Schools.forEach(school => {
    console.log(`  - ${school.name}`);
  });
} else {
  console.log('No K-12 schools found - safe to remove this option');
}

// Also check for 6-12 schools which might be miscategorized
const sixTwelve = data.schools.filter(school => 
  school.name.toLowerCase().includes('6-12')
);

if (sixTwelve.length > 0) {
  console.log('\n6-12 Schools (should be K-12 or Middle/High):');
  sixTwelve.forEach(school => {
    console.log(`  - ${school.name}`);
  });
}