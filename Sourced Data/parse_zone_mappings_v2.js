const fs = require('fs');
const path = require('path');

console.log('Parsing zone mappings from text file (v2)...\n');

const filePath = path.join(__dirname, 'Enrollment Zones/zone_mappings.txt');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const zoneMappings = {};

let currentZone = null;
let currentLevel = null;
let inSchoolList = false;

// Known zone names to help with parsing
const knownZones = [
  'Central East', 'Central Park-Area', 'Far Southeast', 'Gateway', 
  'Greater Five Points/Central', 'Northwest', 'Southwest/Central', 'Tower',
  'Far Northeast', 'Greater Park Hill/Central Park', 'Near Northeast', 
  'Southwest', 'West Denver'
];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Skip empty lines
  if (!line) continue;
  
  // Detect school levels
  if (line.includes('Elementary School Enrollment Zones')) {
    currentLevel = 'Elementary';
    continue;
  }
  if (line.includes('Middle School Enrollment Zones')) {
    currentLevel = 'Middle';
    continue;
  }
  if (line.includes('High School Enrollment Zone')) {
    currentLevel = 'High';
    continue;
  }
  
  // Check if this is a known zone name
  if (knownZones.includes(line)) {
    currentZone = line;
    const zoneKey = `${line} (${currentLevel})`;
    if (!zoneMappings[zoneKey]) {
      zoneMappings[zoneKey] = [];
    }
    inSchoolList = false;
    continue;
  }
  
  // Check if we're starting the school list
  if (line.includes('The schools below are in the')) {
    inSchoolList = true;
    continue;
  }
  
  // Skip various non-school lines
  if (line.includes('Printable Zone List') || 
      line.includes('*ECE offered') || 
      line.includes('Proximity Zone Maps') ||
      line.includes('Grades Offered:') ||
      line.includes('School Type:') ||
      line.includes('School Profile') ||
      line.match(/^\d+.*\.(Ave|St|Blvd|Ct|Pl|Way|Dr)\.?$/) || // addresses
      line.includes('•\t')) {
    continue;
  }
  
  // If we're in a school list and this looks like a school name
  if (inSchoolList && currentZone && currentLevel && line.length > 5) {
    // Skip lines that are clearly not school names
    if (line.includes('(ECE') || line.includes('guaranteed')) {
      continue;
    }
    
    const zoneKey = `${currentZone} (${currentLevel})`;
    if (!zoneMappings[zoneKey]) {
      zoneMappings[zoneKey] = [];
    }
    zoneMappings[zoneKey].push(line);
  }
}

console.log('Parsed Zone Mappings:');
Object.entries(zoneMappings).forEach(([zone, schools]) => {
  console.log(`\n${zone}:`);
  schools.forEach(school => console.log(`  - ${school}`));
});

// Save as JSON
const outputPath = path.join(__dirname, 'parsed_zone_mappings.json');
fs.writeFileSync(outputPath, JSON.stringify(zoneMappings, null, 2));
console.log(`\nSaved parsed mappings to: ${outputPath}`);

// Create school-to-zone lookup
const schoolToZone = {};
Object.entries(zoneMappings).forEach(([zone, schools]) => {
  schools.forEach(school => {
    const cleanSchool = school.toLowerCase().trim();
    schoolToZone[cleanSchool] = zone;
  });
});

const lookupPath = path.join(__dirname, 'school_to_zone_lookup.json');
fs.writeFileSync(lookupPath, JSON.stringify(schoolToZone, null, 2));
console.log(`Saved school-to-zone lookup to: ${lookupPath}`);