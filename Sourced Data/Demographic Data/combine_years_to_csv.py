import os
import pandas as pd
import re

# 2024-25 headers in correct order
headers = [
    'Organization Code', 'Organization Name', 'School Code', 'School Name',
    'Lowest Grade Level', 'Highest Grade Level', 'Charter Y/N', 'PK-12 Total',
    'Free Lunch', 'Reduced Lunch', 'Paid Lunch', 'Amer Indian/Alaskan Native',
    'Asian', 'Black or African American', 'Hispanic or Latino', 'White',
    'Hawaiian/Pacific Islander', 'Two or More Races', 'Female', 'Male', 'Non-Binary'
]

header_map = {
    'organizationcode': ['orgcode', 'organizationcode', 'districtcode'],
    'organizationname': ['organizationname', 'districtname'],
    'schoolcode': ['schoolcode'],
    'schoolname': ['schoolname'],
    'lowestgradelevel': ['lowestgradelevel', 'gradelevel'],
    'highestgradelevel': ['highestgradelevel'],
    'chartery/n': [
        'chartery/n', 'charter', 'charterschool', 'charteryn', 'charter y n', 'charter y/n', 'charter y', 'charter n', 'ischarter', 'charterstatus', 'charter school'
    ],
    'pk-12total': ['pk-12total', 'pk-12count', 'pk-12enrollment', 'pk-12membership', 'pk-12enroll'],
    'freelunch': [
        'freelunch', 'free', 'free lunch', 'free lunch eligible', 'free eligible', 'frl', 'frl eligible', 'frl count', 'freeeligible', 'frl count', 'frl eligible', 'free_lunch', 'free_lunch_eligible', 'free lunch count', 'free_lunch_count', 'free meals', 'free meal', 'free meals eligible', 'free meal eligible', 'free meals count', 'free meal count', 'frl lunch', 'frl_lunch', 'frl lunch eligible', 'frl_lunch_eligible', 'frl lunch count', 'frl_lunch_count', 'frl eligible count', 'frl_eligible_count', 'frl eligible students', 'frl_eligible_students', 'frl students', 'frl_students', 'frl total', 'frl_total', 'frl eligible total', 'frl_eligible_total', 'free/reduced', 'free/reduced lunch', 'free/reducedlunch', 'free/reduced eligible', 'free/reduced_eligible', 'free/reduced count', 'free/reduced_count', 'free/reduced lunch eligible', 'free/reduced_lunch_eligible', 'free/reduced lunch count', 'free/reduced_lunch_count', 'free/reduced eligible count', 'free/reduced_eligible_count', 'free/reduced eligible students', 'free/reduced_eligible_students', 'free/reduced students', 'free/reduced_students', 'free/reduced total', 'free/reduced_total', 'free/reduced eligible total', 'free/reduced_eligible_total'
    ],
    'reducedlunch': [
        'reducedlunch', 'reduced', 'reduced lunch', 'reduced lunch eligible', 'reduced eligible', 'reducedeligible', 'reduced_lunch', 'reduced_lunch_eligible', 'reduced lunch count', 'reduced_lunch_count', 'reduced meals', 'reduced meal', 'reduced meals eligible', 'reduced meal eligible', 'reduced meals count', 'reduced meal count', 'reduced lunch students', 'reduced_lunch_students', 'reduced lunch total', 'reduced_lunch_total', 'reduced price', 'reduced price lunch', 'reducedpricelunch', 'reduced price eligible', 'reduced_price_eligible', 'reduced price count', 'reduced_price_count', 'reduced price lunch eligible', 'reduced_price_lunch_eligible', 'reduced price lunch count', 'reduced_price_lunch_count', 'reduced price eligible count', 'reduced_price_eligible_count', 'reduced price eligible students', 'reduced_price_eligible_students', 'reduced price students', 'reduced_price_students', 'reduced price total', 'reduced_price_total', 'reduced price eligible total', 'reduced_price_eligible_total'
    ],
    'paidlunch': [
        'paidlunch', 'noteligible', 'paid', 'paid lunch', 'paid lunch eligible', 'paid eligible', 'paideligible', 'paid_lunch', 'paid_lunch_eligible', 'paid lunch count', 'paid_lunch_count', 'paid meals', 'paid meal', 'paid meals eligible', 'paid meal eligible', 'paid meals count', 'paid meal count', 'paid lunch students', 'paid_lunch_students', 'paid lunch total', 'paid_lunch_total', 'not eligible', 'noteligible', 'not eligible lunch', 'not_eligible_lunch', 'not eligible count', 'not_eligible_count', 'not eligible lunch count', 'not_eligible_lunch_count', 'not eligible students', 'not_eligible_students', 'not eligible total', 'not_eligible_total', 'not eligible lunch eligible', 'not_eligible_lunch_eligible', 'not eligible lunch total', 'not_eligible_lunch_total', 'full price', 'full price lunch', 'fullpricelunch', 'full price eligible', 'full_price_eligible', 'full price count', 'full_price_count', 'full price lunch eligible', 'full_price_lunch_eligible', 'full price lunch count', 'full_price_lunch_count', 'full price eligible count', 'full_price_eligible_count', 'full price eligible students', 'full_price_eligible_students', 'full price students', 'full_price_students', 'full price total', 'full_price_total', 'full price eligible total', 'full_price_eligible_total'
    ],
    'amerindian/alaskannative': [
        'americanindianoralaskannativefemale', 'americanindianoralaskannativemale', 'amerindian/alaskannative',
        'americanindian', 'alaskannative', 'americanindianalaskannative', 'amindian', 'nativeamerican', 'american indian', 'alaskan native', 'american indian/alaskan native', 'americanindianoralaskannative', 'am. indian', 'amindianalaskannative'
    ],
    'asian': ['asianfemale', 'asianmale', 'asian'],
    'blackorafricanamerican': ['blackorafricanamericanfemale', 'blackorafricanamericanmale', 'blackorafricanamerican'],
    'hispanicorlatino': ['hispanicorlatinofemale', 'hispanicorlatinomale', 'hispanicorlatino'],
    'white': ['whitefemale', 'whitemale', 'white'],
    'hawaiian/pacificislander': [
        'nativehawaiianorotherpacificislanderfemale', 'nativehawaiianorotherpacificislandermale', 'hawaiian/pacificislander',
        'hawaiian', 'pacificislander', 'nativehawaiian', 'hawaiianorpacificislander', 'hawaiian or pacific islander', 'pacific islander', 'hawaiian/pacific', 'hawaiian pacific islander', 'hawaiianorotherpacificislander'
    ],
    'twoormoreraces': ['twoormoreracesfemale', 'twoormoreracesmale', 'twoormoreraces'],
    'female': ['female'],
    'male': ['male'],
    'non-binary': [
        'non-binary', 'nonbinary', 'non binary', 'genderx', 'othergender', 'other gender', 'gender x', 'xgender', 'gender nonconforming', 'gendernonconforming', 'genderqueer', 'gender queer'
    ]
}

