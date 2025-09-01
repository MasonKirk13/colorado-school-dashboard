import pandas as pd
# Load with header row 2 (third row, adjust if needed)
df = pd.read_excel('2019-20-Membership-Race-Gender-byGradeSchool.xlsx', header=2)
print([repr(c) for c in df.columns])
