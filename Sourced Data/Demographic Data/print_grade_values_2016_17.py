import pandas as pd
import openpyxl
# Dynamically find header row
wb = openpyxl.load_workbook('2016-17_sch_membershipbysch_race_ethnicity_gender_grade.xlsx', read_only=True, data_only=True)
ws = wb.active
header_row = None
for i, row in enumerate(ws.iter_rows(values_only=True)):
    row_strs = [str(cell).strip().lower() if cell is not None else '' for cell in row]
    if sum('code' in cell or 'school' in cell or 'grade' in cell for cell in row_strs) >= 3:
        header_row = i
        break
    if any('code' in cell or 'school' in cell or 'grade' in cell for cell in row_strs):
        header_row = i + 1
        break
if header_row is not None:
    df = pd.read_excel('2016-17_sch_membershipbysch_race_ethnicity_gender_grade.xlsx', header=header_row)
    # Find grade level column
    grade_col = [c for c in df.columns if 'grade' in c.lower()][0]
    print('Unique values in grade column:', df[grade_col].unique())
else:
    print('No header row found')
