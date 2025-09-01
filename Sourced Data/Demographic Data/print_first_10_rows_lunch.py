import openpyxl

wb = openpyxl.load_workbook('2014_15_PK_12_FreeReducedLunchEligibilitybyDistrictandSchool_2.xlsx', read_only=True, data_only=True)
ws = wb.active
for i, row in enumerate(ws.iter_rows(values_only=True)):
    print(f'Row {i}:', row)
    if i >= 9:
        break
