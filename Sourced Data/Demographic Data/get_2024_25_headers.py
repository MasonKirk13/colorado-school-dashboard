import openpyxl

wb = openpyxl.load_workbook('2024-25_FRL_Race_Gender_bySchoolandSchoolFlags - Suppressed.xlsx', read_only=True, data_only=True)
ws = wb['2024-2025 Data']
# Find the header row (should be row 3, 0-based index 2)
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 2:
        print('2024-25 column headers:')
        print([str(cell) for cell in row])
        break
