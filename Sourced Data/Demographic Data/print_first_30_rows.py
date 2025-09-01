import openpyxl

wb = openpyxl.load_workbook('2014_15_sch_membershipbysch_race_ethnicity_gender_grade.xlsx', read_only=True, data_only=True)
ws = wb.active
for i, row in enumerate(ws.iter_rows(values_only=True)):
    print(f'Row {i}:', row)
    if i >= 29:
        break
