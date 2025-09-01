import pandas as pd
import openpyxl
from openpyxl.utils.dataframe import dataframe_to_rows
import numpy as np
import re

# 2024-25 column headers (in order)
headers = [
    'Organization Code', 'Organization Name', 'School Code', 'School Name',
    'Lowest Grade Level', 'Highest Grade Level', 'Charter Y/N', 'PK-12 Total',
    'Free Lunch', 'Reduced Lunch', 'Paid Lunch', 'Amer Indian/Alaskan Native',
    'Asian', 'Black or African American', 'Hispanic or Latino', 'White',
    'Hawaiian/Pacific Islander', 'Two or More Races', 'Female', 'Male', 'Non-Binary'
]

# Map from possible column names in combined files to 2024-25 headers
col_map = {
    'organization code': 'Organization Code',
    'district code': 'Organization Code',
    'organization name': 'Organization Name',
    'district name': 'Organization Name',
    'school code': 'School Code',
    'school name': 'School Name',
    'lowest grade': 'Lowest Grade Level',
    'lowest grade level': 'Lowest Grade Level',
    'highest grade': 'Highest Grade Level',
    'highest grade level': 'Highest Grade Level',
    'charter y/n': 'Charter Y/N',
    'pk-12 total': 'PK-12 Total',
    'free lunch': 'Free Lunch',
    'reduced lunch': 'Reduced Lunch',
    'paid lunch': 'Paid Lunch',
    'amer indian/alaskan native': 'Amer Indian/Alaskan Native',
    'american indian or alaskan native': 'Amer Indian/Alaskan Native',
    'asian': 'Asian',
    'black or african american': 'Black or African American',
    'hispanic or latino': 'Hispanic or Latino',
    'white': 'White',
    'hawaiian/pacific islander': 'Hawaiian/Pacific Islander',
    'native hawaiian or other pacific islander': 'Hawaiian/Pacific Islander',
    'two or more races': 'Two or More Races',
    'female': 'Female',
    'male': 'Male',
    'non-binary': 'Non-Binary',
}

# Years and filenames in descending order
years = [
    ('2019_20', '2019-2020 Data'),
    ('2018_19', '2018-2019 Data'),
    ('2017_18', '2017-2018 Data'),
    ('2016_17', '2016-2017 Data'),
    ('2015_16', '2015-2016 Data'),
    ('2014_15', '2014-2015 Data'),
]

wb = openpyxl.load_workbook('2024-25_FRL_Race_Gender_bySchoolandSchoolFlags - Suppressed.xlsx')

for csv, sheetname in years:
    fname = f'{csv}_membership_schooltotals_with_grades_and_lunch.csv'
    try:
        df = pd.read_csv(fname)
    except Exception as e:
        print(f'Skipping {fname}: {e}')
        continue
    # Normalize columns
    df_cols = {c.lower().strip(): c for c in df.columns}
    newcols = {}
    for k, v in col_map.items():
        if k in df_cols:
            newcols[df_cols[k]] = v
    df = df.rename(columns=newcols)
    # Only keep columns in headers, in order
    out = pd.DataFrame()
    for h in headers:
        if h in df.columns:
            out[h] = df[h]
        else:
            out[h] = np.nan
    # Add as new sheet
    ws = wb.create_sheet(title=sheetname)
    ws.append(headers)
    for row in dataframe_to_rows(out, index=False, header=False):
        ws.append(row)
    print(f'Added sheet: {sheetname} ({len(out)} rows)')

wb.save('2024-25_FRL_Race_Gender_bySchoolandSchoolFlags - Suppressed - with history.xlsx')
print('Saved as 2024-25_FRL_Race_Gender_bySchoolandSchoolFlags - Suppressed - with history.xlsx')
