import pandas as pd
import openpyxl
import re
import os

def find_header_row_xlsx(filename, search_terms):
    wb = openpyxl.load_workbook(filename, read_only=True, data_only=True)
    ws = wb.active
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        row_strs = [str(cell).strip().lower() if cell is not None else '' for cell in row]
        # Count how many cells match any search term
        match_count = sum(any(term in cell for term in search_terms) for cell in row_strs)
        if match_count >= 3:
            return i
        # If first match is a title row, use next row as header
        if any(any(term in cell for term in search_terms) for cell in row_strs):
            return i + 1
    return 0

def pad_code(val):
    try:
        return f"{int(float(val)):04d}"
    except:
        return str(val).zfill(4)

def extract_grade(grade_str):
    if pd.isnull(grade_str):
        return None
    s = str(grade_str).strip().lower()
    if 'pk' in s:
        return 'PK'
    if 'k' in s and not s.startswith('1'):
        return 'K'
    m = re.match(r'(\d+)', s)
    if m:
        return int(m.group(1))
    return None

def process_year(membership_file, lunch_file, year):

    # Dynamically find header row for membership file
    mem_header = find_header_row_xlsx(membership_file, ['school', 'grade', 'code'])
    lunch_header = find_header_row_xlsx(lunch_file, ['school', 'lunch'])

    # Load membership
    df = pd.read_excel(membership_file, header=mem_header)
    # Detect column names
    def find_col_substring(cols, options, require_all=None, require_any=None):
        cols_lc = [c.strip().lower() for c in cols]
        for i, c in enumerate(cols_lc):
            for o in options:
                if o in c:
                    return cols[i]
        # If require_all is set, match columns containing all substrings
        if require_all:
            for i, c in enumerate(cols_lc):
                if all(sub in c for sub in require_all):
                    return cols[i]
        # If require_any is set, match columns containing all of any group
        if require_any:
            for group in require_any:
                for i, c in enumerate(cols_lc):
                    if all(sub in c for sub in group):
                        return cols[i]
        raise Exception(f'Could not find column for options: {options}, require_all: {require_all}, require_any: {require_any}')
    cols = list(df.columns)
    grade_col = find_col_substring(cols, ['grade'])
    org_code_col = find_col_substring(
        cols,
        ['organization code', 'org. code', 'org code', 'district code'],
        require_any=[['org', 'code'], ['district', 'code'], ['organization', 'code']]
    )
    org_name_col = find_col_substring(cols, ['organization name', 'org name', 'district name'])
    school_code_col = find_col_substring(cols, ['school code'])
    # Extract school total rows based on year and file structure
    year_int = int(year[:4])
    if year == '2015_16':
        # For 2015-16, last row per school where grade is blank
        df['_grade_blank'] = df[grade_col].isnull() | (df[grade_col].astype(str).str.strip() == '')
        school_totals = df[df['_grade_blank']].copy()
        # For grade range, use all non-blank grade rows
        not_total = df[~df['_grade_blank']]
    elif year_int >= 2016:
        # For 2016-17 and later, use all rows (already totals)
        school_totals = df.copy()
        not_total = df.copy()
    else:
        # For earlier years, use 'Sch Total'
        school_totals = df[df[grade_col].astype(str).str.strip().str.lower() == 'sch total'].copy()
        not_total = df[df[grade_col].astype(str).str.strip().str.lower() != 'sch total']

    # Compute grade ranges as before
    grade_map = not_total.groupby([org_code_col, school_code_col])[grade_col].apply(list)
    school_grades = {}
    for key, grades in grade_map.items():
        extracted = [extract_grade(g) for g in grades if extract_grade(g) is not None]
        def grade_sort_key(g):
            if g == 'PK': return -2
            if g == 'K': return -1
            return g
        if extracted:
            sorted_grades = sorted(extracted, key=grade_sort_key)
            school_grades[key] = (sorted_grades[0], sorted_grades[-1])
        else:
            school_grades[key] = (None, None)
    # Add lowest/highest grade columns
    lowest, highest = [], []
    for _, row in school_totals.iterrows():
        key = (row[org_code_col], row[school_code_col])
        lo, hi = school_grades.get(key, (None, None))
        lowest.append(lo)
        highest.append(hi)
    school_totals['Lowest Grade'] = lowest
    school_totals['Highest Grade'] = highest
    # Normalize columns for merge
    membership = school_totals.rename(columns={
        org_code_col: 'district code',
        org_name_col: 'district name'
    })
    membership.columns = [c.strip().lower() for c in membership.columns]
    # Load lunch
    lunch = pd.read_excel(lunch_file, header=lunch_header)
    lunch.columns = [c.strip().lower() for c in lunch.columns]
    # Zero-pad codes and normalize names
    for df2 in [membership, lunch]:
        df2['district code'] = df2['district code'].apply(pad_code)
        df2['school code'] = df2['school code'].apply(pad_code)
        df2['district name'] = df2['district name'].astype(str).str.strip().str.upper()
    # Merge
    merge_keys = ['district code', 'district name', 'school code']
    merged = pd.merge(membership, lunch, on=merge_keys, how='left', suffixes=('', '_lunch'))
    # Remove duplicate columns
    cols_to_drop = ['county code', 'county name', 'school name_lunch', 'pk-12 count']
    for col in cols_to_drop:
        if col in merged.columns:
            merged = merged.drop(columns=col)
    # Remove rows with '0nan' or NaN/blank in school code for 2015-16
    if year == '2015_16':
        sc_col = 'school code'
        merged = merged[~merged[sc_col].astype(str).str.lower().isin(['0nan', 'nan', '', 'none'])]
        merged = merged[merged[sc_col].notnull()]

    # For 2016-17 and later, keep only (ALL GRADE LEVELS) rows
    year_int = int(year[:4])
    grade_cols = [c for c in merged.columns if 'grade' in c.lower()]
    if year_int >= 2016 and grade_cols:
        # Use the first grade col for filtering
        grade_col = grade_cols[0]
        merged = merged[merged[grade_col].astype(str).str.strip().str.lower().str.contains('all grade')]
    # Drop all grade-related columns for all years
    if grade_cols:
        merged = merged.drop(columns=grade_cols)

    # Save
    outname = f'{year}_membership_schooltotals_with_grades_and_lunch.csv'
    merged.to_csv(outname, index=False)
    print(f'Processed {year}: {outname}')

