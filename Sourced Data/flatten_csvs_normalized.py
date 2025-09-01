import os
import pandas as pd
import re

# Directory containing the CSV files
dir_path = r'c:/Users/popta/OneDrive/Desktop/Brian Stuff/Court Case/Documents for GPT/CO_District_Map_App_Charts_FULL/Sourced Data'

# List all CSV files in the directory
csv_files = [f for f in os.listdir(dir_path) if f.endswith('.csv')]

# Helper to extract year from filename
def extract_year(filename):
    match = re.search(r'(\d{4})[\-_]?(\d{2})?', filename)
    if match:
        year = match.group(1)
        if match.group(2):
            return f"{year}-{str(int(match.group(2))+2000)}"
        return year
    return ''

# Standard columns for the unified data model
columns = [
    'year', 'district_code', 'district_name', 'school_code', 'school_name', 'grade', 'race_ethnicity', 'gender', 'enrollment', 'source_file'
]

race_gender_columns = [
    'American Indian or Alaskan Native Female',
    'American Indian or Alaskan Native Male',
    'Asian Female',
    'Asian Male',
    'Black or African American Female',
    'Black or African American Male',
    'Hispanic or Latino Female',
    'Hispanic or Latino Male',
    'White Female',
    'White Male',
    'Native Hawaiian or Other Pacific Islander Female',
    'Native Hawaiian or Other Pacific Islander Male',
    'Two or More Races Female',
    'Two or More Races Male'
]

all_rows = []

for file in csv_files:
    file_path = os.path.join(dir_path, file)
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        print(f"Could not read {file}: {e}")
        continue
    year = extract_year(file)
    for _, row in df.iterrows():
        for col in race_gender_columns:
            if col in row:
                # Split column into race and gender
                parts = col.rsplit(' ', 1)
                race = parts[0]
                gender = parts[1] if len(parts) > 1 else ''
                enrollment = row[col]
                all_rows.append({
                    'year': year,
                    'district_code': row.get('Org. Code', ''),
                    'district_name': row.get('Organization Name', ''),
                    'school_code': row.get('School Code', ''),
                    'school_name': row.get('School Name', ''),
                    'grade': row.get('Grade Level', ''),
                    'race_ethnicity': race,
                    'gender': gender,
                    'enrollment': enrollment,
                    'source_file': file
                })

flat_df = pd.DataFrame(all_rows, columns=columns)
flat_df.to_csv(os.path.join(dir_path, 'flattened_data_normalized.csv'), index=False)
print(f"Normalized flattened data written to flattened_data_normalized.csv with {len(flat_df)} rows.")
