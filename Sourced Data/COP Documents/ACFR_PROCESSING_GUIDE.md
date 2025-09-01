# DPS ACFR Processing Guide (2014-2024)

Since you have 10+ years of ACFR data but Claude.ai can't handle the large files, these local tools will extract the COP data for you.

## 🎯 What This Will Accomplish

With 2014-2024 ACFR data, you'll be able to show:
- **10-year debt growth trajectory** (exact dollar amounts)
- **Escalating annual debt service** burden over time  
- **Correlation with educational decline** (debt up, attendance down)
- **Precise budget impact** by year
- **Pattern of fiscal mismanagement** with documentary evidence

This is **smoking gun evidence** for your legal case.

## 🚀 Step-by-Step Process

### Step 1: Install Python Libraries
```bash
pip install PyPDF2 pdfplumber pandas
```

### Step 2: Organize Your ACFR Files
Put all ACFR PDFs in one folder, named clearly:
```
acfr_files/
├── FY2014_ACFR.pdf
├── FY2015_ACFR.pdf
├── FY2016_ACFR.pdf
├── ...
├── FY2024_ACFR.pdf
```

### Step 3: Extract COP Content from All Years
```bash
# Navigate to COP Documents folder
cd "Sourced Data/COP Documents"

# Extract COP sections from all ACFR files
python extract_acfr_text.py /path/to/your/acfr_files/

# This creates: extracted_cop_content/FY20XX_ACFR_COP_extracted.txt for each year
```

### Step 4: Analyze Patterns Across All Years
```bash
# Run the batch analyzer
python batch_extract_cop_data.py

# This creates:
# - comprehensive_cop_analysis.json (machine-readable)
# - COP_Analysis_Summary.txt (human-readable)
```

### Step 5: Review Results
Open `COP_Analysis_Summary.txt` to see:
- Which years have the best COP data
- Data quality scores by year
- Common patterns found
- Recommendations for manual extraction

## 📊 What the Tools Extract

### Automatic Pattern Detection:
- **Total COP debt amounts** by year
- **Annual debt service** figures  
- **Individual COP series** (EA, EP, ER, ES, MD, MS)
- **Interest rates** and maturity dates
- **Debt tables** and schedules

### Multi-Year Analysis:
- **Debt growth trends** over 10 years
- **Years with complete data** vs. gaps
- **Common COP series** across years
- **Data quality assessment** by year

## 🎯 Expected Timeline Evidence

With 2014-2024 data, you'll likely see:

**2014-2016:** Baseline COP debt levels
**2017-2019:** Growing debt obligations  
**2020-2022:** Accelerated borrowing (pandemic impact)
**2023-2024:** Peak debt burden + attendance crisis

This timeline directly correlates with:
- Declining educational outcomes
- Increasing chronic absenteeism
- Budget resources diverted to debt service
- Systematic fiscal mismanagement

## 🚨 Priority Years to Focus On

Based on typical patterns, prioritize:

1. **2024** - Current debt crisis peak
2. **2020** - Major borrowing year (COVID)
3. **2016** - Mid-timeline comparison
4. **2014** - Baseline debt levels

Even these 4 years would provide compelling evidence.

## 📋 After Extraction: Next Steps

1. **Review extracted text files** for the highest-scoring years
2. **Manually extract key figures** using the provided templates
3. **Fill in the CSV template** with real financial data
4. **Run the data processor** to update visualizations
5. **Generate legal evidence reports** with actual debt burden analysis

## 🔍 What to Look For in Extracted Files

### Key Sections:
- "Notes to Financial Statements"
- "Long-term Debt" 
- "Certificate of Participation"
- "Debt Service Schedule"
- "Outstanding Obligations"

### Critical Numbers:
- **Total outstanding COP debt**
- **Annual debt service requirements**  
- **Individual COP amounts and terms**
- **Interest rates and maturity dates**
- **Debt burden ratios** (if calculated)

## 💡 Pro Tips

### If Extraction Finds Limited Data:
- ACFRs sometimes bury COP details in footnotes
- Look for "Component Unit" financial statements
- Check "Required Supplementary Information" sections
- Some years may consolidate debt reporting

### If You Find Great Data:
- Focus on debt service schedules (show future burden)
- Look for "subsequent events" (new debt after year-end)
- Note any refinancing activity
- Check for debt policy compliance discussions

## 🎯 Legal Evidence Value

This 10-year ACFR analysis will provide:

### Documentary Proof:
- **Exact debt growth** from DPS's own financial reports
- **Audited financial statements** (highest credibility)
- **Year-over-year comparisons** showing escalation
- **Official budget impact** calculations

### Correlation Evidence:
- **Debt service growth** timeline
- **Educational outcome decline** timeline  
- **Budget allocation** impact over time
- **Systematic mismanagement** pattern

### Quantified Impact:
- **Dollars per student** diverted to debt service
- **Percentage of budget** consumed by COP payments
- **Opportunity cost** of educational investments
- **Future burden** on taxpayers and students

## 🚀 Quick Start (If Time is Limited)

1. **Extract just FY2024 and FY2020** ACFRs first
2. **Run the analysis tools** on these two years
3. **Manually extract** the key debt figures
4. **Update the visualization** with real 2-year comparison
5. **Expand to full 10-year analysis** as time permits

Even 2 years of real data will dramatically strengthen your legal case compared to sample data.

## 📞 Troubleshooting

**Problem:** "No COP content found"
- **Solution:** Try different ACFR sections, check file naming

**Problem:** "Python libraries won't install"  
- **Solution:** Use `pip3` instead of `pip`, or install Anaconda

**Problem:** "Extraction seems incomplete"
- **Solution:** Review extracted text files manually, some data may need hand-picking

**Problem:** "Too much extracted content to review"
- **Solution:** Use the analysis summary to focus on highest-scoring years first

The goal is transforming your legal case from "sample data showing a problem" to "10 years of audited financial statements proving systematic fiscal mismanagement with precise dollar amounts."