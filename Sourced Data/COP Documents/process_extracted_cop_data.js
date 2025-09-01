#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('DPS COP Data Processor - Convert Extracted Data to JSON Format\n');

/**
 * This script processes extracted COP data and updates the main JSON file
 * 
 * Input Options:
 * 1. CSV file: cop_data_collection_template.csv (filled with actual data)
 * 2. Individual text files: COP_ID_extracted.txt files
 * 3. Manual data entry through prompts
 */

// Load existing COP data structure
const copDataPath = path.join(__dirname, '../../public/dps_cop_data.json');
let copData;

try {
  copData = JSON.parse(fs.readFileSync(copDataPath, 'utf8'));
  console.log('✓ Loaded existing COP data structure');
} catch (error) {
  console.error('✗ Error loading COP data structure:', error.message);
  process.exit(1);
}

// Function to process CSV data
function processCSVData(csvPath) {
  console.log('\n--- Processing CSV Data ---');
  
  if (!fs.existsSync(csvPath)) {
    console.log('No CSV file found at:', csvPath);
    return false;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  let updatedCount = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',');
    const copId = values[0];
    
    // Find matching COP in our data structure
    const copIndex = copData.copDetails.findIndex(cop => cop.id === copId);
    if (copIndex === -1) {
      console.log(`⚠ Warning: COP ${copId} not found in data structure`);
      continue;
    }
    
    // Update COP data if values are provided (not empty)
    const cop = copData.copDetails[copIndex];
    
    if (values[2] && values[2] !== '') cop.issuanceDate = values[2]; // Issue_Date
    if (values[3] && values[3] !== '') cop.maturityDate = values[3]; // Maturity_Date
    if (values[4] && values[4] !== '') cop.originalAmount = parseFloat(values[4]) || 0; // Original_Amount
    if (values[5] && values[5] !== '') cop.outstandingPrincipal = parseFloat(values[5]) || 0; // Outstanding_Principal
    if (values[6] && values[6] !== '') cop.interestRate = parseFloat(values[6]) || 0; // Interest_Rate
    if (values[7] && values[7] !== '') cop.annualDebtService = parseFloat(values[7]) || 0; // Annual_Debt_Service
    if (values[8] && values[8] !== 'Enter purpose here') cop.purpose = values[8]; // Purpose
    if (values[9] && values[9] !== 'Enter projects here') cop.projectsFinanced = values[9].split(';'); // Projects
    if (values[10] && values[10] !== 'Enter security here') cop.notes = `Security: ${values[10]}`; // Security
    if (values[11] && values[11] !== '') cop.status = values[11]; // Status
    
    // Mark as having real data if any financial data was provided
    if (values[4] || values[5] || values[6] || values[7]) {
      cop.extractionStatus = "Data extracted - " + new Date().toLocaleDateString();
      updatedCount++;
    }
  }
  
  console.log(`✓ Updated ${updatedCount} COPs from CSV data`);
  return updatedCount > 0;
}

// Function to calculate summary statistics
function recalculateSummary() {
  console.log('\n--- Recalculating Summary Statistics ---');
  
  let totalOutstanding = 0;
  let totalAnnualDebt = 0;
  let totalOriginal = 0;
  let totalInterest = 0;
  let activeCOPs = 0;
  
  copData.copDetails.forEach(cop => {
    if (cop.status === 'Active' && cop.outstandingPrincipal > 0) {
      totalOutstanding += cop.outstandingPrincipal;
      totalAnnualDebt += cop.annualDebtService;
      totalOriginal += cop.originalAmount;
      totalInterest += cop.interestRate;
      activeCOPs++;
    }
  });
  
  // Update summary
  copData.summary = {
    totalOutstandingDebt: totalOutstanding,
    totalAnnualDebtService: totalAnnualDebt,
    averageInterestRate: activeCOPs > 0 ? (totalInterest / activeCOPs).toFixed(2) : "0.00",
    totalIssuanceAmount: totalOriginal,
    activeCOPs: activeCOPs,
    totalCOPs: copData.copDetails.length,
    lastUpdated: new Date().toISOString(),
    dataSource: "Extracted from DPS financial documents"
  };
  
  console.log(`✓ Total Outstanding Debt: $${(totalOutstanding / 1000000).toFixed(1)}M`);
  console.log(`✓ Total Annual Debt Service: $${(totalAnnualDebt / 1000000).toFixed(1)}M`);
  console.log(`✓ Active COPs: ${activeCOPs} of ${copData.copDetails.length}`);
  console.log(`✓ Average Interest Rate: ${copData.summary.averageInterestRate}%`);
}

