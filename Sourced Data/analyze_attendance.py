#!/usr/bin/env python3
import sys
import subprocess

# Try to import pandas, if not available, install it
try:
    import pandas as pd
except ImportError:
    print("pandas not found, installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas", "openpyxl"])
    import pandas as pd

import os
from pathlib import Path

# Define the attendance data directory
attendance_dir = Path("/mnt/c/Users/popta/OneDrive/Desktop/Brian Stuff/Court Case/Documents for GPT/CO_District_Map_App_Charts_FULL/Sourced Data/Attendance Data")

# List all files in the directory
files = sorted(list(attendance_dir.glob("*.xlsx")))
print(f"\nTotal Excel files in Attendance Data folder: {len(files)}")
print("\n=== FILE LIST ===")
for f in files:
    print(f"  - {f.name}")

# Analyze each file type
print("\n=== ANALYZING FILE STRUCTURE ===")

# Sample files to analyze
sample_files = [
    "2022-2023_TruancyData.xlsx",
    "2022-2023_ChronicAbsenteeism.xlsx",
    "2023-2024 Attendance and Truancy Rates by School - Suppressed.xlsx",
    "2023-2024 Chronic Absenteeism by School - Suppressed.xlsx"
]

for filename in sample_files:
    filepath = attendance_dir / filename
    if filepath.exists():
        print(f"\n--- {filename} ---")
        try:
            # Read the Excel file
            df = pd.read_excel(filepath, nrows=5)  # Read first 5 rows to understand structure
            
            print(f"Columns ({len(df.columns)}):")
            for col in df.columns:
                print(f"  - {col}")
            
            print(f"\nFirst few rows:")
            print(df.head(3).to_string(index=False, max_cols=10))
            
            # Check for DPS schools
            full_df = pd.read_excel(filepath)
            if 'DISTRICT_NAME' in full_df.columns:
                dps_count = full_df[full_df['DISTRICT_NAME'].str.contains('DENVER', case=False, na=False)].shape[0]
                print(f"\nDPS (Denver) schools found: {dps_count}")
            elif 'District Name' in full_df.columns:
                dps_count = full_df[full_df['District Name'].str.contains('DENVER', case=False, na=False)].shape[0]
                print(f"\nDPS (Denver) schools found: {dps_count}")
            
            print(f"Total rows: {len(full_df)}")
            
        except Exception as e:
            print(f"Error reading file: {e}")

# Analyze year coverage
print("\n=== YEAR COVERAGE ===")
years = set()
for f in files:
    # Extract year from filename
    if f.name.startswith("20"):
        year = f.name[:9]  # Gets "2022-2023" format
        years.add(year)

sorted_years = sorted(years)
print(f"Years covered: {', '.join(sorted_years)}")
print(f"Span: {sorted_years[0]} to {sorted_years[-1]}")

# Analyze metrics available
print("\n=== METRICS AVAILABLE ===")
print("Based on filenames, the following metrics are tracked:")
print("1. Truancy Data (2013-2024)")
print("2. Chronic Absenteeism (2016-2024)")
print("3. Attendance Rates (2023-2024)")