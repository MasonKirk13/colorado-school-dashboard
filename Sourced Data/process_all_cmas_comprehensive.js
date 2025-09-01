#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Special handling for 2016/2017 files which have different structure
function process2016or2017File(filePath, fileName) {
  console.log(`  Special processing for ${fileName}...`);
  const results = [];
  const year = fileName.match(/(\d{4})/)?.[1];
  if (!year) return results;
  
  try {
    const workbook = XLSX.readFile(filePath);
    
    // For 2016/2017, we need to look for the actual data differently
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // For these files, headers might be around row 4
      let headerRow = -1;
      for (let i = 0; i < 10; i++) {
        if (rawData[i] && rawData[i][0] === 'Level') {
          headerRow = i;
          break;
        }
      }
      
      if (headerRow === -1) return;
      
      const headers = rawData[headerRow];
      console.log(`    Found headers at row ${headerRow} in sheet ${sheetName}`);
      
      // Look for percent columns - for 2016/2017 it's column 23
      let percentCol = -1;
      for (let col = 20; col < headers.length && col < 30; col++) {
        if (headers[col] && 
            (headers[col].toString() === '% Met or Exceeded Expectations' ||
             headers[col].toString().includes('% Met or Exceeded'))) {
          percentCol = col;
          break;
        }
      }
      
      if (percentCol === -1) {
        console.log(`    No percent column found, checking for alternative formats...`);
        // Sometimes it's just numbers in later columns
        // For 2016/2017, let's look at the actual data structure
      }
      
      // Process data rows
      let foundDistricts = 0;
      for (let i = headerRow + 1; i < rawData.length && i < headerRow + 1000; i++) {
        const row = rawData[i];
        if (!row || row[0] !== 'DISTRICT') continue;
        
        const districtName = row[2];
        const grade = row[6] || row[7]; // Grade might be in different column
        const subject = row[5]; // Content/Subject column
        
        // For 2016/2017, there's no 'All Grades' - we need to aggregate by subject
        // Skip if not a valid grade row
        if (!districtName || !grade) continue;
        
        // For these files, we collect all grade data and will aggregate later
        if (grade.includes('Grade') || !isNaN(grade)) {
          // For 2016/2017, percent might be in a different column
          let percent = null;
          
          if (percentCol !== -1) {
            percent = parseFloat(row[percentCol]);
          } else {
            // For 2016/2017, the percent is typically in column 23
            // Try known column positions first
            if (row[23] && !isNaN(row[23])) {
              percent = parseFloat(row[23]);
            } else {
              // Fallback: look for a numeric value that looks like a percentage
              for (let col = 20; col < Math.min(30, row.length); col++) {
                const val = row[col];
                if (val && !isNaN(val) && val > 0 && val <= 100) {
                  // Make sure it's not the number column (usually has larger values)
                  if (col > 0 && row[col-1] && !isNaN(row[col-1]) && row[col-1] > 100) {
                    continue; // Skip if previous column has a count value
                  }
                  percent = parseFloat(val);
                  break;
                }
              }
            }
          }
          
          if (!isNaN(percent)) {
            // Extract subject from content or grade field
            let subjectName = subject || '';
            if (grade.includes('ELA')) {
              subjectName = 'English Language Arts';
            } else if (grade.includes('MATH') || sheetName.includes('MATH')) {
              subjectName = 'Mathematics';
            } else if (subjectName.includes('ELA')) {
              subjectName = 'English Language Arts';
            } else if (subjectName.includes('Math')) {
              subjectName = 'Mathematics';
            }
            
            results.push({
              district: districtName.trim(),
              subject: subjectName,
              year: year,
              percent: percent,
              grade: grade // Keep grade info for aggregation
            });
            foundDistricts++;
          }
        }
      }
      console.log(`    Found ${foundDistricts} district records`);
    });
  } catch (error) {
    console.log(`    Error: ${error.message}`);
  }
  
  return results;
}