years = [
    ('2014_15_PK_12_FreeReducedLunchEligibilitybyDistrictandSchool_2.xlsx', '2014_15_sch_membershipbysch_race_ethnicity_gender_grade.xlsx', '2014-15'),
    ('2015_16_PK_12_FreeReducedLunchEligibilitybySchool_1.xlsx', '2015_16_sch_membershipbysch_race_ethnicity_gender_grade_1.xlsx', '2015-16'),
    ('2016-17_PK-12_PupilMembership_bySchool_FRL_0.xlsx', '2016-17_sch_membershipbysch_race_ethnicity_gender_grade.xlsx', '2016-17'),
    ('2017-18_PK12_FRL_bySchool_0.xlsx', '2017-18-Membership-Race-Gender-byGradeSchool.xlsx', '2017-18'),
    ('2018-19_PK12_FRL_bySchool.xlsx', '2018-19-Membership-Race-Gender-byGradeSchool.xlsx', '2018-19'),
    ('2019-20_PK12_FRL_bySchool2a.xlsx', '2019-20-Membership-Race-Gender-byGradeSchool.xlsx', '2019-20'),
]

def normalize_columns(df):
    # Remove all non-alphanumeric characters and lowercase
    return {re.sub(r'[^a-zA-Z0-9]', '', str(c)).lower(): c for c in df.columns}

