#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * Unified Data Processor for Colorado District Data
 * 
 * This script combines all data sources into a single consistent output file,
 * preventing the overwrite issues that occur when running individual processors.
 * 
 * Data Sources:
 * 1. CMAS Test Scores (2016-2024) - General CMAS Score Data/*.xlsx
 * 2. Enrollment & FRL Data (2014-2024) - Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx
 * 3. 2016 FRL Data (special case) - Demographic data/2016-17_PK-12_PupilMembership_bySchool_FRL_0.xlsx
 */

// Normalize district name to handle case variations
function normalizeDistrictName(name) {
  if (!name) return name;
  
  return name.trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\b(\d+)\w\b/g, match => match.toUpperCase())
    .replace(/\bRe\b/g, 'RE')
    .replace(/\bRe-/g, 'RE-');
}

// Process 2016/2017 CMAS files (special structure)
function process2016or2017CMASFile(filePath, fileName) {
  console.log(`  Processing ${fileName} (special 2016/2017 format)...`);
  const results = [];
  const year = fileName.match(/(\d{4})/)?.[1];
  if (!year) return results;
  
  try {
    const workbook = XLSX.readFile(filePath);
    
    workbook.SheetNames.forEach(sheetName => {
      if (sheetName.includes('Interpretation')) return;
      
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
      
      if (headerRow === -1) return;
      
      // Process ALL district rows
      let foundDistricts = 0;
      for (let i = headerRow + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row[0] !== 'DISTRICT') continue;
        
        const districtName = row[2];
        const grade = row[6] || row[7];
        const subject = row[5];
        const percent = row[23]; // % Met or Exceeded Expectations
        
        if (!districtName || !grade) continue;
        
        // Process grade rows
        if (grade && (grade.includes('Grade') || grade.includes('Algebra') || 
                     grade.includes('Geometry') || grade.includes('Integrated'))) {
          if (percent !== '*' && percent !== undefined && percent !== null && percent !== '') {
            const percentNum = parseFloat(percent);
            if (!isNaN(percentNum)) {
              let subjectName = subject || '';
              if (sheetName === 'ELA' || subjectName.includes('ELA')) {
                subjectName = 'English Language Arts';
              } else if (sheetName === 'MATH' || subjectName.includes('Math')) {
                subjectName = 'Mathematics';
              }
              
              results.push({
                district: districtName.trim(),
                subject: subjectName,
                year: year,
                percent: percentNum,
                grade: grade
              });
              foundDistricts++;
            }
          }
        }
      }
      console.log(`    Found ${foundDistricts} district records in ${sheetName}`);
    });
  } catch (error) {
    console.log(`    Error: ${error.message}`);
  }
  
  return results;
}

// Process standard CMAS files (2018+)
function processStandardCMASFile(filePath, fileName) {
  console.log(`  Processing ${fileName} (standard format)...`);
  const results = [];
  const year = fileName.match(/(\d{4})/)?.[1];
  if (!year) return results;
  
  try {
    const workbook = XLSX.readFile(filePath);
    
    workbook.SheetNames.forEach(sheetName => {
      if (sheetName.includes('Interpretation')) return;
      
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Find header row
      let headerRowIndex = -1;
      for (let i = 0; i < 50; i++) {
        if (rawData[i] && rawData[i][0] === 'Level' && 
            rawData[i].some(cell => cell && cell.toString().includes('District'))) {
          headerRowIndex = i;
          break;
        }
      }
      
      if (headerRowIndex === -1) return;
      
      const headers = rawData[headerRowIndex];
      
      // Find key columns
      const districtIdx = headers.findIndex(h => h && h.toString() === 'District Name');
      const gradeIdx = headers.findIndex(h => h && (h.toString() === 'Grade' || h.toString() === 'Test/Grade'));
      const subjectIdx = headers.findIndex(h => h && (h.toString() === 'Subject' || h.toString() === 'Content'));
      
      // Find percent column
      let percentIdx = -1;
      if (parseInt(year) >= 2022) {
        percentIdx = headers.findIndex(h => h && h.toString() === year);
      }
      if (percentIdx === -1) {
        percentIdx = headers.findIndex(h => h && 
          (h.toString() === '% Met or Exceeded Expectations' ||
           h.toString() === 'Percent Met or Exceeded Expectations'));
      }
      
      if (percentIdx === -1) return;
      
      // Process data
      let districtCount = 0;
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row[0] !== 'DISTRICT') continue;
        
        const grade = row[gradeIdx];
        const yearsWithoutAllGrades = ['2016', '2017', '2021'];
        
        if (yearsWithoutAllGrades.includes(year)) {
          if (!grade || grade === '') continue;
        } else {
          if (grade !== 'All Grades') continue;
        }
        
        const district = row[districtIdx];
        const subject = row[subjectIdx] || 'Combined';
        const percentValue = row[percentIdx];
        
        if (district && percentValue !== null && percentValue !== undefined && percentValue !== '') {
          const percent = parseFloat(percentValue);
          if (!isNaN(percent)) {
            results.push({
              district: district.trim(),
              subject: subject,
              year: year,
              percent: percent,
              grade: grade
            });
            districtCount++;
          }
        }
      }
      console.log(`    Found ${districtCount} district records in ${sheetName}`);
    });
  } catch (error) {
    console.log(`    Error: ${error.message}`);
  }
  
  return results;
}

