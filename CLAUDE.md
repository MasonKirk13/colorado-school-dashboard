# Colorado School District Map Project

## Project Overview
Interactive web map application displaying Colorado school districts with comprehensive data visualizations comparing district performance metrics against Denver County 1.

## Tech Stack
- **Frontend**: React with Vite
- **Mapping**: Leaflet with react-leaflet
- **Charts**: Recharts for data visualization
- **Data Format**: GeoJSON for boundaries, JSON for district data

## Key Application Features
1. Interactive map of all Colorado school districts
2. Click on any district to view its data
3. Automatic comparison with Denver County 1
4. Three main metrics displayed:
   - Student Enrollment trends (2014-2024)
   - Free/Reduced Lunch percentages
   - CMAS (Colorado Measures of Academic Success) test scores

## Project Structure
```
/
├── src/
│   ├── COMap.jsx          # Main React component with map and charts
│   ├── main.jsx           # React entry point
│   └── index.css          # Styling
├── public/
│   ├── School_Districts.geojson      # District boundary data
│   ├── district_data_complete.json   # Processed district metrics
│   └── district_name_mapping.json    # Handles district name variations
├── Sourced Data/
│   ├── General CMAS Score Data/      # Raw CMAS Excel files (2016-2024)
│   ├── Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx
│   └── [various data processing scripts]
└── index.html             # App entry point
```

## Data Sources
- **CMAS Data**: Annual standardized test results (2016-2024) showing percentage of students who met or exceeded expectations
- **Enrollment Data**: Student enrollment counts by year
- **FRL Data**: Free/Reduced Lunch eligibility percentages (poverty indicator)
- **Geographic Data**: School district boundaries from GeoJSON

## Important Implementation Details
- District names may vary between data sources; handled by name mapping
- Missing data years show as gaps in line charts (connectNulls=true for enrollment/FRL, false for CMAS)
- Each district gets a unique color based on a hash of its name
- Charts use consistent year range (2014-2024) even if data is missing

## Common Commands
```bash
npm install        # Install dependencies
npm run dev        # Start development server
npm run build      # Build for production
```

## Current Status
Web map is fully functional with:
- ✅ Interactive district selection
- ✅ Multi-year trend visualizations  
- ✅ Side-by-side comparison with Denver County 1
- ✅ Responsive chart layouts
- ✅ Data tooltips and hover effects

## Known Data Processing Scripts
The Sourced Data folder contains numerous JavaScript and Python scripts used to:
- Convert Excel files to JSON
- Merge data from multiple years
- Handle district name variations
- Create simplified data structures for the web app

## Notes for Future Development
- All data processing happens offline; the web app only reads pre-processed JSON files
- District comparison is hard-coded to Denver County 1 but could be made configurable
- CMAS data has gaps (no 2020 data due to COVID-19)