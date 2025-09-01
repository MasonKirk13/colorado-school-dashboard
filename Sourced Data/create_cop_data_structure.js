#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Creating COP (Certificate of Participation) data structure...\n');

// Based on the COP document filenames, create a structured data format
// Note: The actual values would need to be manually extracted from the PDFs
// This creates the framework for the data structure

const copDocuments = [
  'EA801455.pdf',
  'EP1177797.pdf', 
  'ER1227074.pdf',
  'ER1304579.pdf',
  'ES1265069.pdf',
  'ES1267602.pdf',
  'ES1453108.pdf',
  'ES969845.pdf',
  'MD209658.pdf',
  'MD277115.pdf',
  'MD292921.pdf',
  'MD403212.pdf',
  'MD521658.pdf',
  'MS620899.pdf'
];

// Create COP data structure
// Note: These are placeholder values that should be replaced with actual data from PDFs
const copData = {
  metadata: {
    lastUpdated: new Date().toISOString(),
    totalDocuments: copDocuments.length,
    dataSource: "DPS COP Documents",
    note: "Placeholder data structure - actual values need manual extraction from PDFs"
  },
  summary: {
    totalOutstandingDebt: 0, // To be calculated from individual COPs
    totalAnnualDebtService: 0, // Annual payments
    averageInterestRate: 0, // Weighted average
    totalIssuanceAmount: 0, // Total amount ever issued
    earliestMaturityDate: null,
    latestMaturityDate: null
  },
  copDetails: [],
  yearlyData: {
    // This will show debt service by year to correlate with budget/performance data
  },
  debtBurdenAnalysis: {
    // Calculations to show impact on budget and per-pupil costs
    debtServiceAsPercentOfBudget: {},
    debtServicePerPupil: {},
    cumulativeDebtGrowth: []
  }
};

// Create individual COP entries based on document names
// The naming pattern suggests: Prefix + Number format
copDocuments.forEach((docName, index) => {
  const copId = docName.replace('.pdf', '');
  const prefix = copId.substring(0, 2);
  const number = copId.substring(2);
  
  // Create a placeholder entry for each COP
  const copEntry = {
    id: copId,
    documentName: docName,
    series: prefix, // EA, EP, ER, ES, MD, MS might indicate different series/purposes
    number: number,
    
    // Financial details (placeholders - need manual extraction)
    issuanceDate: null,
    maturityDate: null,
    originalAmount: 0,
    outstandingPrincipal: 0,
    interestRate: 0,
    annualDebtService: 0,
    
    // Purpose and details
    purpose: "To be extracted from PDF",
    projectsFinanced: [],
    
    // Status
    status: "Active", // Active, Retired, Refinanced
    
    // Metadata
    extractionStatus: "Pending manual extraction",
    notes: ""
  };
  
  copData.copDetails.push(copEntry);
});

// Create sample yearly debt service data structure
// This would be populated based on actual payment schedules
const currentYear = new Date().getFullYear();
for (let year = 2010; year <= currentYear + 20; year++) {
  copData.yearlyData[year] = {
    totalDebtService: 0, // To be calculated from individual COPs
    principalPayment: 0,
    interestPayment: 0,
    newIssuances: 0,
    outstandingDebt: 0
  };
}

// Add instructions for manual data extraction
copData.extractionInstructions = {
  note: "To complete this data structure, extract the following from each PDF:",
  requiredFields: [
    "Issuance date",
    "Maturity date", 
    "Original principal amount",
    "Current outstanding balance",
    "Interest rate(s)",
    "Annual debt service amount",
    "Purpose/use of proceeds",
    "Projects financed",
    "Payment schedule"
  ],
  calculationsNeeded: [
    "Total outstanding debt across all COPs",
    "Total annual debt service",
    "Debt service by year (for trending)",
    "Debt per pupil calculations",
    "Debt service as % of budget"
  ]
};

// Save the COP data structure
const outputPath = path.join(__dirname, '../public/dps_cop_data.json');
fs.writeFileSync(outputPath, JSON.stringify(copData, null, 2));

console.log(`Created COP data structure: ${outputPath}`);
console.log(`Found ${copDocuments.length} COP documents:`);
copDocuments.forEach(doc => console.log(`  - ${doc}`));

console.log('\nCOP Series breakdown:');
const seriesCounts = {};
copData.copDetails.forEach(cop => {
  seriesCounts[cop.series] = (seriesCounts[cop.series] || 0) + 1;
});
Object.entries(seriesCounts).forEach(([series, count]) => {
  console.log(`  ${series}: ${count} documents`);
});

console.log('\nNext steps:');
console.log('1. Manually extract data from each PDF document');
console.log('2. Update the JSON file with actual values');
console.log('3. Calculate summary statistics');
console.log('4. Integrate with budget analysis in the React app');

console.log('\nData structure created successfully!');
console.log('Note: All financial values are currently 0 and need manual extraction from PDFs.');