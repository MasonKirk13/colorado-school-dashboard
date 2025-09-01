import os
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

# 2024-25 headers in correct order
headers = [
    'Organization Code', 'Organization Name', 'School Code', 'School Name',
    'Lowest Grade Level', 'Highest Grade Level', 'Charter Y/N', 'PK-12 Total',
    'Free Lunch', 'Reduced Lunch', 'Paid Lunch', 'Amer Indian/Alaskan Native',
    'Asian', 'Black or African American', 'Hispanic or Latino', 'White',
    'Hawaiian/Pacific Islander', 'Two or More Races', 'Female', 'Male', 'Non-Binary'
]

years = [
    ('2014_15_PK_12_FreeReducedLunchEligibilitybyDistrictandSchool_2.xlsx', '2014_15_sch_membershipbysch_race_ethnicity_gender_grade.xlsx', '2014-15'),
    ('2015_16_PK_12_FreeReducedLunchEligibilitybySchool_1.xlsx', '2015_16_sch_membershipbysch_race_ethnicity_gender_grade_1.xlsx', '2015-16'),
    ('2016-17_PK-12_PupilMembership_bySchool_FRL_0.xlsx', '2016-17_sch_membershipbysch_race_ethnicity_gender_grade.xlsx', '2016-17'),
    ('2017-18_PK12_FRL_bySchool_0.xlsx', '2017-18-Membership-Race-Gender-byGradeSchool.xlsx', '2017-18'),
    ('2018-19_PK12_FRL_bySchool.xlsx', '2018-19-Membership-Race-Gender-byGradeSchool.xlsx', '2018-19'),
]

def sum_cols(df, col1, col2):
    f = df[col1] if col1 in df else 0
    m = df[col2] if col2 in df else 0
    # If f or m is a scalar, just use it; if it's a Series, convert and fillna
    def safe_num(x):
        if hasattr(x, 'fillna'):
            return pd.to_numeric(x, errors='coerce').fillna(0)
        else:
            return pd.to_numeric(x, errors='coerce') if x != '' else 0
    return safe_num(f) + safe_num(m)

def combine_year(frl_file, mem_file, out_csv):
    search_keys = ['school code', 'organization name', 'org. code', 'school name']
    frl_header = detect_header_row(frl_file, search_keys)
    mem_header = detect_header_row(mem_file, search_keys)
    frl = pd.read_excel(frl_file, header=frl_header)
    mem = pd.read_excel(mem_file, header=mem_header)
    # Normalize columns
    frl_cols = {normalize(c): c for c in frl.columns}
    mem_cols = {normalize(c): c for c in mem.columns}
    # Build output
    out_rows = []
    for _, row in mem.iterrows():
        out = {}
        # Direct mappings
        out['Organization Code'] = row.get(mem_cols.get('organizationcode', ''), '')
        out['Organization Name'] = row.get(mem_cols.get('organizationname', ''), '')
        out['School Code'] = row.get(mem_cols.get('schoolcode', ''), '')
        out['School Name'] = row.get(mem_cols.get('schoolname', ''), '')
        out['Lowest Grade Level'] = row.get(mem_cols.get('lowestgradelevel', 'gradelevel'), '')
        out['Highest Grade Level'] = row.get(mem_cols.get('highestgradelevel', ''), '')
        out['Charter Y/N'] = ''
        out['PK-12 Total'] = row.get(mem_cols.get('pk12total', 'pk-12total'), '')
        # Lunch columns from FRL file, matched by School Code
        school_code = out['School Code']
        frl_row = frl[frl[frl_cols.get('schoolcode', 'School Code')]==school_code] if school_code != '' else pd.DataFrame()
        if not frl_row.empty:
            frl_row = frl_row.iloc[0]
            out['Free Lunch'] = frl_row.get(frl_cols.get('freelunch', ''), '')
            out['Reduced Lunch'] = frl_row.get(frl_cols.get('reducedlunch', ''), '')
            out['Paid Lunch'] = frl_row.get(frl_cols.get('paidlunch', ''), '')
        else:
            out['Free Lunch'] = ''
            out['Reduced Lunch'] = ''
            out['Paid Lunch'] = ''
        # Demographic sums
        demo_map = {
            'Amer Indian/Alaskan Native': ('americanindianoralaskannativefemale', 'americanindianoralaskannativemale'),
            'Asian': ('asianfemale', 'asianmale'),
            'Black or African American': ('blackorafricanamericanfemale', 'blackorafricanamericanmale'),
            'Hispanic or Latino': ('hispanicorlatinofemale', 'hispanicorlatinomale'),
            'White': ('whitefemale', 'whitemale'),
            'Hawaiian/Pacific Islander': ('nativehawaiianorotherpacificislanderfemale', 'nativehawaiianorotherpacificislandermale'),
            'Two or More Races': ('twoormoreracesfemale', 'twoormoreracesmale'),
        }
        for demo, (fem, mal) in demo_map.items():
            f_col = mem_cols.get(fem, '')
            m_col = mem_cols.get(mal, '')
            if f_col and m_col:
                out[demo] = sum_cols(row, f_col, m_col)
            else:
                out[demo] = ''
        # Gender totals
        female_sum = 0
        male_sum = 0
        for fem, mal in demo_map.values():
            f_col = mem_cols.get(fem, '')
            m_col = mem_cols.get(mal, '')
            if f_col:
                female_sum += pd.to_numeric(row.get(f_col, 0), errors='coerce')
            if m_col:
                male_sum += pd.to_numeric(row.get(m_col, 0), errors='coerce')
        out['Female'] = female_sum
        out['Male'] = male_sum
        out['Non-Binary'] = ''
        out_rows.append(out)
    pd.DataFrame(out_rows, columns=headers).to_csv(out_csv, index=False)
    print(f"Wrote {out_csv}")

if __name__ == "__main__":
    for frl_file, mem_file, year in years:
        out_csv = f"{year.replace('-', '_')}_combined.csv"
        combine_year(frl_file, mem_file, out_csv)
