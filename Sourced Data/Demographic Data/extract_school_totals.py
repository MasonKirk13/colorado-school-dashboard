import pandas as pd

# Load the membership file with the correct header row
file = '2014_15_sch_membershipbysch_race_ethnicity_gender_grade.xlsx'
df = pd.read_excel(file, header=2)

# Filter for school total rows
school_totals = df[df['Grade Level'].astype(str).str.strip().str.lower() == 'sch total']

# Save to CSV
school_totals.to_csv('2014_15_membership_schooltotals.csv', index=False)
print('Extracted school total rows:', school_totals.shape)
print('Saved as 2014_15_membership_schooltotals.csv')