// Process all CMAS data
function processAllCMAS() {
  console.log('\n1. Processing CMAS test score data...');
  const cmasDir = path.join(__dirname, 'General CMAS Score Data');
  const files = fs.readdirSync(cmasDir)
    .filter(f => f.endsWith('.xlsx') && !f.includes('inspect'))
    .sort();
  
  const allResults = [];
  
  files.forEach(file => {
    const filePath = path.join(cmasDir, file);
    const year = file.match(/(\d{4})/)?.[1];
    
    let results;
    if (year === '2016' || year === '2017') {
      results = process2016or2017CMASFile(filePath, file);
    } else {
      results = processStandardCMASFile(filePath, file);
    }
    
    allResults.push(...results);
  });
  
  // Aggregate results by district and year
  const combined = {};
  
  // Group by district, year, and subject
  const grouped = {};
  allResults.forEach(result => {
    const normalizedDistrict = normalizeDistrictName(result.district);
    const key = `${normalizedDistrict}|${result.year}|${result.subject}`;
    if (!grouped[key]) {
      grouped[key] = {
        district: normalizedDistrict,
        year: result.year,
        subject: result.subject,
        scores: []
      };
    }
    grouped[key].scores.push(result.percent);
  });
  
  // Average scores within each subject
  const subjectAverages = [];
  Object.values(grouped).forEach(group => {
    const avgScore = group.scores.reduce((a, b) => a + b, 0) / group.scores.length;
    subjectAverages.push({
      district: group.district,
      year: group.year,
      subject: group.subject,
      percent: avgScore
    });
  });
  
  // Combine subjects by district and year
  subjectAverages.forEach(result => {
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
  
  // Calculate final averages
  const finalCMAS = {};
  Object.entries(combined).forEach(([district, years]) => {
    finalCMAS[district] = {};
    Object.entries(years).forEach(([year, data]) => {
      const avg = data.total / data.subjects.length;
      finalCMAS[district][year] = Math.round(avg * 10) / 10;
    });
  });
  
  console.log(`  Processed CMAS data for ${Object.keys(finalCMAS).length} districts`);
  return finalCMAS;
}

// Process enrollment and FRL data
function processEnrollmentData() {
  console.log('\n2. Processing enrollment and FRL data...');
  const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
  const districtEnrollment = {};
  
  try {
    const workbook = XLSX.readFile(filePath);
    
    workbook.SheetNames.forEach(sheetName => {
      if (sheetName.includes('Cheat Sheet')) return;
      
      const yearMatch = sheetName.match(/(\d{4})-\d{4}/);
      if (!yearMatch) return;
      const year = yearMatch[1];
      
      console.log(`  Processing ${sheetName}...`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      data.forEach(row => {
        const rawDistrictName = row['Organization Name'];
        if (!rawDistrictName || !rawDistrictName.trim()) return;
        
        const districtName = normalizeDistrictName(rawDistrictName);
        
        if (!districtEnrollment[districtName]) {
          districtEnrollment[districtName] = {};
        }
        
        if (!districtEnrollment[districtName][year]) {
          districtEnrollment[districtName][year] = {
            enrollment: 0,
            freeLunch: 0,
            reducedLunch: 0,
            validFRLSchools: 0,
            totalSchools: 0
          };
        }
        
        const enrollment = row['PK-12 Total'] || 0;
        const freeLunch = row['Free Lunch'];
        const reducedLunch = row['Reduced Lunch'];
        
        districtEnrollment[districtName][year].enrollment += enrollment;
        districtEnrollment[districtName][year].totalSchools += 1;
        
        // Process FRL data with relaxed validation
        let hasValidFRL = false;
        
        if (freeLunch !== '*' && freeLunch !== undefined && freeLunch !== null && freeLunch !== '') {
          const freeNum = parseFloat(freeLunch);
          if (!isNaN(freeNum)) {
            districtEnrollment[districtName][year].freeLunch += freeNum;
            hasValidFRL = true;
          }
        }
        
        if (reducedLunch !== '*' && reducedLunch !== undefined && reducedLunch !== null && reducedLunch !== '') {
          const reducedNum = parseFloat(reducedLunch);
          if (!isNaN(reducedNum)) {
            districtEnrollment[districtName][year].reducedLunch += reducedNum;
            hasValidFRL = true;
          }
        }
        
        if (hasValidFRL) {
          districtEnrollment[districtName][year].validFRLSchools += 1;
        }
      });
    });
    
    // Calculate FRL percentages
    Object.keys(districtEnrollment).forEach(district => {
      Object.keys(districtEnrollment[district]).forEach(year => {
        const data = districtEnrollment[district][year];
        
        // Only require SOME schools to have valid data
        if (data.validFRLSchools > 0 && data.enrollment > 0) {
          const frlTotal = data.freeLunch + data.reducedLunch;
          data.frlPercent = Math.round((frlTotal / data.enrollment) * 1000) / 10;
        } else {
          data.frlPercent = null;
        }
      });
    });
    
    console.log(`  Processed enrollment data for ${Object.keys(districtEnrollment).length} districts`);
    return districtEnrollment;
    
  } catch (error) {
    console.error('  Error processing enrollment data:', error.message);
    return {};
  }
}

// Process 2016 FRL data from separate file
function process2016FRLData() {
  console.log('\n3. Processing 2016 FRL data from demographic file...');
  const filePath = path.join(__dirname, 'Demographic data/2016-17_PK-12_PupilMembership_bySchool_FRL_0.xlsx');
  const district2016FRL = {};
  
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Read with header: 1 to get raw data
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Skip header rows and process data
    const districtData = {};
    
    for (let i = 3; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length < 8) continue;
      
      const rawDistrictName = row[3]; // DISTRICT NAME column
      const schoolCode = row[4]; // SCHOOL CODE column
      const enrollment = parseFloat(row[6]) || 0; // PK-12 COUNT column
      const frlCountRaw = row[7]; // FREE AND REDUCED COUNT column
      
      // Skip district-level summary rows (school code '0000')
      if (!rawDistrictName || !rawDistrictName.trim() || schoolCode === '0000') continue;
      
      // Skip if FRL count is 'N/A' or not a valid number
      if (frlCountRaw === 'N/A' || frlCountRaw === undefined || frlCountRaw === null) continue;
      
      const frlCount = parseFloat(frlCountRaw) || 0;
      const districtName = normalizeDistrictName(rawDistrictName.trim());
      
      if (!districtData[districtName]) {
        districtData[districtName] = {
          totalEnrollment: 0,
          totalFRL: 0
        };
      }
      
      districtData[districtName].totalEnrollment += enrollment;
      districtData[districtName].totalFRL += frlCount;
    }
    
    // Calculate percentages
    Object.entries(districtData).forEach(([district, data]) => {
      if (data.totalEnrollment > 0) {
        district2016FRL[district] = Math.round((data.totalFRL / data.totalEnrollment) * 1000) / 10;
      }
    });
    
    console.log(`  Processed 2016 FRL data for ${Object.keys(district2016FRL).length} districts`);
    return district2016FRL;
    
  } catch (error) {
    console.error('  Error processing 2016 FRL data:', error.message);
    return {};
  }
}

// Combine all data into final format
function combineAllData(enrollmentData, cmasData, frl2016Data) {
  console.log('\n4. Combining all data sources...');
  const finalData = {};
  
  // Get all unique districts
  const allDistricts = new Set([
    ...Object.keys(enrollmentData),
    ...Object.keys(cmasData)
  ]);
  
  allDistricts.forEach(district => {
    finalData[district] = {
      enrollment_trends: [],
      cmas_scores: []
    };
    
    // Add enrollment data
    if (enrollmentData[district]) {
      Object.entries(enrollmentData[district]).forEach(([year, data]) => {
        // Override 2016 FRL with data from separate file if available
        let frlValue = data.frlPercent;
        if (year === '2016' && frl2016Data[district] !== undefined) {
          frlValue = frl2016Data[district];
        }
        
        finalData[district].enrollment_trends.push({
          year: year,
          enrollment: data.enrollment,
          frl: frlValue
        });
      });
      finalData[district].enrollment_trends.sort((a, b) => a.year.localeCompare(b.year));
    }
    
    // Add CMAS data
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
  console.log('='.repeat(60));
  console.log('Unified Colorado District Data Processor');
  console.log('='.repeat(60));
  
  // Process all data sources
  const cmasData = processAllCMAS();
  const enrollmentData = processEnrollmentData();
  const frl2016Data = process2016FRLData();
  
  // Combine all data
  const finalData = combineAllData(enrollmentData, cmasData, frl2016Data);
  
  // Save the complete dataset
  const outputPath = path.join(__dirname, '../public/district_data_complete.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log('Processing complete!');
  console.log(`Total districts: ${Object.keys(finalData).length}`);
  console.log(`Output saved to: ${outputPath}`);
  
  // Show verification summary
  console.log('\nData coverage summary:');
  
  let districtsWith2016CMAS = 0;
  let districtsWith2016FRL = 0;
  let districtsWithAllYearsFRL = 0;
  
  Object.values(finalData).forEach(district => {
    if (district.cmas_scores?.some(s => s.year === '2016' && s.met_or_exceeded_pct !== null)) {
      districtsWith2016CMAS++;
    }
    if (district.enrollment_trends?.some(t => t.year === '2016' && t.frl !== null)) {
      districtsWith2016FRL++;
    }
    
    // Check if has FRL data for 2020-2024
    const recentYears = ['2020', '2021', '2022', '2023', '2024'];
    const hasAllRecentFRL = recentYears.every(year => 
      district.enrollment_trends?.some(t => t.year === year && t.frl !== null)
    );
    if (hasAllRecentFRL) {
      districtsWithAllYearsFRL++;
    }
  });
  
  console.log(`- Districts with 2016 CMAS data: ${districtsWith2016CMAS}`);
  console.log(`- Districts with 2016 FRL data: ${districtsWith2016FRL}`);
  console.log(`- Districts with complete 2020-2024 FRL data: ${districtsWithAllYearsFRL}`);
  
  // Show sample districts
  console.log('\nSample district verification:');
  const sampleDistricts = ['Denver County 1', 'Academy 20', 'Jefferson County R-1'];
  
  sampleDistricts.forEach(name => {
    const district = finalData[name];
    if (district) {
      console.log(`\n${name}:`);
      
      if (district.cmas_scores) {
        const years = district.cmas_scores
          .filter(s => s.met_or_exceeded_pct !== null)
          .map(s => s.year);
        console.log(`  CMAS years: ${years.join(', ')}`);
        
        const cmas2016 = district.cmas_scores.find(s => s.year === '2016');
        if (cmas2016) {
          console.log(`  2016 CMAS: ${cmas2016.met_or_exceeded_pct}%`);
        }
      }
      
      if (district.enrollment_trends) {
        const frlYears = district.enrollment_trends
          .filter(t => t.frl !== null)
          .map(t => t.year);
        console.log(`  FRL years: ${frlYears.join(', ')}`);
        
        const frl2016 = district.enrollment_trends.find(t => t.year === '2016');
        if (frl2016) {
          console.log(`  2016 FRL: ${frl2016.frl}%`);
        }
      }
    }
  });
  
  console.log('\n' + '='.repeat(60));
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { normalizeDistrictName };