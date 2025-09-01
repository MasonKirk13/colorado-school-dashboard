#!/usr/bin/env python3
"""
Simplify CMAS data for the Colorado District Map App
Extracts only district-level, all-grades data with key metrics
"""

import pandas as pd
import json
import sys

def simplify_cmas_data(input_file, output_file):
    """
    Extract and simplify CMAS data for the mapping application.
    
    Filters for:
    - Level = 'DISTRICT' 
    - Grade = 'All Grades'
    
    Extracts columns:
    - District Name
    - Subject (ELA/Math)
    - Year
    - Percent Met or Exceeded
    - Number of Valid Scores (optional)
    """
    
    try:
        # Read Excel file
        print(f"Reading {input_file}...")
        
        # Try to auto-detect header row
        df_preview = pd.read_excel(input_file, nrows=20)
        
        # If that doesn't work, try reading with no header and find it manually
        if 'Level' not in df_preview.columns:
            df_raw = pd.read_excel(input_file, header=None, nrows=50)
            
            # Find header row by looking for 'Level' column
            header_row = 0
            for i in range(len(df_raw)):
                if 'Level' in str(df_raw.iloc[i].values):
                    header_row = i
                    break
            
            df = pd.read_excel(input_file, header=header_row)
        else:
            df = pd.read_excel(input_file)
        
        print(f"Found columns: {list(df.columns)}")
        
        # Filter for district-level, all-grades data
        filtered = df[
            (df['Level'] == 'DISTRICT') & 
            (df['Grade'] == 'All Grades')
        ].copy()
        
        print(f"Filtered to {len(filtered)} district records")
        
        # Identify key columns (common variations)
        district_col = next((col for col in df.columns if 'District' in col and 'Name' in col), 'District Name')
        subject_col = next((col for col in df.columns if 'Subject' in col), 'Subject')
        year_col = next((col for col in df.columns if 'Year' in col), 'School Year')
        
        # Find percent met/exceeded column
        pct_cols = [col for col in df.columns if 'Percent' in col and ('Met' in col or 'Exceeded' in col)]
        pct_col = pct_cols[0] if pct_cols else 'Percent Met or Exceeded Expectations'
        
        # Extract simplified data
        simplified = filtered[[district_col, subject_col, year_col, pct_col]].copy()
        simplified.columns = ['district', 'subject', 'year', 'percent_met_exceeded']
        
        # Clean year (extract just the year part if it's like "2023-2024")
        simplified['year'] = simplified['year'].astype(str).str[:4]
        
        # Convert to format matching the app's expected structure
        result = {}
        
        for district in simplified['district'].unique():
            district_data = simplified[simplified['district'] == district]
            
            # Group by year and calculate average across subjects
            yearly_avg = district_data.groupby('year')['percent_met_exceeded'].mean().round(1)
            
            # Create CMAS scores array
            cmas_scores = []
            for year, pct in yearly_avg.items():
                cmas_scores.append({
                    "year": year,
                    "met_or_exceeded_pct": float(pct)
                })
            
            result[district] = {
                "cmas_scores": sorted(cmas_scores, key=lambda x: x['year'])
            }
        
        # Save to JSON
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        print(f"Saved simplified data to {output_file}")
        print(f"Processed {len(result)} districts")
        
        # Show sample
        sample_district = list(result.keys())[0]
        print(f"\nSample data for {sample_district}:")
        print(json.dumps(result[sample_district], indent=2))
        
    except Exception as e:
        print(f"Error processing file: {e}")
        print("Make sure pandas is installed: pip install pandas openpyxl")
        sys.exit(1)

if __name__ == "__main__":
    input_file = "General CMAS Score Data/2024 CMAS ELA and Math District and School Summary Results.xlsx"
    output_file = "cmas_district_simplified.json"
    
    simplify_cmas_data(input_file, output_file)