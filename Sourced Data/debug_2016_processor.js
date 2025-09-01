#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Copy the exact process2016or2017File function from the main processor
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
      }
      
      // Process data rows
      let foundDistricts = 0;
      for (let i = headerRow + 1; i < rawData.length && i < headerRow + 1000; i++) {
        const row = rawData[i];
        if (!row || row[0] !== 'DISTRICT') continue;
        
        const districtName = row[2];
        const grade = row[6] || row[7]; // Grade might be in different column
        const subject = row[5]; // Content/Subject column
        
        if (!districtName || !grade) continue;
        
        // For these files, we collect all grade data and will aggregate later
        if (grade.includes('Grade') || !isNaN(grade)) {
          let percent = null;
          
          if (percentCol !== -1) {
            percent = parseFloat(row[percentCol]);
          } else {
            // For 2016/2017, the percent is typically in column 23
            if (row[23] && !isNaN(row[23])) {
              percent = parseFloat(row[23]);
            } else {
              // Fallback: look for a numeric value that looks like a percentage
              for (let col = 20; col < Math.min(30, row.length); col++) {
                const val = row[col];
                if (val && !isNaN(val) && val > 0 && val <= 100) {
                  if (col > 0 && row[col-1] && !isNaN(row[col-1]) && row[col-1] > 100) {
                    continue;
                  }
                  percent = parseFloat(val);
                  break;
                }
              }
            }
          }
          
          if (!isNaN(percent)) {
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
              grade: grade
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

// Test the function
const filePath = path.join(__dirname, 'General CMAS Score Data/2016 ELA Math District and School Summary final.xlsx');
const results = process2016or2017File(filePath, '2016 ELA Math District and School Summary final.xlsx');

console.log(`\nTotal results: ${results.length}`);

// Group by district and show sample
const byDistrict = {};
results.forEach(r => {
  if (!byDistrict[r.district]) {
    byDistrict[r.district] = [];
  }
  byDistrict[r.district].push(r);
});

console.log(`\nUnique districts: ${Object.keys(byDistrict).length}`);

// Show first 5 districts
console.log('\nFirst 5 districts with data:');
Object.entries(byDistrict).slice(0, 5).forEach(([district, data]) => {
  const avgScore = data.reduce((sum, d) => sum + d.percent, 0) / data.length;
  console.log(`  ${district}: ${data.length} records, avg: ${avgScore.toFixed(1)}%`);
});