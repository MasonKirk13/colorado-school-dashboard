# Windows Execution Instructions for ACFR Processing

Since the scripts need Python libraries that aren't available in this WSL environment, you'll need to run them directly on Windows.

## 🖥️ **Run These Commands in Windows Command Prompt or PowerShell**

### **Step 1: Install Python (if not already installed)**
1. Go to https://python.org/downloads/
2. Download and install Python 3.8 or newer
3. ✅ **Important:** Check "Add Python to PATH" during installation

### **Step 2: Install Required Libraries**
Open Command Prompt (Windows Key + R, type `cmd`) and run:
```cmd
pip install PyPDF2 pdfplumber pandas
```

### **Step 3: Navigate to Scripts Folder**
```cmd
cd "C:\Users\popta\OneDrive\Desktop\Brian Stuff\Court Case\Documents for GPT\CO_District_Map_App_Charts_FULL\Sourced Data\COP Documents"
```

### **Step 4: Test with One File First**
```cmd
python extract_acfr_text.py "..\ACFR\FY24 ACFR.pdf"
```

### **Step 5: If Test Works, Process All Files**
```cmd
python extract_acfr_text.py "..\ACFR"
```

### **Step 6: Analyze Results**
```cmd
python batch_extract_cop_data.py
```

## 📁 **What Will Be Created**

After running the scripts, you'll have:
```
COP Documents/
├── extracted_cop_content/                    ← New folder created
│   ├── FY24_ACFR_COP_extracted.txt         ← COP content from FY24
│   ├── CAFR_2019_Final_COP_extracted.txt   ← COP content from 2019
│   ├── Annual_Report_FY_2021-22_COP_extracted.txt
│   └── ... (one file for each ACFR)
├── comprehensive_cop_analysis.json          ← Machine-readable analysis
└── COP_Analysis_Summary.txt                 ← Human-readable summary
```

## 🎯 **What to Look For**

### **In Individual Extracted Files:**
- Look for sections with "Certificate of Participation"
- Tables showing debt amounts and schedules  
- Total outstanding debt figures
- Annual debt service amounts

### **In COP_Analysis_Summary.txt:**
- **Data quality scores by year** (higher = better)
- **Years with most complete COP data**
- **Recommendations** for which years to focus on
- **Cross-year patterns** identified

## 📊 **Expected Results**

With your ACFR collection (2014-2024), you should see:

### **High-Quality Years** (likely to score well):
- FY24 ACFR.pdf (most recent, comprehensive)
- CAFR 2019 Final.pdf (CAFR format usually comprehensive)
- Newer Annual Reports (better standardized reporting)

### **Key Data Points to Extract:**
- **Total COP debt by year** (shows growth over time)
- **Annual debt service by year** (shows budget burden)
- **Individual COP series** (EA, EP, ER, ES, MD, MS)
- **Interest rates and terms** (shows cost of borrowing)

## 🚨 **If You Get Errors**

### **"Python not found"**
- Restart Command Prompt after installing Python
- Try `py` instead of `python`
- Check Python was added to PATH during installation

### **"Module not found"**
- Re-run: `pip install PyPDF2 pdfplumber pandas`
- Try: `pip3 install PyPDF2 pdfplumber pandas`

### **"File not found"**
- Check you're in the right directory with `dir` command
- Use full paths if needed: `"C:\Users\popta\OneDrive\Desktop\Brian Stuff\..."`

### **"Permission denied"**
- Run Command Prompt as Administrator
- Check antivirus isn't blocking PDF processing

## 🎯 **After Processing**

Once you have the extracted content and analysis:

1. **Review COP_Analysis_Summary.txt** to identify best years
2. **Open individual extracted files** for those high-scoring years  
3. **Look for debt tables and total amounts**
4. **Use the manual extraction templates** to organize key figures
5. **Run the COP data processor** to update the visualization with real data

## 💡 **Pro Tip**

Start with just the FY24 file first to make sure everything works, then process all files. The FY24 ACFR should have the most comprehensive and recent COP data.

This will transform your legal case from sample data to 10+ years of documented evidence from DPS's own audited financial statements!