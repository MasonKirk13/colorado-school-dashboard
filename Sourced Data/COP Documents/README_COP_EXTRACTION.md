# DPS Certificate of Participation (COP) Data Extraction Guide

This guide provides multiple methods to extract real financial data from DPS COP documents and integrate it into the visualization application.

## 📁 Files Created for You

1. **`ai_extraction_prompts.txt`** - Prompts for AI services that can read PDFs
2. **`manual_extraction_template.txt`** - Template for manual data entry
3. **`cop_data_collection_template.csv`** - Excel-compatible spreadsheet template
4. **`process_extracted_cop_data.js`** - Script to convert extracted data to JSON
5. **This README** - Complete instructions

## 🎯 Current Status

- ✅ **Sample Data**: Application currently uses realistic sample data ($179M debt, $14.7M annual service)
- ✅ **Working Integration**: COP debt visualizations are functional with sample data
- 🔄 **Next Step**: Replace with real DPS financial data

## 🚀 Extraction Methods (Choose One)

### Method 1: AI-Powered Extraction (Recommended)

**Best for: Quick, comprehensive extraction**

1. Go to [Claude.ai](https://claude.ai) or ChatGPT
2. Upload the `FY24 ACFR.pdf` file
3. Copy one of the prompts from `ai_extraction_prompts.txt`
4. Paste the structured response into `cop_data_collection_template.csv`
5. Run the processing script (see Processing section below)

### Method 2: Manual Extraction with Template

**Best for: Detailed control over data quality**

1. Open `manual_extraction_template.txt`
2. Open DPS COP documents (start with FY24 ACFR.pdf)
3. Fill in the template for each COP found
4. Transfer data to `cop_data_collection_template.csv`
5. Run the processing script

### Method 3: Direct CSV Entry

**Best for: Spreadsheet users**

1. Open `cop_data_collection_template.csv` in Excel
2. Fill in columns with data from COP documents:
   - **COP_ID**: Series identifier (EA801455, etc.)
   - **Issue_Date**: When COP was issued (MM/DD/YYYY)
   - **Maturity_Date**: When debt is fully paid (MM/DD/YYYY)
   - **Original_Amount**: Initial principal amount
   - **Outstanding_Principal**: Current amount owed
   - **Interest_Rate**: Annual interest rate (as decimal)
   - **Annual_Debt_Service**: Yearly payment amount
   - **Purpose**: What the money was used for
3. Save the CSV file
4. Run the processing script

## 🔧 Processing Extracted Data

Once you have extracted data in any format:

```bash
# Navigate to COP Documents folder
cd "Sourced Data/COP Documents"

# Run the processor script
node process_extracted_cop_data.js
```

This script will:
- ✅ Read your extracted data from CSV
- ✅ Update the main JSON file with real financial figures  
- ✅ Recalculate all summary statistics
- ✅ Generate debt service projections
- ✅ Update debt burden analysis
- ✅ Prepare data for visualization

## 📊 What Gets Updated

After processing real data, the application will show:

### Real Financial Impact
- **Actual total outstanding COP debt** (instead of $179M sample)
- **Actual annual debt service** (instead of $14.7M sample)
- **Real debt service per pupil** calculations
- **Accurate debt burden percentages**

### Enhanced Visualizations
- True debt growth trends over time
- Actual correlation between debt service and educational outcomes
- Real impact on budget allocation
- Precise cost of financial mismanagement

## 🎯 Priority Data Points

If time is limited, focus on extracting these critical fields:

1. **Outstanding Principal** - Current amount owed on each COP
2. **Annual Debt Service** - Yearly payment for each COP  
3. **Interest Rate** - Cost of the debt
4. **Maturity Date** - When debt is paid off
5. **Purpose** - What the money was used for

These five data points will provide 80% of the value for legal analysis.

## 📋 Document Priority Order

1. **FY24 ACFR.pdf** - Start here (most comprehensive overview)
2. **Individual COP documents** - For detailed terms and projects
3. **Budget documents** - For debt service budget impacts

## 🔍 What to Look For in Documents

### In ACFR (Annual Report):
- "Long-term Debt" section
- "Certificates of Participation" section  
- "Debt Service Schedule" tables
- "Debt Burden Analysis" 

### In Individual COP Documents:
- Cover page with basic terms
- "Use of Proceeds" section
- Payment schedule tables
- Interest rate and maturity information

## ⚠️ Common Issues & Solutions

**Problem**: "I can't find financial data in the PDFs"
- **Solution**: Use AI extraction prompts - they're designed to find embedded data

**Problem**: "The numbers don't seem right"
- **Solution**: Focus on most recent data (FY24), ignore historical projections

**Problem**: "Some COPs might be retired/paid off"
- **Solution**: Mark status as "Retired" in the template, processor will handle this

**Problem**: "Processing script shows errors"
- **Solution**: Check CSV format, ensure numbers don't have dollar signs or commas

## 🎯 Expected Outcomes

With real data extracted, you'll be able to demonstrate:

### Legal Evidence Strength
- **Exact financial burden** on DPS from poor debt management
- **Precise correlation** between debt service growth and educational decline
- **Specific dollar amounts** diverted from classroom instruction
- **Documentary proof** of fiscal mismanagement patterns

### Powerful Visualizations
- Real debt burden trends showing increasing obligations
- True cost per student of financial decisions
- Actual budget impact of COP debt service
- Evidence-based correlation with attendance crisis

## 🚀 Quick Start (15 Minutes)

1. Upload `FY24 ACFR.pdf` to Claude.ai
2. Use "PROMPT 2: FINANCIAL SUMMARY FOCUSED EXTRACTION" from `ai_extraction_prompts.txt`
3. Copy the financial summary response
4. Paste key numbers into `cop_data_collection_template.csv`
5. Run `node process_extracted_cop_data.js`
6. Refresh the web application to see real data

This quick approach will give you the core financial metrics needed for legal analysis.

## 📞 Need Help?

If you run into issues:
1. Start with the AI extraction method (easiest)
2. Focus on just the FY24 ACFR document first
3. Don't worry about getting every detail - core financial data is most important
4. The processing script provides helpful error messages
5. You can always start with partial data and add more later

The goal is to replace sample data with actual DPS debt obligations to strengthen your legal case with precise financial evidence.