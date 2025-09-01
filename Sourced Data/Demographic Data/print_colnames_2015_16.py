import pandas as pd
import openpyxl
# Dynamically find header row
wb = openpyxl.load_workbook('2015_16_sch_membershipbysch_race_ethnicity_gender_grade_1.xlsx', read_only=True, data_only=True)
ws = wb.active
header_row = None
for i, row in enumerate(ws.iter_rows(values_only=True)):
    row_strs = [str(cell).strip().lower() if cell is not None else '' for cell in row]
    if any('school' in cell or 'grade' in cell or 'code' in cell for cell in row_strs):
        header_row = i
        print(f'Header row: {i}, {row}')
        break
if header_row is not None:
    df = pd.read_excel('2015_16_sch_membershipbysch_race_ethnicity_gender_grade_1.xlsx', header=header_row)
    print([repr(c) for c in df.columns])
else:
    print('No header row found')
