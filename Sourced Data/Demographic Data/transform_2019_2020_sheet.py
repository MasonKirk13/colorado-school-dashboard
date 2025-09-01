import openpyxl
import pandas as pd
import numpy as np

# Open the workbook and get the 2019-2020 Data sheet
wb = openpyxl.load_workbook('2024-25_FRL_Race_Gender_bySchoolandSchoolFlags - FINAL2.xlsx')
ws = wb['2019-2020 Data']

# Read data into DataFrame
rows = list(ws.values)
columns = [str(c) for c in rows[0]]
df = pd.DataFrame(rows[1:], columns=columns)

# Mapping and demographic aggregation
out = pd.DataFrame()
out['Organization Code'] = df['district code']
out['Organization Name'] = df['district name']
out['School Code'] = df['school code']
out['School Name'] = df['school name']
out['Lowest Grade Level'] = df['lowest grade']
out['Highest Grade Level'] = df['highest grade']
out['Charter Y/N'] = 'N/A'
out['PK-12 Total'] = df['pk-12 total']
out['Free Lunch'] = df['free lunch']
out['Reduced Lunch'] = df['reduced lunch']
out['Paid Lunch'] = df['not eligible']
# Demographic sums
out['Amer Indian/Alaskan Native'] = df['american indian or alaskan native female'].fillna(0) + df['american indian or alaskan native male'].fillna(0)
out['Asian'] = df['asian female'].fillna(0) + df['asian male'].fillna(0)
out['Black or African American'] = df['black or african american female'].fillna(0) + df['black or african american male'].fillna(0)
out['Hispanic or Latino'] = df['hispanic or latino female'].fillna(0) + df['hispanic or latino male'].fillna(0)
out['White'] = df['white female'].fillna(0) + df['white male'].fillna(0)
out['Hawaiian/Pacific Islander'] = df['native hawaiian or other pacific islander female'].fillna(0) + df['native hawaiian or other pacific islander male'].fillna(0)
out['Two or More Races'] = df['two or more races female'].fillna(0) + df['two or more races male'].fillna(0)
out['Female'] = (
    df['american indian or alaskan native female'].fillna(0) +
    df['asian female'].fillna(0) +
    df['black or african american female'].fillna(0) +
    df['hispanic or latino female'].fillna(0) +
    df['white female'].fillna(0) +
    df['native hawaiian or other pacific islander female'].fillna(0) +
    df['two or more races female'].fillna(0)
)
out['Male'] = (
    df['american indian or alaskan native male'].fillna(0) +
    df['asian male'].fillna(0) +
    df['black or african american male'].fillna(0) +
    df['hispanic or latino male'].fillna(0) +
    df['white male'].fillna(0) +
    df['native hawaiian or other pacific islander male'].fillna(0) +
    df['two or more races male'].fillna(0)
)
out['Non-Binary'] = 0

# Show first 5 rows
print(out.head())
# Show columns
print('\nColumns:', list(out.columns))
# Show shape
print(f'\nRows: {out.shape[0]}, Columns: {out.shape[1]}')
