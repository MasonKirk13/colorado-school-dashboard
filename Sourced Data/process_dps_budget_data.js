#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('Processing DPS Budget Data...\n');

// Load existing school data
const schoolDataPath = path.join(__dirname, '../public/dps_schools_data.json');
const schoolData = JSON.parse(fs.readFileSync(schoolDataPath, 'utf8'));

// Process budget files
const budgetDir = path.join(__dirname, 'Budgets');
const budgetData = {
  years: {},
  summary: {}
};

// Get all Excel files in budget directory
const budgetFiles = fs.readdirSync(budgetDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));

console.log(`Found ${budgetFiles.length} budget files\n`);

budgetFiles.forEach(file => {
  const yearMatch = file.match(/(\d{4})/);
  if (!yearMatch) return;
  
  const year = yearMatch[1];
  console.log(`Processing ${year} budget...`);
  
  try {
    const filePath = path.join(budgetDir, file);
    const wb = XLSX.readFile(filePath);
    
    // Look for key budget metrics
    budgetData.years[year] = {
      fileName: file,
      totalBudget: 0,
      instructionalSpending: 0,
      supportServices: 0,
      capitalProjects: 0,
      debtService: 0,
      perPupilSpending: 0
    };
    
    // Search through sheets for budget summary data
    wb.SheetNames.forEach(sheetName => {
      const sheet = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      // Look for key budget lines (simplified for demo)
      data.forEach(row => {
        const label = row[0]?.toString().toLowerCase() || '';
        if (label.includes('total expenditures') && !label.includes('prior')) {
          budgetData.years[year].totalBudget = parseFloat(row[1]) || 0;
        }
        if (label.includes('instruction')) {
          budgetData.years[year].instructionalSpending = parseFloat(row[1]) || 0;
        }
        if (label.includes('support services')) {
          budgetData.years[year].supportServices = parseFloat(row[1]) || 0;
        }
      });
    });
    
    // Calculate per-pupil spending
    const totalEnrollment = schoolData.schools.reduce((sum, school) => {
      const enrollment = school.enrollment[year]?.total || 0;
      return sum + enrollment;
    }, 0);
    
    if (totalEnrollment > 0 && budgetData.years[year].totalBudget > 0) {
      budgetData.years[year].perPupilSpending = 
        Math.round(budgetData.years[year].totalBudget / totalEnrollment);
    }
    
    console.log(`  Total Budget: $${(budgetData.years[year].totalBudget / 1000000).toFixed(1)}M`);
    console.log(`  Per Pupil: $${budgetData.years[year].perPupilSpending}`);
  } catch (err) {
    console.log(`  Error processing ${file}: ${err.message}`);
  }
});

// Calculate spending vs outcomes correlation
const correlationData = [];
Object.keys(budgetData.years).forEach(year => {
  const budget = budgetData.years[year];
  
  // Get average chronic absenteeism for this year
  let totalAbsentRate = 0;
  let schoolCount = 0;
  
  schoolData.schools.forEach(school => {
    const attendance = school.attendance[`${year}-${parseInt(year) + 1}`];
    if (attendance?.chronicAbsentRate) {
      totalAbsentRate += parseFloat(attendance.chronicAbsentRate);
      schoolCount++;
    }
  });
  
  if (schoolCount > 0 && budget.perPupilSpending > 0) {
    correlationData.push({
      year,
      perPupilSpending: budget.perPupilSpending,
      avgChronicAbsenteeism: totalAbsentRate / schoolCount,
      totalBudget: budget.totalBudget,
      instructionalPercent: budget.instructionalSpending / budget.totalBudget * 100
    });
  }
});

budgetData.correlation = correlationData;

// Save budget data
const outputPath = path.join(__dirname, '../public/dps_budget_data.json');
fs.writeFileSync(outputPath, JSON.stringify(budgetData, null, 2));

console.log(`\nSaved budget data to: ${outputPath}`);
console.log('\nSpending vs Outcomes Summary:');
correlationData.forEach(data => {
  console.log(`${data.year}: $${data.perPupilSpending}/pupil, ${data.avgChronicAbsenteeism.toFixed(1)}% chronic absence`);
});