import pandas as pd

# Load the original membership file with the correct header row
file = '2014_15_sch_membershipbysch_race_ethnicity_gender_grade.xlsx'
df = pd.read_excel(file, header=2)

# Exclude 'Sch Total' rows to find grade levels
not_total = df[df['Grade Level'].astype(str).str.strip().str.lower() != 'sch total']

# Function to extract numeric grade from 'Grade Level' string
import re
def extract_grade(grade_str):
    if pd.isnull(grade_str):
        return None
    s = str(grade_str).strip().lower()
    # Handle PK, K, and numeric grades
    if 'pk' in s:
        return 'PK'
    if 'k' in s and not s.startswith('1'):
        return 'K'
    m = re.match(r'(\d+)', s)
    if m:
        return int(m.group(1))
    return None

# Group by Org and School, get all grades for each
grade_map = not_total.groupby(['Organization Code', 'School Code'])['Grade Level'].apply(list)

# For each school, find lowest and highest grade
school_grades = {}
for key, grades in grade_map.items():
    extracted = [extract_grade(g) for g in grades if extract_grade(g) is not None]
    # Sort PK < K < numbers
    def grade_sort_key(g):
        if g == 'PK': return -2
        if g == 'K': return -1
        return g
    if extracted:
        sorted_grades = sorted(extracted, key=grade_sort_key)
        school_grades[key] = (sorted_grades[0], sorted_grades[-1])
    else:
        school_grades[key] = (None, None)

# Load the school total rows
school_totals = pd.read_csv('2014_15_membership_schooltotals.csv')

# Add lowest/highest grade columns
lowest = []
highest = []
for _, row in school_totals.iterrows():
    key = (row['Organization Code'], row['School Code'])
    lo, hi = school_grades.get(key, (None, None))
    lowest.append(lo)
    highest.append(hi)
school_totals['Lowest Grade'] = lowest
school_totals['Highest Grade'] = highest

# Save to new CSV
school_totals.to_csv('2014_15_membership_schooltotals_with_grades.csv', index=False)
print('Appended lowest/highest grade columns. Saved as 2014_15_membership_schooltotals_with_grades.csv')
