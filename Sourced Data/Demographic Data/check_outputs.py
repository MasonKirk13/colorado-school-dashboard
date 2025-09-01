import pandas as pd
import os

years = [
    '2014_15', '2015_16', '2016_17', '2017_18', '2018_19', '2019_20'
]

for year in years:
    fname = f'{year}_membership_schooltotals_with_grades_and_lunch.csv'
    if not os.path.exists(fname):
        print(f'{fname}: NOT FOUND')
        continue
    df = pd.read_csv(fname)
    print(f'\n--- {fname} ---')
    print(f'Rows: {len(df)}, Columns: {len(df.columns)}')
    print('Columns:', list(df.columns))
    print('First 3 rows:')
    print(df.head(3))
    # Checks
    if year in ['2016_17', '2017_18', '2018_19', '2019_20']:
        if any('grade' in c.lower() for c in df.columns):
            print('ERROR: Grade column still present!')
        if df.duplicated(['district code', 'school code']).any():
            print('ERROR: Duplicate school rows found!')
    if year in ['2014_15', '2015_16']:
        if any('grade' in c.lower() for c in df.columns):
            print('ERROR: Grade column still present!')
        if df.duplicated(['district code', 'school code']).any():
            print('ERROR: Duplicate school rows found!')
    print('-----------------------------')
