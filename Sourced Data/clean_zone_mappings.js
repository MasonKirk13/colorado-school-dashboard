const fs = require('fs');
const path = require('path');

console.log('Cleaning zone mappings to remove addresses...\n');

const filePath = path.join(__dirname, 'parsed_zone_mappings.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const cleanedMappings = {};
const schoolToZone = {};

Object.entries(data).forEach(([zone, items]) => {
  const schoolNames = items.filter(item => {
    // Filter out addresses (lines that start with numbers or contain typical address patterns)
    if (item.match(/^\d+/)) return false; // Starts with number
    if (item.includes('Ave.') || item.includes('St.') || item.includes('Blvd') || item.includes('Ct.') || item.includes('Pl.') || item.includes('Way') || item.includes('Dr.')) return false;
    if (item.includes('School Profile') || item.includes('School Website')) return false;
    if (item.includes('Grades Offered:') || item.includes('School Type:')) return false;
    if (item.includes('Elementary enrollment zones have school proximity')) return false;
    if (item.length < 5) return false; // Too short to be a school name
    
    return true;
  });
  
  if (schoolNames.length > 0) {
    cleanedMappings[zone] = schoolNames;
    
    // Create lookup mapping
    schoolNames.forEach(school => {
      const cleanSchool = school.toLowerCase().trim();
      schoolToZone[cleanSchool] = zone;
    });
  }
});

console.log('Cleaned Zone Mappings:');
Object.entries(cleanedMappings).forEach(([zone, schools]) => {
  console.log(`\n${zone}:`);
  schools.forEach(school => console.log(`  - ${school}`));
});

// Save cleaned mappings
const cleanedPath = path.join(__dirname, 'cleaned_zone_mappings.json');
fs.writeFileSync(cleanedPath, JSON.stringify(cleanedMappings, null, 2));
console.log(`\nSaved cleaned mappings to: ${cleanedPath}`);

// Save school-to-zone lookup
const lookupPath = path.join(__dirname, 'cleaned_school_to_zone_lookup.json');
fs.writeFileSync(lookupPath, JSON.stringify(schoolToZone, null, 2));
console.log(`Saved cleaned school-to-zone lookup to: ${lookupPath}`);

// Count schools per zone
console.log('\nSchool counts per zone:');
Object.entries(cleanedMappings).forEach(([zone, schools]) => {
  console.log(`  ${zone}: ${schools.length} schools`);
});