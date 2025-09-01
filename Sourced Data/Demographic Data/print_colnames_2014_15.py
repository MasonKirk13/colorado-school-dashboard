import pandas as pd
# Load with header row 2 (third row)
df = pd.read_excel('2014_15_sch_membershipbysch_race_ethnicity_gender_grade.xlsx', header=2)
print([repr(c) for c in df.columns])
