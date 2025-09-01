# Colorado District Data Processing Documentation

## Overview
This document explains the data sources and processing steps for the Colorado District Map application. The application displays enrollment trends, FRL (Free and Reduced Lunch) percentages, and CMAS test scores for Colorado school districts.

## Data Sources

### 1. CMAS Test Score Data (2016-2024)
**Location:** `/Sourced Data/General CMAS Score Data/`

- **2016:** `2016 ELA Math District and School Summary final.xlsx`
- **2017:** `2017 CMAS ELA Math District & School Overall Results FINAL.xlsx`
- **2018:** `2018 CMAS ELA and Math District and School Summary Achievement Results_FINAL.xlsx`
- **2019:** `2019 CMAS ELA MATH District and School Achievement Results.xlsx`
- **2021:** `2021 CMAS ELA and Math District and School Summary Achievement Results - Required Tests.xlsx`
- **2022:** `2022 CMAS ELA and Math District and School Summary Achievement Results.xlsx`
- **2023:** `2023 CMAS ELA and Math District and School Summary Achievement Results.xlsx`
- **2024:** `2024 CMAS ELA and Math District and School Summary Results.xlsx`

**Note:** 2020 has no data due to COVID-19 testing cancellation.

### 2. Enrollment and FRL Data (2014-2024)
**Location:** `/Sourced Data/Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx`

This Excel file contains sheets for each school year with:
- School-level enrollment counts
- Free lunch counts
- Reduced lunch counts
- Demographic breakdowns

**Special Cases:**
- 2016-2017 sheet has empty FRL columns
- 2020-2024 sheets contain "*" (suppressed) values for some schools

### 3. 2016 FRL Data (Special Source)
**Location:** `/Sourced Data/Demographic data/2016-17_PK-12_PupilMembership_bySchool_FRL_0.xlsx`

This file contains the actual 2016 FRL data in a different format with combined free/reduced counts.

## Processing Steps

### Unified Data Processor
**Script:** `/Sourced Data/unified_data_processor.js`

This is the main processor that combines all data sources without overwriting issues.

#### Step 1: Process CMAS Data
1. Reads all CMAS Excel files
2. Handles two different file formats:
   - 2016-2017: Special format with data in column 23
   - 2018+: Standard format with varying column positions
3. Aggregates scores by grade level
4. Calculates district-wide averages for ELA and Math
5. Outputs percentage of students meeting or exceeding expectations

#### Step 2: Process Enrollment/FRL Data
1. Reads the main FRL Excel file
2. Processes each year's sheet
3. Handles suppressed values ("*") by:
   - Accepting districts with partial data
   - Only requiring some schools to have valid FRL data
4. Calculates district-level FRL percentages

#### Step 3: Process 2016 FRL Data
1. Reads the separate 2016 demographic file
2. Aggregates school-level data to districts
3. Calculates FRL percentages
4. Overrides empty 2016 data from main file

#### Step 4: Combine All Data
1. Merges CMAS and enrollment data by district
2. Adds COVID-19 notes for 2020 and 2021
3. Sorts data chronologically
4. Outputs to `/public/district_data_complete.json`

## Data Normalization

### District Name Normalization
Districts may appear with different naming conventions across files:
- Case variations: "Adams 12 Five Star Schools" vs "ADAMS 12 FIVE STAR SCHOOLS"
- "RE" variations: "Alamosa Re-11J" vs "Alamosa RE-11J"

The normalizer:
1. Converts to title case
2. Preserves uppercase for numbers with letters (e.g., "27J")
3. Ensures "RE" is always uppercase

## Common Issues and Solutions

### Issue 1: Missing 2016 FRL Data
**Cause:** Main FRL file has empty columns for 2016
**Solution:** Use separate demographic file for 2016 data

### Issue 2: Missing FRL Data 2020-2024
**Cause:** Many schools have suppressed ("*") values
**Solution:** Relaxed validation - accept districts with partial data

### Issue 3: Limited 2016 CMAS Data
**Cause:** Processor had 1000-row limit, but file has 1200+ district rows
**Solution:** Remove row limit in processor

### Issue 4: Data Overwrites
**Cause:** Multiple processors writing to same output file
**Solution:** Unified processor that handles all data sources

## Running the Processor

To rebuild all data:
```bash
cd "Sourced Data"
node unified_data_processor.js
```

This will:
1. Process all CMAS files (2016-2024)
2. Process all enrollment/FRL data
3. Apply special handling for 2016 FRL
4. Generate complete dataset in `/public/district_data_complete.json`

## Output Format

The output JSON has this structure:
```json
{
  "District Name": {
    "enrollment_trends": [
      {
        "year": "2016",
        "enrollment": 12345,
        "frl": 45.6
      }
    ],
    "cmas_scores": [
      {
        "year": "2016", 
        "met_or_exceeded_pct": 48.5
      },
      {
        "year": "2020",
        "met_or_exceeded_pct": null,
        "note": "No testing due to COVID-19"
      }
    ]
  }
}
```

## Validation

After processing, verify:
1. 2016 CMAS data exists for ~70% of districts
2. 2016 FRL data exists for ~90% of districts  
3. FRL data for 2020-2024 exists for most districts
4. Sample districts (Denver County 1, Academy 20) have complete data