// Standard processing for 2018+ files
function processStandardFile(filePath, fileName) {
  console.log(`  Standard processing for ${fileName}...`);
  const results = [];
  const year = fileName.match(/(\d{4})/)?.[1];
  if (!year) return results;
  
  try {
    const workbook = XLSX.readFile(filePath);
    
    workbook.SheetNames.forEach(sheetName => {
      if (sheetName.includes('Interpretation')) return; // Skip non-data sheets
      
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
      
      if (headerRowIndex === -1) {
        console.log(`    No header found in sheet ${sheetName}`);
        return;
      }
      
      console.log(`    Found header at row ${headerRowIndex} in sheet ${sheetName}`);
      const headers = rawData[headerRowIndex];
      
      // Find key columns
      const levelIdx = 0; // Usually first
      const districtIdx = headers.findIndex(h => h && h.toString() === 'District Name');
      const gradeIdx = headers.findIndex(h => h && (h.toString() === 'Grade' || h.toString() === 'Test/Grade'));
      const subjectIdx = headers.findIndex(h => h && (h.toString() === 'Subject' || h.toString() === 'Content'));
      
      // Find percent column - try multiple variations
      let percentIdx = -1;
      
      // For 2022/2023/2024, the percent column is just the year (typically column 26)
      if (parseInt(year) >= 2022) {
        percentIdx = headers.findIndex(h => h && h.toString() === year);
      }
      
      // For older files, look for % Met or Exceeded Expectations (typically column 23)
      if (percentIdx === -1) {
        percentIdx = headers.findIndex(h => h && 
          (h.toString() === '% Met or Exceeded Expectations' ||
           h.toString() === 'Percent Met or Exceeded Expectations'));
      }
      
      // Make sure we're not getting the NUMBER column (usually column 22 or 25)
      // The percent column should be after the number column
      const numberIdx = headers.findIndex(h => h && 
        (h.toString() === 'Number Met or Exceeded Expectations' ||
         h.toString() === '# Met or Exceeded Expectations'));
      
      if (numberIdx !== -1 && percentIdx !== -1 && percentIdx <= numberIdx) {
        console.log(`    Warning: Percent column (${percentIdx}) is before or same as number column (${numberIdx}), searching for correct column...`);
        // Search for the next matching column after the number column
        for (let i = numberIdx + 1; i < headers.length; i++) {
          if (parseInt(year) >= 2022 && headers[i] && headers[i].toString() === year) {
            percentIdx = i;
            break;
          } else if (headers[i] && 
            (headers[i].toString() === '% Met or Exceeded Expectations' ||
             headers[i].toString() === 'Percent Met or Exceeded Expectations')) {
            percentIdx = i;
            break;
          }
        }
      }
      
      if (percentIdx === -1) {
        console.log(`    Warning: No percent column found, headers:`, headers.slice(20, 30));
        return;
      }
      
      console.log(`    Columns - District: ${districtIdx}, Grade: ${gradeIdx}, Percent: ${percentIdx} ("${headers[percentIdx]}")`);
      
      // Process data
      let districtCount = 0;
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row[levelIdx] !== 'DISTRICT') continue;
        
        const grade = row[gradeIdx];
        // Years without "All Grades" aggregate: 2016, 2017, 2021
        const yearsWithoutAllGrades = ['2016', '2017', '2021'];
        
        if (yearsWithoutAllGrades.includes(year)) {
          // For these years, we'll collect all grades and aggregate later
          if (!grade || grade === '') continue;
        } else {
          // For other years, only use "All Grades" rows
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
              grade: grade // Keep grade for potential aggregation
            });
            districtCount++;
          }
        }
      }
      
      console.log(`    Found ${districtCount} district records`);
    });
  } catch (error) {
    console.log(`    Error: ${error.message}`);
  }
  
  return results;
}

// Main processing function
function processAllCMAS() {
  const cmasDir = path.join(__dirname, 'General CMAS Score Data');
  const files = fs.readdirSync(cmasDir)
    .filter(f => f.endsWith('.xlsx') && !f.includes('inspect'))
    .sort();
  
  const allResults = [];
  
  files.forEach(file => {
    console.log(`\nProcessing ${file}...`);
    const filePath = path.join(cmasDir, file);
    const year = file.match(/(\d{4})/)?.[1];
    
    let results;
    if (year === '2016' || year === '2017') {
      results = process2016or2017File(filePath, file);
    } else {
      results = processStandardFile(filePath, file);
    }
    
    allResults.push(...results);
  });
  
  return allResults;
}

