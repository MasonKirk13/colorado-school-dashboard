import pandas as pd
import numpy as np

# Load the 2024 CMAS file with header=1 as requested
file_path = '/mnt/c/Users/popta/OneDrive/Desktop/Brian Stuff/Court Case/Documents for GPT/CO_District_Map_App_Charts_FULL/Sourced Data/General CMAS Score Data/2024 CMAS ELA and Math District and School Summary Results.xlsx'

try:
    # Read the Excel file with header=1
    df = pd.read_excel(file_path, header=1)
    
    print("=== DataFrame Shape ===")
    print(f"Total rows: {len(df)}")
    print(f"Total columns: {len(df.columns)}")
    
    print("\n=== Column Names ===")
    for i, col in enumerate(df.columns):
        print(f"Column {i}: {col}")
    
    print("\n=== Looking for 'Level' in column 0 ===")
    # Find where 'Level' appears in the first column
    first_col = df.iloc[:, 0]
    level_indices = []
    for idx, val in enumerate(first_col):
        if pd.notna(val) and str(val).strip().lower() == 'level':
            level_indices.append(idx)
            print(f"Found 'Level' at row index: {idx}")
    
    # If we found Level, let's look at the data structure
    if level_indices:
        start_idx = level_indices[0]
        print(f"\n=== Data around 'Level' row (rows {start_idx-2} to {start_idx+10}) ===")
        for i in range(max(0, start_idx-2), min(len(df), start_idx+10)):
            print(f"Row {i}: {df.iloc[i, :5].tolist()}")  # Show first 5 columns
    
    print("\n=== Searching for DISTRICT and SCHOOL rows ===")
    # Count DISTRICT and SCHOOL entries
    district_count = 0
    school_count = 0
    denver_schools = []
    
    # Check if there's a Level column
    level_col_idx = None
    for idx, col in enumerate(df.columns):
        if pd.notna(col) and 'level' in str(col).lower():
            level_col_idx = idx
            print(f"Found 'Level' column at index: {idx} ('{col}')")
            break
    
    # If no Level column found in headers, check first column values
    if level_col_idx is None:
        print("\nNo 'Level' column found in headers. Checking first column for Level values...")
        # Look for rows where first column contains DISTRICT or SCHOOL
        for idx, row in df.iterrows():
            first_val = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ''
            if 'DISTRICT' in first_val.upper():
                district_count += 1
            elif 'SCHOOL' in first_val.upper():
                school_count += 1
                # Check if it's a Denver school
                row_str = ' '.join([str(val) for val in row if pd.notna(val)])
                if 'denver' in row_str.lower():
                    denver_schools.append((idx, row_str[:200]))  # First 200 chars
    else:
        # Check the Level column
        for idx, row in df.iterrows():
            level_val = str(row.iloc[level_col_idx]) if pd.notna(row.iloc[level_col_idx]) else ''
            if 'DISTRICT' in level_val.upper():
                district_count += 1
            elif 'SCHOOL' in level_val.upper():
                school_count += 1
                # Check if it's a Denver school
                row_str = ' '.join([str(val) for val in row if pd.notna(val)])
                if 'denver' in row_str.lower():
                    denver_schools.append((idx, row_str[:200]))  # First 200 chars
    
    print(f"\nTotal DISTRICT rows: {district_count}")
    print(f"Total SCHOOL rows: {school_count}")
    
    print(f"\n=== Denver Schools Found: {len(denver_schools)} ===")
    for idx, (row_idx, row_preview) in enumerate(denver_schools[:10]):  # Show first 10
        print(f"\nDenver School {idx+1} (Row {row_idx}):")
        print(row_preview)
    
    if len(denver_schools) > 10:
        print(f"\n... and {len(denver_schools) - 10} more Denver schools")
    
    # Look specifically for Denver County 1
    print("\n=== Searching for 'Denver County 1' ===")
    denver_county_1_count = 0
    for idx, row in df.iterrows():
        row_str = ' '.join([str(val) for val in row if pd.notna(val)])
        if 'denver county 1' in row_str.lower():
            denver_county_1_count += 1
            if denver_county_1_count <= 5:  # Show first 5
                print(f"\nRow {idx} contains 'Denver County 1':")
                print(row_str[:300])
    
    print(f"\nTotal rows containing 'Denver County 1': {denver_county_1_count}")
    
except Exception as e:
    print(f"Error reading Excel file: {e}")
    import traceback
    traceback.print_exc()

# Also check for other school-level data files
print("\n\n=== Checking for other potential school-level data files ===")
import os

data_dir = '/mnt/c/Users/popta/OneDrive/Desktop/Brian Stuff/Court Case/Documents for GPT/CO_District_Map_App_Charts_FULL/Sourced Data'
cmas_dir = os.path.join(data_dir, 'General CMAS Score Data')

print("\nCMAS files in directory:")
for file in os.listdir(cmas_dir):
    if file.endswith('.xlsx'):
        print(f"  - {file}")
        if 'school' in file.lower():
            print("    ^ This file mentions 'school' in the name")

print("\n\nChecking sheet names in the 2024 file:")
try:
    xl_file = pd.ExcelFile(file_path)
    print(f"Sheets in 2024 CMAS file: {xl_file.sheet_names}")
except Exception as e:
    print(f"Error reading sheet names: {e}")