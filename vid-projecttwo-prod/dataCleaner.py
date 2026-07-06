import os
import pandas as pd

# Folder containing all yearly CSVs
FOLDER_PATH = "/Users/abhilashkaluwala/Desktop/VID/project_2/vid-projecttwo/data"  # Use "." if script is in same folder

# Output file
OUTPUT_FILE = "merged_earthquakes_2004_2025.csv"

# Required columns
COLUMNS_NEEDED = ['time', 'latitude', 'longitude', 'depth', 'mag', 'place']

# List to store cleaned data
merged_data = []

# Loop through years
for year in range(2004, 2026):
    file_name = f"{year}.csv"
    file_path = os.path.join(FOLDER_PATH, file_name)

    if not os.path.exists(file_path):
        print(f"File not found: {file_name}")
        continue

    print(f"Processing: {file_name}")
    try:
        df = pd.read_csv(file_path, low_memory=False)

        # Check for required columns
        if not all(col in df.columns for col in COLUMNS_NEEDED):
            print(f"Skipping {file_name} due to missing columns.")
            continue

        # Keep only needed columns and drop rows with NaN
        df = df[COLUMNS_NEEDED].dropna()

        # Add year column from 'time'
        df['year'] = pd.to_datetime(df['time'], errors='coerce').dt.year
        df = df.dropna(subset=['year'])  # drop if time parsing failed
        df['year'] = df['year'].astype(int)

        merged_data.append(df)

    except Exception as e:
        print(f"Error processing {file_name}: {e}")

# Combine all years into one DataFrame
if merged_data:
    final_df = pd.concat(merged_data, ignore_index=True)
    final_df.to_csv(OUTPUT_FILE, index=False)
    print(f"\n Merged and cleaned data saved to: {OUTPUT_FILE}")
else:
    print("\n No valid data to merge.")
