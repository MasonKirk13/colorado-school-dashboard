import pandas as pd

# Load membership school totals with grades
membership = pd.read_csv('2014_15_membership_schooltotals_with_grades.csv')
lunch = pd.read_excel('2014_15_PK_12_FreeReducedLunchEligibilitybyDistrictandSchool_2.xlsx', header=2)


# Normalize all column names to lowercase and strip spaces
membership.columns = [c.strip().lower() for c in membership.columns]
lunch.columns = [c.strip().lower() for c in lunch.columns]

# Rename organization code/name to district code/name for merge
membership = membership.rename(columns={
    'organization code': 'district code',
    'organization name': 'district name'
})


# Ensure merge keys are all string type and zero-padded for codes
merge_keys = ['district code', 'district name', 'school code']

# Zero-pad codes to 4 digits and strip names
def pad_code(val):
    try:
        return f"{int(float(val)):04d}"
    except:
        return str(val).zfill(4)

for df in [membership, lunch]:
    df['district code'] = df['district code'].apply(pad_code)
    df['school code'] = df['school code'].apply(pad_code)
    df['district name'] = df['district name'].astype(str).str.strip().str.upper()

# Merge on district code, district name, school code
merged = pd.merge(
    membership,
    lunch,
    on=merge_keys,
    how='left',
    suffixes=('', '_lunch')
)

# Remove duplicate columns from lunch file
cols_to_drop = [
    'county code',
    'county name',
    'school name_lunch',
    'pk-12 count',
]
for col in cols_to_drop:
    if col in merged.columns:
        merged = merged.drop(columns=col)

# Save result
merged.to_csv('2014_15_membership_schooltotals_with_grades_and_lunch.csv', index=False)
print('Merged lunch data and removed duplicate columns. Saved as 2014_15_membership_schooltotals_with_grades_and_lunch.csv')
