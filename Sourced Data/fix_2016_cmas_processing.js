#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Normalize district name function
function normalizeDistrictName(name) {
  if (!name) return name;
  
  return name.trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\b(\d+)\w\b/g, match => match.toUpperCase())
    .replace(/\bRe\b/g, 'RE')
    .replace(/\bRe-/g, 'RE-');
}

console.log('Fixing 2016 CMAS data processing...\n');

// Load current data
const currentDataPath = path.join(__dirname, '../public/district_data_complete.json');
const currentData = JSON.parse(fs.readFileSync(currentDataPath, 'utf8'));

// Process the 2016 CMAS file
const filePath = path.join(__dirname, 'General CMAS Score Data/2016 ELA Math District and School Summary final.xlsx');
const workbook = XLSX.readFile(filePath);

// Collect all 2016 results
const results2016 = [];

workbook.SheetNames.forEach(sheetName => {
  console.log(`Processing ${sheetName} sheet...`);
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Find header row
  let headerRow = -1;
  for (let i = 0; i < 10; i++) {
    if (rawData[i] && rawData[i][0] === 'Level') {
      headerRow = i;
      break;
    }
  }
  
  if (headerRow === -1) {
    console.log('  No header found');
    return;
  }
  
  console.log(`  Found header at row ${headerRow}`);
  
  // Process ALL district rows (no limit)
  let districtCount = 0;
  for (let i = headerRow + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row[0] !== 'DISTRICT') continue;
    
    const districtName = row[2];
    const grade = row[6] || row[7];
    const subject = row[5];
    const percent = row[23]; // % Met or Exceeded Expectations column
    
    if (!districtName || !grade) continue;
    
    // Only process grade rows (skip any summary rows)
    if (grade.includes('Grade') || grade.includes('Algebra') || grade.includes('Geometry') || grade.includes('Integrated')) {
      if (percent !== '*' && percent !== undefined && percent !== null && percent !== '') {
        const percentNum = parseFloat(percent);
        if (!isNaN(percentNum)) {
          let subjectName = subject || '';
          if (sheetName === 'ELA' || subjectName.includes('ELA')) {
            subjectName = 'English Language Arts';
          } else if (sheetName === 'MATH' || subjectName.includes('Math')) {
            subjectName = 'Mathematics';
          }
          
          results2016.push({
            district: normalizeDistrictName(districtName),
            subject: subjectName,
            year: '2016',
            percent: percentNum,
            grade: grade
          });
          districtCount++;
        }
      }
    }
  }
  
  console.log(`  Found ${districtCount} valid district records`);
});

console.log(`\nTotal 2016 records: ${results2016.length}`);

// Group by district and calculate averages
const districtAverages = {};

results2016.forEach(result => {
  if (!districtAverages[result.district]) {
    districtAverages[result.district] = {
      scores: [],
      subjects: new Set()
    };
  }
  districtAverages[result.district].scores.push(result.percent);
  districtAverages[result.district].subjects.add(result.subject);
});

// Calculate final averages
const final2016Data = {};
Object.entries(districtAverages).forEach(([district, data]) => {
  const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
  final2016Data[district] = Math.round(avgScore * 10) / 10;
});

console.log(`\nProcessed ${Object.keys(final2016Data).length} districts for 2016`);

// Update the current data with 2016 CMAS scores
let updateCount = 0;
let addCount = 0;

Object.entries(currentData).forEach(([districtName, districtData]) => {
  const normalizedName = normalizeDistrictName(districtName);
  
  if (final2016Data[normalizedName] && districtData.cmas_scores) {
    // Check if 2016 already exists
    const existing2016 = districtData.cmas_scores.find(s => s.year === '2016');
    
    if (existing2016) {
      // Update existing
      if (existing2016.met_or_exceeded_pct !== final2016Data[normalizedName]) {
        console.log(`Updating ${districtName}: ${existing2016.met_or_exceeded_pct} -> ${final2016Data[normalizedName]}`);
        existing2016.met_or_exceeded_pct = final2016Data[normalizedName];
        updateCount++;
      }
    } else {
      // Add new 2016 entry
      districtData.cmas_scores.push({
        year: '2016',
        met_or_exceeded_pct: final2016Data[normalizedName]
      });
      districtData.cmas_scores.sort((a, b) => a.year.localeCompare(b.year));
      addCount++;
    }
  }
});

// Save updated data
fs.writeFileSync(currentDataPath, JSON.stringify(currentData, null, 2));

console.log(`\n2016 CMAS data fix complete:`);
console.log(`- Updated: ${updateCount} districts`);
console.log(`- Added: ${addCount} districts`);
console.log(`- Total with 2016 data: ${updateCount + addCount} districts`);

// Verify some results
console.log('\nVerification - Sample districts:');
['Denver County 1', 'Academy 20', 'Jefferson County R-1', 'Cherry Creek 5'].forEach(name => {
  const district = currentData[name];
  if (district && district.cmas_scores) {
    const cmas2016 = district.cmas_scores.find(s => s.year === '2016');
    console.log(`  ${name}: ${cmas2016 ? cmas2016.met_or_exceeded_pct + '%' : 'MISSING'}`);
  }
});