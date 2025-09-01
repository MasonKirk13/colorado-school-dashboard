#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// More robust header finding
function findHeaderRow(rawData) {
  for (let i = 0; i < Math.min(rawData.length, 50); i++) {
    if (rawData[i] && Array.isArray(rawData[i])) {
      const row = rawData[i];
      // Look for rows that have multiple key column headers
      let hasLevel = false;
      let hasDistrict = false;
      let hasGrade = false;
      
      row.forEach(cell => {
        if (cell) {
          const cellStr = cell.toString().toLowerCase();
          if (cellStr === 'level') hasLevel = true;
          if (cellStr.includes('district name') || cellStr === 'organization name') hasDistrict = true;
          if (cellStr === 'grade' || cellStr === 'grade level') hasGrade = true;
        }
      });
      
      if (hasLevel && hasDistrict && hasGrade) {
        return i;
      }
    }
  }
  return -1;
}

// Process each CMAS file
function processCMASFile(filePath, fileName) {
  console.log(`Processing ${fileName}...`);
  const results = [];
  
  try {
    const workbook = XLSX.readFile(filePath);
    const year = fileName.match(/(\d{4})/)?.[1];
    if (!year) {
      console.log(`  Warning: Could not extract year from filename`);
      return results;
    }
    
    // Process each sheet
    workbook.SheetNames.forEach(sheetName => {
      console.log(`  Processing sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const headerRowIndex = findHeaderRow(rawData);
      if (headerRowIndex === -1) {
        console.log(`    Warning: Could not find header row in sheet ${sheetName}`);
        return;
      }
      
      console.log(`    Found header row at index ${headerRowIndex}`);
      const headers = rawData[headerRowIndex];
      
      // Find column indices
      const levelIdx = headers.findIndex(h => h && h.toString().toLowerCase() === 'level');
      const districtIdx = headers.findIndex(h => h && 
        (h.toString().toLowerCase() === 'district name' || 
         h.toString().toLowerCase() === 'organization name'));
      const gradeIdx = headers.findIndex(h => h && 
        (h.toString().toLowerCase() === 'grade' || 
         h.toString().toLowerCase() === 'grade level'));
      const subjectIdx = headers.findIndex(h => h && 
        (h.toString().toLowerCase() === 'content' || 
         h.toString().toLowerCase() === 'subject' ||
         h.toString().toLowerCase() === 'content area'));
      
      console.log(`    Column indices - Level: ${levelIdx}, District: ${districtIdx}, Grade: ${gradeIdx}, Subject: ${subjectIdx}`);
      
      // Find percent columns - look for "% Met or Exceeded" or "Percent Met or Exceeded"
      const percentIdx = headers.findIndex(h => h && 
        (h.toString().toLowerCase().includes('% met or exceeded') ||
         h.toString().toLowerCase().includes('percent met or exceeded')));
      
      if (percentIdx === -1) {
        console.log(`    Warning: Could not find percent column`);
        return;
      }
      
      console.log(`    Percent column at index ${percentIdx}: "${headers[percentIdx]}"`);
      
      // Process data rows
      let districtCount = 0;
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || !row[levelIdx]) continue;
        
        if (row[levelIdx] === 'DISTRICT' && row[gradeIdx] === 'All Grades') {
          const district = row[districtIdx];
          const subject = row[subjectIdx] || 'Combined';
          const percentValue = row[percentIdx];
          
          if (district) {
            // Parse percent value - handle various formats
            let percent = 0;
            if (percentValue !== null && percentValue !== undefined && percentValue !== '') {
              if (typeof percentValue === 'number') {
                percent = percentValue;
              } else {
                // Remove % sign and parse
                percent = parseFloat(percentValue.toString().replace('%', '').trim());
              }
            }
            
            if (!isNaN(percent)) {
              results.push({
                district: district.trim(),
                subject: subject,
                year: year,
                percent: percent
              });
              districtCount++;
            }
          }
        }
      }
      console.log(`    Found ${districtCount} district records`);
    });
    
  } catch (error) {
    console.log(`  Error processing file: ${error.message}`);
  }
  
  return results;
}

// Main processing
function processAllCMAS() {
  const cmasDir = path.join(__dirname, 'General CMAS Score Data');
  const files = fs.readdirSync(cmasDir)
    .filter(f => f.endsWith('.xlsx') && !f.includes('inspect'))
    .sort();
  
  const allResults = [];
  
  files.forEach(file => {
    const filePath = path.join(cmasDir, file);
    const results = processCMASFile(filePath, file);
    allResults.push(...results);
  });
  
  return allResults;
}

// Combine by district and year
function combineCMASData(results) {
  const combined = {};
  
  results.forEach(result => {
    if (!combined[result.district]) {
      combined[result.district] = {};
    }
    
    if (!combined[result.district][result.year]) {
      combined[result.district][result.year] = {
        subjects: [],
        total: 0
      };
    }
    
    combined[result.district][result.year].subjects.push(result.percent);
    combined[result.district][result.year].total += result.percent;
  });
  
  // Calculate averages
  const finalCMAS = {};
  Object.entries(combined).forEach(([district, years]) => {
    finalCMAS[district] = {};
    Object.entries(years).forEach(([year, data]) => {
      const avg = data.total / data.subjects.length;
      finalCMAS[district][year] = Math.round(avg * 10) / 10;
    });
  });
  
  return finalCMAS;
}

// Process enrollment data
function processEnrollmentData() {
  console.log('\nProcessing enrollment data...');
  const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
  const districtEnrollment = {};
  
  try {
    const workbook = XLSX.readFile(filePath);
    
    workbook.SheetNames.forEach(sheetName => {
      if (sheetName.includes('Cheat Sheet')) return;
      
      const yearMatch = sheetName.match(/(\d{4})-\d{4}/);
      if (!yearMatch) return;
      const year = yearMatch[1];
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      data.forEach(row => {
        const districtName = row['Organization Name'];
        if (!districtName) return;
        
        if (!districtEnrollment[districtName]) {
          districtEnrollment[districtName] = {};
        }
        
        if (!districtEnrollment[districtName][year]) {
          districtEnrollment[districtName][year] = {
            enrollment: 0,
            freeLunch: 0,
            reducedLunch: 0,
            schools: 0
          };
        }
        
        districtEnrollment[districtName][year].enrollment += row['PK-12 Total'] || 0;
        districtEnrollment[districtName][year].freeLunch += row['Free Lunch'] || 0;
        districtEnrollment[districtName][year].reducedLunch += row['Reduced Lunch'] || 0;
        districtEnrollment[districtName][year].schools += 1;
      });
    });
    
    // Calculate FRL percentages
    Object.keys(districtEnrollment).forEach(district => {
      Object.keys(districtEnrollment[district]).forEach(year => {
        const data = districtEnrollment[district][year];
        const frlTotal = data.freeLunch + data.reducedLunch;
        data.frlPercent = data.enrollment > 0 ? 
          Math.round((frlTotal / data.enrollment) * 1000) / 10 : 0;
      });
    });
    
    return districtEnrollment;
    
  } catch (error) {
    console.error('Error processing enrollment data:', error.message);
    return {};
  }
}

// Combine all data
function combineAllData(enrollmentData, cmasData) {
  console.log('\nCombining all data...');
  const finalData = {};
  
  const allDistricts = new Set([
    ...Object.keys(enrollmentData),
    ...Object.keys(cmasData)
  ]);
  
  allDistricts.forEach(district => {
    finalData[district] = {
      enrollment_trends: [],
      cmas_scores: []
    };
    
    if (enrollmentData[district]) {
      Object.entries(enrollmentData[district]).forEach(([year, data]) => {
        finalData[district].enrollment_trends.push({
          year: year,
          enrollment: data.enrollment,
          frl: data.frlPercent
        });
      });
      finalData[district].enrollment_trends.sort((a, b) => a.year.localeCompare(b.year));
    }
    
    if (cmasData[district]) {
      Object.entries(cmasData[district]).forEach(([year, percent]) => {
        finalData[district].cmas_scores.push({
          year: year,
          met_or_exceeded_pct: percent
        });
      });
      
      // Add COVID notes
      if (!finalData[district].cmas_scores.find(s => s.year === '2020')) {
        finalData[district].cmas_scores.push({
          year: '2020',
          met_or_exceeded_pct: null,
          note: 'No testing due to COVID-19'
        });
      }
      if (!finalData[district].cmas_scores.find(s => s.year === '2021')) {
        finalData[district].cmas_scores.push({
          year: '2021',
          met_or_exceeded_pct: null,
          note: 'Limited testing due to COVID-19'
        });
      }
      
      finalData[district].cmas_scores.sort((a, b) => a.year.localeCompare(b.year));
    }
  });
  
  return finalData;
}

// Main execution
async function main() {
  console.log('Reprocessing all Colorado district data...\n');
  
  // Process CMAS data
  const cmasResults = processAllCMAS();
  console.log(`\nFound ${cmasResults.length} CMAS data points`);
  
  // Show year distribution
  const yearCounts = {};
  cmasResults.forEach(r => {
    yearCounts[r.year] = (yearCounts[r.year] || 0) + 1;
  });
  console.log('\nCMAS data by year:');
  Object.entries(yearCounts).sort().forEach(([year, count]) => {
    console.log(`  ${year}: ${count} records`);
  });
  
  const cmasData = combineCMASData(cmasResults);
  console.log(`\nProcessed CMAS data for ${Object.keys(cmasData).length} districts`);
  
  // Process enrollment data
  const enrollmentData = processEnrollmentData();
  console.log(`Processed enrollment data for ${Object.keys(enrollmentData).length} districts`);
  
  // Combine all data
  const finalData = combineAllData(enrollmentData, cmasData);
  
  // Save the complete dataset
  const outputPath = path.join(__dirname, '../public/district_data_complete_reprocessed.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
  
  console.log(`\nSaved reprocessed data to: ${outputPath}`);
  console.log(`Total districts: ${Object.keys(finalData).length}`);
  
  // Show sample
  const sampleDistrict = 'Academy 20';
  if (finalData[sampleDistrict]) {
    console.log(`\nSample - ${sampleDistrict}:`);
    console.log('CMAS years:', finalData[sampleDistrict].cmas_scores.map(c => c.year).join(', '));
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}