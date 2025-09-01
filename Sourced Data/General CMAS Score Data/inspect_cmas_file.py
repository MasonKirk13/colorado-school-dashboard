import pandas as pd

# Path to the Excel file
efile = "2024 CMAS ELA and Math District and School Summary Results.xlsx"

# Try to find the header row and print headers and a sample of data
def find_header_and_preview(filepath):
    # Read the first 40 rows to find the header
    preview = pd.read_excel(filepath, None, nrows=40)
    # If multiple sheets, just use the first one
    if isinstance(preview, dict):
        sheet = list(preview.keys())[0]
        df_preview = pd.read_excel(filepath, sheet_name=sheet, header=None, nrows=40)
    else:
        df_preview = pd.read_excel(filepath, header=None, nrows=40)

    # Try to find the header row: look for a row with mostly non-empty string values and not 'Unnamed'
    header_row = None
    for i, row in df_preview.iterrows():
        str_count = row.apply(lambda x: isinstance(x, str) and x.strip() != "" and not x.startswith("Unnamed"))
        if str_count.sum() > (len(row) // 2):
            header_row = i
            break
    if header_row is None:
        header_row = 0  # fallback

    # Read the file again with the detected header
    df = pd.read_excel(filepath, header=header_row)
    # Filter for Level == 'DISTRICT' and Grade == 'All Grades'
    filtered_df = df[(df['Level'] == 'DISTRICT') & (df['Grade'] == 'All Grades')]
    print(f"Header row detected at: {header_row}")
    print("Headers:", list(filtered_df.columns))
    print("Filtered sample data (Level='DISTRICT' and Grade='All Grades'):")
    print(filtered_df.head(10))

if __name__ == "__main__":
    find_header_and_preview(efile)