# File patterns for each year
years = [
    ('2014_15_sch_membershipbysch_race_ethnicity_gender_grade.xlsx', '2014_15_PK_12_FreeReducedLunchEligibilitybyDistrictandSchool_2.xlsx', '2014_15'),
    ('2015_16_sch_membershipbysch_race_ethnicity_gender_grade_1.xlsx', '2015_16_PK_12_FreeReducedLunchEligibilitybySchool_1.xlsx', '2015_16'),
    ('2016-17_sch_membershipbysch_race_ethnicity_gender_grade.xlsx', '2016-17_PK-12_PupilMembership_bySchool_FRL_0.xlsx', '2016_17'),
    ('2017-18-Membership-Race-Gender-byGradeSchool.xlsx', '2017-18_PK12_FRL_bySchool_0.xlsx', '2017_18'),
    ('2018-19-Membership-Race-Gender-byGradeSchool.xlsx', '2018-19_PK12_FRL_bySchool.xlsx', '2018_19'),
    ('2019-20-Membership-Race-Gender-byGradeSchool.xlsx', '2019-20_PK12_FRL_bySchool2a.xlsx', '2019_20'),
]

for mem, lunch, year in years:
    if os.path.exists(mem) and os.path.exists(lunch):
        try:
            process_year(mem, lunch, year)
        except Exception as e:
            print(f'Error processing {year}:', e)
    else:
        print(f'Skipping {year}: files not found')
