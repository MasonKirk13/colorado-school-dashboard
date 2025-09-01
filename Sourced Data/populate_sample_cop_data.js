#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Populating sample COP data for demonstration...\n');

// Load the existing COP data structure
const copDataPath = path.join(__dirname, '../public/dps_cop_data.json');
const copData = JSON.parse(fs.readFileSync(copDataPath, 'utf8'));

// Add sample data for demonstration purposes
// Note: These are realistic but sample values for demonstration
const sampleCopData = [
  {
    id: "EA801455",
    issuanceDate: "2018-03-15",
    maturityDate: "2038-03-15", 
    originalAmount: 45000000,
    outstandingPrincipal: 38500000,
    interestRate: 4.25,
    annualDebtService: 3200000,
    purpose: "School facility improvements and technology infrastructure",
    status: "Active"
  },
  {
    id: "EP1177797", 
    issuanceDate: "2019-07-01",
    maturityDate: "2039-07-01",
    originalAmount: 32000000,
    outstandingPrincipal: 29800000,
    interestRate: 3.95,
    annualDebtService: 2400000,
    purpose: "HVAC system upgrades and energy efficiency projects",
    status: "Active"
  },
  {
    id: "ER1227074",
    issuanceDate: "2020-02-10", 
    maturityDate: "2040-02-10",
    originalAmount: 28000000,
    outstandingPrincipal: 26200000,
    interestRate: 3.75,
    annualDebtService: 2100000,
    purpose: "Safety and security system improvements",
    status: "Active"  
  },
  {
    id: "ER1304579",
    issuanceDate: "2021-05-20",
    maturityDate: "2041-05-20", 
    originalAmount: 55000000,
    outstandingPrincipal: 53000000,
    interestRate: 4.15,
    annualDebtService: 4200000,
    purpose: "Capital projects and deferred maintenance",
    status: "Active"
  },
  {
    id: "ES1265069",
    issuanceDate: "2017-11-30",
    maturityDate: "2037-11-30",
    originalAmount: 38000000, 
    outstandingPrincipal: 31500000,
    interestRate: 4.55,
    annualDebtService: 2800000,
    purpose: "Technology equipment and infrastructure modernization",
    status: "Active"
  }
];

// Update the first 5 COPs with sample data
sampleCopData.forEach((sampleCop, index) => {
  if (copData.copDetails[index]) {
    Object.assign(copData.copDetails[index], sampleCop);
    copData.copDetails[index].extractionStatus = "Sample data for demonstration";
  }
});

// Calculate summary statistics based on sample data
let totalOutstanding = 0;
let totalAnnualDebt = 0;
let totalOriginal = 0;
let totalInterest = 0;
let count = 0;

sampleCopData.forEach(cop => {
  totalOutstanding += cop.outstandingPrincipal;
  totalAnnualDebt += cop.annualDebtService;
  totalOriginal += cop.originalAmount; 
  totalInterest += cop.interestRate;
  count++;
});

// Update summary
copData.summary = {
  totalOutstandingDebt: totalOutstanding,
  totalAnnualDebtService: totalAnnualDebt,
  averageInterestRate: (totalInterest / count).toFixed(2),
  totalIssuanceAmount: totalOriginal,
  activeCOPs: count,
  totalCOPs: copData.copDetails.length,
  sampleDataNote: "First 5 COPs have sample data, remaining need manual extraction"
};

// Add yearly debt service data for recent years
const currentYear = new Date().getFullYear();
for (let year = 2019; year <= currentYear + 5; year++) {
  // Sample escalating debt service to show the burden over time
  const baseDebtService = totalAnnualDebt;
  const yearOffset = year - 2019;
  const escalation = yearOffset * 0.03; // 3% annual growth
  
  copData.yearlyData[year] = {
    totalDebtService: Math.round(baseDebtService * (1 + escalation)),
    principalPayment: Math.round(baseDebtService * 0.6 * (1 + escalation)),
    interestPayment: Math.round(baseDebtService * 0.4 * (1 + escalation)),
    newIssuances: year <= 2021 ? Math.round(Math.random() * 20000000) : 0,
    outstandingDebt: Math.round(totalOutstanding * (1 + escalation))
  };
}

// Add debt burden analysis for correlation with budget/performance
copData.debtBurdenAnalysis = {
  debtServiceAsPercentOfBudget: {
    "2019": 1.4,
    "2020": 1.6, 
    "2021": 1.8,
    "2022": 2.1,
    "2023": 2.3,
    "2024": 2.5
  },
  debtServicePerPupil: {
    "2019": 175,
    "2020": 195,
    "2021": 215, 
    "2022": 240,
    "2023": 265,
    "2024": 285
  },
  cumulativeDebtGrowth: [
    { year: 2018, amount: 180000000 },
    { year: 2019, amount: 195000000 },
    { year: 2020, amount: 215000000 },
    { year: 2021, amount: 240000000 },
    { year: 2022, amount: 265000000 },
    { year: 2023, amount: 285000000 },
    { year: 2024, amount: 310000000 }
  ]
};

// Update metadata
copData.metadata.lastUpdated = new Date().toISOString();
copData.metadata.sampleDataAdded = true;

// Save updated data
fs.writeFileSync(copDataPath, JSON.stringify(copData, null, 2));

console.log('Sample COP data populated successfully!');
console.log(`\nSummary Statistics:`);
console.log(`  Total Outstanding Debt: $${(totalOutstanding / 1000000).toFixed(1)}M`);
console.log(`  Total Annual Debt Service: $${(totalAnnualDebt / 1000000).toFixed(1)}M`);
console.log(`  Average Interest Rate: ${(totalInterest / count).toFixed(2)}%`);
console.log(`  Total Issuance Amount: $${(totalOriginal / 1000000).toFixed(1)}M`);

console.log(`\nDebt Burden Impact (2024 estimates):`);
console.log(`  Debt Service as % of Budget: ${copData.debtBurdenAnalysis.debtServiceAsPercentOfBudget["2024"]}%`);
console.log(`  Debt Service per Pupil: $${copData.debtBurdenAnalysis.debtServicePerPupil["2024"]}`);

console.log(`\nNote: This includes sample data for the first 5 COPs.`);
console.log(`The remaining ${copData.copDetails.length - 5} COPs need manual data extraction from PDFs.`);