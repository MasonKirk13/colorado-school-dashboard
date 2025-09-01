import pandas as pd
import re

def normalize(col):
    return re.sub(r'[^a-zA-Z0-9]', '', str(col)).lower()

def detect_header_row(excel_file, search_keys):
    import openpyxl
    wb = openpyxl.load_workbook(excel_file, read_only=True, data_only=True)
    ws = wb.active
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        row_strs = [str(cell).strip().lower() if cell is not None else '' for cell in row]
        if any(any(key in cell for cell in row_strs) for key in search_keys):
            return i
    return 0

# Set your file paths here
new_file = '2024-25_FRL_Race_Gender_bySchoolandSchoolFlags - Suppressed.xlsx'
old_file = '2014_15_sch_membershipbysch_race_ethnicity_gender_grade.xlsx'

# Detect header row for each file
search_keys = ['school code', 'organization name', 'org. code', 'school name']
new_header = detect_header_row(new_file, search_keys)
old_header = detect_header_row(old_file, search_keys)

new_df = pd.read_excel(new_file, header=new_header)
old_df = pd.read_excel(old_file, header=old_header)

new_cols = [normalize(c) for c in new_df.columns]
old_cols = [normalize(c) for c in old_df.columns]

print('--- Columns in NEW file (2024-25):')
for c in new_df.columns:
    print(repr(c))
print('\n--- Columns in OLD file (2014-15):')
for c in old_df.columns:
    print(repr(c))

print('\n--- Columns in NEW but not in OLD:')
for c in new_cols:
    if c not in old_cols:
        print(c)

print('\n--- Columns in OLD but not in NEW:')
for c in old_cols:
    if c not in new_cols:
        print(c)

print('\n--- Columns in BOTH:')
for c in new_cols:
    if c in old_cols:
        print(c)
