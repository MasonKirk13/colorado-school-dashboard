import pandas as pd
import openpyxl
from openpyxl.utils.dataframe import dataframe_to_rows

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
    ws = wb.create_sheet(title=sheetname)
    ws.append(list(df.columns))
    for row in dataframe_to_rows(df, index=False, header=False):
        ws.append(row)
    print(f'Added sheet: {sheetname} ({len(df)} rows)')

wb.save('2024-25_FRL_Race_Gender_bySchoolandSchoolFlags - Suppressed - with combined years.xlsx')
print('Saved as 2024-25_FRL_Race_Gender_bySchoolandSchoolFlags - Suppressed - with combined years.xlsx')