// Process enrollment data (same as before)
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
        const rawDistrictName = row['Organization Name'];
        if (!rawDistrictName) return;
        
        const districtName = normalizeDistrictName(rawDistrictName);
        
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

// Normalize district name to handle case variations
function normalizeDistrictName(name) {
  if (!name) return name;
  
  // Convert to title case but preserve "RE" as uppercase
  return name.trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\b(\d+)\w\b/g, match => match.toUpperCase()) // Keep numbers with letters uppercase (e.g., 27J)
    .replace(/\bRe\b/g, 'RE') // Keep "RE" uppercase as it appears in enrollment data
    .replace(/\bRe-/g, 'RE-'); // Also handle "RE-" pattern
}

// Combine CMAS results by averaging subjects
// For years with "All Grades" data (2018+), we use those aggregate rows
// For years without (2016, 2017, 2021), we average individual grade levels
function combineCMASData(results) {
  const combined = {};
  
  // First, group by district, year, and subject
  const grouped = {};
  results.forEach(result => {
    const normalizedDistrict = normalizeDistrictName(result.district);
    const key = `${normalizedDistrict}|${result.year}|${result.subject}`;
    if (!grouped[key]) {
      grouped[key] = {
        district: normalizedDistrict,
        year: result.year,
        subject: result.subject,
        scores: [],
        grades: []
      };
    }
    grouped[key].scores.push(result.percent);
    if (result.grade) grouped[key].grades.push(result.grade);
  });
  
  // Average scores within each subject (handles multiple grades)
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
  
  // Now combine subjects by district and year
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
  
  return finalCMAS;
}

// Combine all data into final format
function combineAllData(enrollmentData, cmasData) {
  console.log('\nCombining all data...');
  const finalData = {};
  
  // Normalize all district names first
  const normalizedEnrollment = {};
  Object.entries(enrollmentData).forEach(([district, data]) => {
    normalizedEnrollment[normalizeDistrictName(district)] = data;
  });
  
  const normalizedCMAS = {};
  Object.entries(cmasData).forEach(([district, data]) => {
    normalizedCMAS[normalizeDistrictName(district)] = data;
  });
  
  const allDistricts = new Set([
    ...Object.keys(normalizedEnrollment),
    ...Object.keys(normalizedCMAS)
  ]);
  
  allDistricts.forEach(district => {
    finalData[district] = {
      enrollment_trends: [],
      cmas_scores: []
    };
    
    if (normalizedEnrollment[district]) {
      Object.entries(normalizedEnrollment[district]).forEach(([year, data]) => {
        finalData[district].enrollment_trends.push({
          year: year,
          enrollment: data.enrollment,
          frl: data.frlPercent
        });
      });
      finalData[district].enrollment_trends.sort((a, b) => a.year.localeCompare(b.year));
    }
    
    if (normalizedCMAS[district]) {
      Object.entries(normalizedCMAS[district]).forEach(([year, percent]) => {
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
  console.log('Processing all Colorado district data with comprehensive parser...\n');
  
  // Process CMAS data
  const cmasResults = processAllCMAS();
  console.log(`\nTotal CMAS data points: ${cmasResults.length}`);
  
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
  const outputPath = path.join(__dirname, '../public/district_data_complete.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
  
  console.log(`\nSaved complete data to: ${outputPath}`);
  console.log(`Total districts: ${Object.keys(finalData).length}`);
  
  // Show sample for verification
  const testDistricts = ['Academy 20', 'Denver County 1', 'Adams 12 Five Star Schools'];
  testDistricts.forEach(district => {
    if (finalData[district] && finalData[district].cmas_scores) {
      const years = finalData[district].cmas_scores
        .filter(s => s.met_or_exceeded_pct !== null)
        .map(s => s.year);
      console.log(`\n${district} has CMAS data for: ${years.join(', ')}`);
    }
  });
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}