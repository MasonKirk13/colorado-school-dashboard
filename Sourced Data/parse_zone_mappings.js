const fs = require('fs');
const path = require('path');

console.log('Parsing zone mappings from text file...\n');

const filePath = path.join(__dirname, 'Enrollment Zones/zone_mappings.txt');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const zoneMappings = {};

let currentZone = null;
let currentLevel = null; // elementary, middle, high

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Skip empty lines
  if (!line) continue;
  
  // Detect school level
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
  
  // Detect zone headers
  if (line.match(/^[A-Z][a-zA-Z\s\/\-]+$/) && !line.includes('The schools below') && !line.includes('Grades Offered') && !line.includes('School Type') && !line.includes('School Profile') && !line.includes('Printable Zone List') && !line.includes('*ECE offered')) {
    // This looks like a zone name
    currentZone = line;
    const zoneKey = `${line} (${currentLevel})`;
    if (!zoneMappings[zoneKey]) {
      zoneMappings[zoneKey] = [];
    }
    continue;
  }
  
  // Skip description lines
  if (line.includes('The schools below are in the') || line.includes('Printable Zone List') || line.includes('Proximity Zone Maps') || line.includes('*ECE offered')) {
    continue;
  }
  
  // Skip address and detail lines
  if (line.match(/^\d+/) || line.includes('Grades Offered:') || line.includes('School Type:') || line.includes('School Profile') || line.includes('ECE-') || line.includes('guaranteed')) {
    continue;
  }
  
  // Skip navigation elements
  if (line.includes('•\t')) {
    continue;
  }
  
  // This should be a school name
  if (currentZone && currentLevel && line.length > 3) {
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

// Save as JSON for easier use
const outputPath = path.join(__dirname, 'parsed_zone_mappings.json');
fs.writeFileSync(outputPath, JSON.stringify(zoneMappings, null, 2));
console.log(`\nSaved parsed mappings to: ${outputPath}`);

// Also create a flattened version for easy lookup
const schoolToZone = {};
Object.entries(zoneMappings).forEach(([zone, schools]) => {
  schools.forEach(school => {
    schoolToZone[school.toLowerCase().trim()] = zone;
  });
});

const lookupPath = path.join(__dirname, 'school_to_zone_lookup.json');
fs.writeFileSync(lookupPath, JSON.stringify(schoolToZone, null, 2));
console.log(`Saved school-to-zone lookup to: ${lookupPath}`);