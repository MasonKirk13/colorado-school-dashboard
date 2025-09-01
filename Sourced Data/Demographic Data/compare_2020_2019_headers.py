import openpyxl

def get_headers(sheet):
    ws = wb[sheet]
    for row in ws.iter_rows(min_row=1, max_row=1, values_only=True):
        return [str(c) for c in row]

wb = openpyxl.load_workbook('2024-25_FRL_Race_Gender_bySchoolandSchoolFlags - FINAL2.xlsx', read_only=True)
headers_2020 = get_headers('2020-2021 Data')
headers_2019 = get_headers('2019-2020 Data')

# Normalize for comparison
norm = lambda x: x.strip().lower().replace(' ', '').replace('-', '').replace('_', '')
set_2020 = set(norm(h) for h in headers_2020)
set_2019 = set(norm(h) for h in headers_2019)

same = [h for h in headers_2020 if norm(h) in set_2019]
print('Headers in both 2020-2021 and 2019-2020:')
print(same)
print('\nHeaders only in 2020-2021:')
print([h for h in headers_2020 if norm(h) not in set_2019])
print('\nHeaders only in 2019-2020:')
print([h for h in headers_2019 if norm(h) not in set_2020])