def find_best_column(norm_col, col_map):
    if norm_col in col_map:
        return col_map[norm_col]
    for alt in header_map.get(norm_col, []):
        if alt in col_map:
            return col_map[alt]
    # Try variants with/without spaces, parentheses, etc.
    for key in col_map:
        if norm_col in key or key in norm_col:
            return col_map[key]
    return None

def sum_gender_columns(df, female_col, male_col):
    f = df[female_col] if female_col in df else 0
    m = df[male_col] if male_col in df else 0
    return pd.to_numeric(f, errors='coerce').fillna(0) + pd.to_numeric(m, errors='coerce').fillna(0)


def detect_header_row(excel_file, search_keys):
    import openpyxl
    wb = openpyxl.load_workbook(excel_file, read_only=True, data_only=True)
    ws = wb.active
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        row_strs = [str(cell).strip().lower() if cell is not None else '' for cell in row]
        if any(any(key in cell for cell in row_strs) for key in search_keys):
            return i
    return 0

def combine_year(frl_file, mem_file, out_csv, skip=False):
    # Utility to pad codes for diagnostics
    def pad_code(val, length):
        val = str(val).strip()
        if val == '' or val.lower() == 'nan':
            return ''
        try:
            return val.zfill(length)
        except:
            return val
    # ...existing code...
    if skip:
        print(f"Skipping {out_csv} due to special format.")
        return

    if skip:
        print(f"Skipping {out_csv} due to special format.")
        return
    if not os.path.exists(frl_file) or not os.path.exists(mem_file):
        print(f"Missing file for {out_csv}")
        return

    # Detect header row for each file
    search_keys = ['school code', 'organization name', 'org. code', 'school name']
    frl_header = detect_header_row(frl_file, search_keys)
    mem_header = detect_header_row(mem_file, search_keys)
    frl = pd.read_excel(frl_file, header=frl_header)
    mem = pd.read_excel(mem_file, header=mem_header)

    # Strip whitespace from all column names in both DataFrames
    mem.columns = [c.strip() for c in mem.columns]
    frl.columns = [c.strip() for c in frl.columns]

    # Forcefully rename any column matching 'Organization Code' (case-insensitive, ignoring whitespace) to 'Org. Code'
    for col in list(mem.columns):
        if col.replace(' ', '').lower() == 'organizationcode':
            mem.rename(columns={col: 'Org. Code'}, inplace=True)

    # Forcibly rename best-matching org/school code columns to 'Org. Code' and 'School Code' if they exist (before deduplication)
    mem_map = normalize_columns(mem)
    org_code_mem = find_best_column('orgcode', mem_map) or find_best_column('districtcode', mem_map)
    school_code_mem = find_best_column('schoolcode', mem_map)
    if org_code_mem and org_code_mem != 'Org. Code':
        mem.rename(columns={org_code_mem: 'Org. Code'}, inplace=True)
    if school_code_mem and school_code_mem != 'School Code':
        mem.rename(columns={school_code_mem: 'School Code'}, inplace=True)
    # Fallback: If 'Org. Code' is still missing in mem, but 'Organization Code' exists, rename it
    for col in list(mem.columns):
        if col.replace(' ', '').lower() == 'organizationcode':
            mem.rename(columns={col: 'Org. Code'}, inplace=True)
    if 'School Code' not in mem.columns and 'SchoolCode' in mem.columns:
        mem.rename(columns={'SchoolCode': 'School Code'}, inplace=True)
    frl_map = normalize_columns(frl)
    org_code_frl = find_best_column('orgcode', frl_map) or find_best_column('districtcode', frl_map)
    school_code_frl = find_best_column('schoolcode', frl_map)
    if org_code_frl and org_code_frl != 'Org. Code':
        frl.rename(columns={org_code_frl: 'Org. Code'}, inplace=True)
    if school_code_frl and school_code_frl != 'School Code':
        frl.rename(columns={school_code_frl: 'School Code'}, inplace=True)

    # Forcibly deduplicate columns by name after renaming
    mem = mem.loc[:, ~mem.columns.duplicated()]
    frl = frl.loc[:, ~frl.columns.duplicated()]

    # Print final column names and counts for both keys
    print("mem columns after all renaming/dedup:", repr(list(mem.columns)))
    print("mem 'Org. Code' count after dedup:", list(mem.columns).count('Org. Code'))
    print("mem 'School Code' count after dedup:", list(mem.columns).count('School Code'))
    print("frl columns after all renaming/dedup:", repr(list(frl.columns)))
    print("frl 'Org. Code' count after dedup:", list(frl.columns).count('Org. Code'))
    print("frl 'School Code' count after dedup:", list(frl.columns).count('School Code'))


    # ...existing code continues, using only these processed mem and frl DataFrames...
    # Diagnostic: print columns before merging
    print('Columns in mem before merge:', list(mem.columns))
    print('Columns in frl before merge:', list(frl.columns))
    # --- Single diagnostic print for 2014-15, after DataFrames are loaded ---
    if '2014_15_PK_12_FreeReducedLunchEligibilitybyDistrictandSchool_2.xlsx' in frl_file:
        print('--- 2014-15 FRL file columns (normalized: original) ---')
        for k, v in frl_map.items():
            print(f'{k}: {v}')
        def pad_code(val, length):
            val = str(val).strip()
            if val == '' or val.lower() == 'nan':
                return ''
            try:
                return val.zfill(length)
            except:
                return val
        print('--- First 10 (Org. Code, School Code) pairs in FRL file ---')
        for i, row in frl.head(10).iterrows():
            org = pad_code(row.get('Org. Code', row.get('DISTRICT CODE', row.get('DISTRICTCODE', ''))), 2)
            sch = pad_code(row.get('School Code', row.get('SCHOOL CODE', row.get('SCHOOLCODE', ''))), 4)
            print(f'FRL: ({org}, {sch})')
        print('--- First 10 (Org. Code, School Code) pairs in membership data ---')
        for i, row in mem.head(10).iterrows():
            org = pad_code(row.get('Org. Code', row.get('DISTRICT CODE', row.get('DISTRICTCODE', ''))), 2)
            sch = pad_code(row.get('School Code', row.get('SCHOOL CODE', row.get('SCHOOLCODE', ''))), 4)
            print(f'MEM: ({org}, {sch})')

    # --- Filter membership data to only school total rows if present ---
    grade_col = find_best_column('gradelevel', mem_map)
    used_school_total_only = False
    if grade_col:
        # Acceptable values for school total (case-insensitive, ignore spaces)
        school_total_vals = ['schooltotal', 'school total', 'sch total', 'total', 'totals']
        mem_school_total = mem[mem[grade_col].astype(str).str.replace(r'\s+', '', regex=True).str.lower().isin([v.replace(' ', '').lower() for v in school_total_vals])]
        if not mem_school_total.empty:
            mem = mem_school_total.copy()
            used_school_total_only = True

    # --- Consistently extract and pad Org. Code and School Code in both DataFrames ---
    def clean_school_code(val):
        # Remove decimals, pad to 4 digits
        if pd.isnull(val):
            return ''
        val = str(val).strip()
        if '.' in val:
            val = val.split('.')[0]

    # All loading, renaming, deduplication, and diagnostics are done above. Do not reload or reprocess mem/frl below this point.
    # Remove duplicate columns (keep first occurrence) to ensure no duplicate column names before merging
    mem = mem.loc[:, ~mem.columns.duplicated()]
    frl = frl.loc[:, ~frl.columns.duplicated()]

    # --- Compute lowest/highest grade per school ---
    # Try to find grade level column (already found above)
    school_code_col = find_best_column('schoolcode', mem_map)
    org_code_col = find_best_column('orgcode', mem_map) or find_best_column('districtcode', mem_map)
    group_cols = None
    grade_levels = None
    if grade_col and school_code_col:
        grade_summary = mem[[school_code_col, grade_col]].copy()
        if org_code_col:
            grade_summary[org_code_col] = mem[org_code_col]
        # Clean up grade values (e.g., PK, K, 1, 2, ...)
        def grade_sort_val(g):
            g = str(g).strip().upper()
            if g in ['PK', 'PREK', 'PRE-K', 'PREKINDERGARTEN']:
                return -2
            if g in ['K', 'KG', 'KINDERGARTEN']:
                return -1
            try:
                return int(g)
            except:
                return 99
        grade_summary['grade_sort'] = grade_summary[grade_col].map(grade_sort_val)
        # Group by school (and org if available)
        group_cols = [school_code_col]
        if org_code_col:
            group_cols = [org_code_col, school_code_col]
        # Find min/max grade_sort per group
        min_sort = grade_summary.groupby(group_cols)['grade_sort'].min().reset_index().rename(columns={'grade_sort': 'min_sort'})
        max_sort = grade_summary.groupby(group_cols)['grade_sort'].max().reset_index().rename(columns={'grade_sort': 'max_sort'})
        # Merge back to get the original grade label for min/max
        min_grades = pd.merge(grade_summary, min_sort, left_on=group_cols + ['grade_sort'], right_on=group_cols + ['min_sort'], how='inner')
        max_grades = pd.merge(grade_summary, max_sort, left_on=group_cols + ['grade_sort'], right_on=group_cols + ['max_sort'], how='inner')
        min_grades = min_grades[group_cols + [grade_col]].drop_duplicates().rename(columns={grade_col: 'Lowest Grade Level'})
        max_grades = max_grades[group_cols + [grade_col]].drop_duplicates().rename(columns={grade_col: 'Highest Grade Level'})
        # Merge min/max
        grade_levels = pd.merge(min_grades, max_grades, on=group_cols)
        for i, row in frl.head(10).iterrows():
            org = pad_code(row.get('Org. Code', row.get('DISTRICT CODE', row.get('DISTRICTCODE', ''))), 2)
            sch = pad_code(row.get('School Code', row.get('SCHOOL CODE', row.get('SCHOOLCODE', ''))), 4)
            print(f'FRL: ({org}, {sch})')
        print('--- First 10 (Org. Code, School Code) pairs in membership data ---')
        for i, row in mem.head(10).iterrows():
            org = pad_code(row.get('Org. Code', row.get('DISTRICT CODE', row.get('DISTRICTCODE', ''))), 2)
            sch = pad_code(row.get('School Code', row.get('SCHOOL CODE', row.get('SCHOOLCODE', ''))), 4)
            print(f'MEM: ({org}, {sch})')
        mem = mem.rename(columns={org_code_mem: 'Org. Code'})
    if school_code_frl and school_code_mem:
        frl = frl.rename(columns={school_code_frl: 'School Code'})
        mem = mem.rename(columns={school_code_mem: 'School Code'})
    for k in ['Org. Code', 'School Code']:
        if k in frl.columns:
            frl[k] = frl[k].astype(str)
        if k in mem.columns:
            mem[k] = mem[k].astype(str)
    if 'Org. Code' in frl.columns and 'Org. Code' in mem.columns and 'School Code' in frl.columns and 'School Code' in mem.columns:
        merged = pd.merge(mem, frl, on=['Org. Code', 'School Code'], how='outer', suffixes=('_mem', '_frl'))
    else:
        merged = mem.copy()

    # If grade_levels exists, merge it in so each school has lowest/highest grade
    if grade_levels is not None:
        # Determine which columns are present in both merged and grade_levels for merge
        left_keys = []
        right_keys = []
        for col in group_cols:
            # Try to match by normalized name
            norm_col = re.sub(r'[^a-zA-Z0-9]', '', col).lower()
            merged_cols_norm = {re.sub(r'[^a-zA-Z0-9]', '', c).lower(): c for c in merged.columns}
            grade_cols_norm = {re.sub(r'[^a-zA-Z0-9]', '', c).lower(): c for c in grade_levels.columns}
            if norm_col in merged_cols_norm and norm_col in grade_cols_norm:
                left_keys.append(merged_cols_norm[norm_col])
                right_keys.append(grade_cols_norm[norm_col])
        # Ensure all merge keys are string type
        for lk in left_keys:
            merged[lk] = merged[lk].astype(str)
        for rk in right_keys:
            grade_levels[rk] = grade_levels[rk].astype(str)
        if left_keys and right_keys and len(left_keys) == len(right_keys):
            merged = pd.merge(merged, grade_levels, left_on=left_keys, right_on=right_keys, how='left')

    # Build output DataFrame
    out = pd.DataFrame()
    merged_map = normalize_columns(merged)
    frl_map = normalize_columns(frl)
    mem_map = normalize_columns(mem)
    demo_groups = [
        ('amerindian/alaskannative', 'americanindianoralaskannativefemale', 'americanindianoralaskannativemale'),
        ('asian', 'asianfemale', 'asianmale'),
        ('blackorafricanamerican', 'blackorafricanamericanfemale', 'blackorafricanamericanmale'),
        ('hispanicorlatino', 'hispanicorlatinofemale', 'hispanicorlatinomale'),
        ('white', 'whitefemale', 'whitemale'),
        ('hawaiian/pacificislander', 'nativehawaiianorotherpacificislanderfemale', 'nativehawaiianorotherpacificislandermale'),
        ('twoormoreraces', 'twoormoreracesfemale', 'twoormoreracesmale')
    ]

    if used_school_total_only:
        # Merge filtered mem (school total) with FRL data on cleaned Org. Code and School Code
        merged_totals = pd.merge(
            mem,
            frl,
            on=['Org. Code', 'School Code'],
            how='left',
            suffixes=('_mem', '_frl')
        )
        merged_totals_map = normalize_columns(merged_totals)
        out = pd.DataFrame()
        for col in headers:
            norm_col = re.sub(r'[^a-zA-Z0-9]', '', col).lower()
            # Special handling for grade columns
            if norm_col in ['lowestgradelevel', 'highestgradelevel']:
                out[col] = [''] * len(merged_totals)
                continue
            # For male/female/demographics, always use membership (school total) value if present, fallback to FRL
            demo_keys = ['female', 'male', 'non-binary', 'amerindian/alaskannative', 'asian', 'blackorafricanamerican', 'hispanicorlatino', 'white', 'hawaiian/pacificislander', 'twoormoreraces']
            if norm_col in demo_keys:
                best_col = find_best_column(norm_col, mem_map)
                if best_col and best_col in merged_totals.columns:
                    vals = merged_totals[best_col].replace({'Sch Total': '', 'sch total': '', 'School Total': '', 'school total': ''})
                    out[col] = vals.values
                else:
                    best_col = find_best_column(norm_col, frl_map)
                    if best_col and best_col in merged_totals.columns:
                        vals = merged_totals[best_col].replace({'Sch Total': '', 'sch total': '', 'School Total': '', 'school total': ''})
                        out[col] = vals.values
                    else:
                        out[col] = [''] * len(merged_totals)
                continue
            # For lunch columns, align FRL lunch data to merged membership rows by Org. Code and School Code
            if norm_col in ['freelunch', 'reducedlunch', 'paidlunch']:
                # Determine which FRL column to use
                if norm_col == 'freelunch':
                    colname = frl_map.get('freelunch')
                elif norm_col == 'reducedlunch':
                    colname = frl_map.get('reducedlunch')
                else:  # paidlunch
                    colname = frl_map.get('noteligible') or frl_map.get('paidlunch')
                if colname and colname in frl.columns:
                    # Build a lookup from (Org. Code, School Code) to lunch value
                    frl_lookup = dict(zip(zip(frl['Org. Code'], frl['School Code']), frl[colname]))
                    # For each row in merged_totals, get the lunch value by Org. Code and School Code
                    vals = [frl_lookup.get((row['Org. Code'], row['School Code']), '') for _, row in merged_totals.iterrows()]
                    out[col] = vals
                else:
                    out[col] = [''] * len(merged_totals)
                continue
            # For school name and charter, prefer membership, fallback to FRL
            if norm_col in ['schoolname', 'chartery/n', 'organizationname']:
                best_col = find_best_column(norm_col, mem_map)
                if best_col and best_col in merged_totals.columns:
                    vals = merged_totals[best_col].replace({'Sch Total': '', 'sch total': '', 'School Total': '', 'school total': ''})
                    out[col] = vals.values
                else:
                    best_col = find_best_column(norm_col, frl_map)
                    if best_col and best_col in merged_totals.columns:
                        vals = merged_totals[best_col].replace({'Sch Total': '', 'sch total': '', 'School Total': '', 'school total': ''})
                        out[col] = vals.values
                    else:
                        out[col] = [''] * len(merged_totals)
                continue
            # For all other columns, use merged_totals
            best_col = find_best_column(norm_col, merged_totals_map)
            if best_col:
                vals = merged_totals[best_col].replace({'Sch Total': '', 'sch total': '', 'School Total': '', 'school total': ''})
                out[col] = vals.values
            else:
                out[col] = [''] * len(merged_totals)
        out.to_csv(out_csv, index=False)
        print(f"Wrote {out_csv}")
        return

    # ...existing code for normal (not school total only) case...
    for col in headers:
        norm_col = re.sub(r'[^a-zA-Z0-9]', '', col).lower()
        group = next((g for g in demo_groups if g[0] == norm_col), None)
        if group:
            # Always sum demographic columns from the membership file
            f_col = find_best_column(group[1], mem_map)
            m_col = find_best_column(group[2], mem_map)
            if not f_col or not m_col:
                print(f"[WARN] Could not find columns for {col}: female_col={f_col}, male_col={m_col}")
            if f_col and m_col:
                out[col] = sum_gender_columns(mem, f_col, m_col)
            elif f_col:
                out[col] = pd.to_numeric(mem[f_col], errors='coerce').fillna(0)
            elif m_col:
                out[col] = pd.to_numeric(mem[m_col], errors='coerce').fillna(0)
            else:
                out[col] = ''
        elif norm_col == 'lowestgradelevel':
            if 'Lowest Grade Level' in merged.columns:
                out[col] = merged['Lowest Grade Level']
            else:
                out[col] = ''
        elif norm_col == 'highestgradelevel':
            if 'Highest Grade Level' in merged.columns:
                out[col] = merged['Highest Grade Level']
            else:
                out[col] = ''
        elif norm_col == 'female':
            f_cols = [find_best_column(g[1], merged_map) for g in demo_groups if find_best_column(g[1], merged_map)]
            if 'female' in merged_map:
                out[col] = merged[merged_map['female']]
            elif f_cols:
                out[col] = merged[f_cols].apply(pd.to_numeric, errors='coerce').fillna(0).sum(axis=1)
            else:
                print(f"[WARN] Could not find columns for Female sum: {f_cols}")
                out[col] = ''
        elif norm_col == 'male':
            m_cols = [find_best_column(g[2], merged_map) for g in demo_groups if find_best_column(g[2], merged_map)]
            if 'male' in merged_map:
                out[col] = merged[merged_map['male']]
            elif m_cols:
                out[col] = merged[m_cols].apply(pd.to_numeric, errors='coerce').fillna(0).sum(axis=1)
            else:
                print(f"[WARN] Could not find columns for Male sum: {m_cols}")
                out[col] = ''
        else:
            best_col = find_best_column(norm_col, merged_map)
            if best_col:
                out[col] = merged[best_col]
            else:
                best_col = find_best_column(norm_col, mem_map)
                if best_col:
                    out[col] = mem[best_col]
                else:
                    best_col = find_best_column(norm_col, frl_map)
                    if best_col:
                        out[col] = frl[best_col]
                    else:
                        print(f"[WARN] Could not find column for {col}, filling with empty string.")
                        out[col] = ''
    out.to_csv(out_csv, index=False)
    print(f"Wrote {out_csv}")

if __name__ == "__main__":
    for frl_file, mem_file, year in years:
        skip = True if '2019-20' in year else False
        out_csv = f"{year.replace('-', '_')}_combined.csv"
        combine_year(frl_file, mem_file, out_csv, skip=skip)