// Function to generate yearly debt service projections
function generateYearlyProjections() {
  console.log('\n--- Generating Yearly Debt Service Projections ---');
  
  const currentYear = new Date().getFullYear();
  const totalAnnualService = copData.summary.totalAnnualDebtService;
  
  // Clear existing yearly data
  copData.yearlyData = {};
  
  // Generate projections based on known maturity dates
  for (let year = 2019; year <= currentYear + 20; year++) {
    let yearlyService = 0;
    let outstandingDebt = 0;
    
    // Calculate debt service for COPs still active in this year
    copData.copDetails.forEach(cop => {
      if (cop.status === 'Active' && cop.maturityDate && cop.annualDebtService > 0) {
        const maturityYear = new Date(cop.maturityDate).getFullYear();
        if (year <= maturityYear) {
          yearlyService += cop.annualDebtService;
          outstandingDebt += cop.outstandingPrincipal;
        }
      }
    });
    
    copData.yearlyData[year] = {
      totalDebtService: Math.round(yearlyService),
      principalPayment: Math.round(yearlyService * 0.6), // Estimate
      interestPayment: Math.round(yearlyService * 0.4), // Estimate
      newIssuances: 0, // Would need to be manually updated
      outstandingDebt: Math.round(outstandingDebt)
    };
  }
  
  console.log(`✓ Generated debt service projections through ${currentYear + 20}`);
}

// Function to update debt burden analysis
function updateDebtBurdenAnalysis() {
  console.log('\n--- Updating Debt Burden Analysis ---');
  
  const totalAnnualService = copData.summary.totalAnnualDebtService;
  const estimatedStudents = 90000; // DPS approximate enrollment
  
  // Update debt burden analysis with real data
  copData.debtBurdenAnalysis = {
    debtServiceAsPercentOfBudget: {
      "2019": ((totalAnnualService * 0.85) / 1000000000 * 100).toFixed(1), // Estimate growth
      "2020": ((totalAnnualService * 0.90) / 1050000000 * 100).toFixed(1),
      "2021": ((totalAnnualService * 0.95) / 1100000000 * 100).toFixed(1),
      "2022": ((totalAnnualService * 0.98) / 1150000000 * 100).toFixed(1),
      "2023": ((totalAnnualService * 1.00) / 1200000000 * 100).toFixed(1),
      "2024": ((totalAnnualService * 1.02) / 1250000000 * 100).toFixed(1)
    },
    debtServicePerPupil: {
      "2019": Math.round(totalAnnualService * 0.85 / estimatedStudents),
      "2020": Math.round(totalAnnualService * 0.90 / estimatedStudents), 
      "2021": Math.round(totalAnnualService * 0.95 / estimatedStudents),
      "2022": Math.round(totalAnnualService * 0.98 / estimatedStudents),
      "2023": Math.round(totalAnnualService * 1.00 / estimatedStudents),
      "2024": Math.round(totalAnnualService * 1.02 / estimatedStudents)
    },
    cumulativeDebtGrowth: [] // Would be populated with historical data if available
  };
  
  console.log(`✓ Debt service per pupil (2024): $${copData.debtBurdenAnalysis.debtServicePerPupil["2024"]}`);
  console.log(`✓ Debt as % of budget (2024): ${copData.debtBurdenAnalysis.debtServiceAsPercentOfBudget["2024"]}%`);
}

// Main execution
async function main() {
  console.log('Choose processing option:');
  console.log('1. Process filled CSV template');
  console.log('2. Interactive data entry');
  console.log('3. Just recalculate with existing sample data');
  
  // For now, let's process CSV if it exists, otherwise use sample data
  const csvPath = path.join(__dirname, 'cop_data_collection_template.csv');
  const hasRealData = processCSVData(csvPath);
  
  if (!hasRealData) {
    console.log('\n📋 No real data found. Using existing sample data for calculations.');
    console.log('💡 Fill in the cop_data_collection_template.csv file and run again for real data.');
  }
  
  // Always recalculate summary and projections
  recalculateSummary();
  generateYearlyProjections();
  updateDebtBurdenAnalysis();
  
  // Update metadata
  copData.metadata.lastUpdated = new Date().toISOString();
  copData.metadata.dataSource = hasRealData ? "Extracted from DPS financial documents" : "Sample data with real calculations";
  
  // Save updated data
  fs.writeFileSync(copDataPath, JSON.stringify(copData, null, 2));
  
  console.log('\n✅ COP data processing complete!');
  console.log(`📁 Updated: ${copDataPath}`);
  
  if (!hasRealData) {
    console.log('\n📋 Next Steps:');
    console.log('1. Extract data from DPS COP documents using the provided templates');
    console.log('2. Fill in cop_data_collection_template.csv with real data');  
    console.log('3. Run this script again to process the real data');
    console.log('4. The React application will automatically use the updated data');
  }
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = {
  processCSVData,
  recalculateSummary,
  generateYearlyProjections,
  updateDebtBurdenAnalysis
};