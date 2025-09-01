# Colorado School District Map Application

## Overview
This project is a web application designed to visualize Colorado school district data using interactive maps and charts. It provides insights into enrollment trends, free/reduced lunch percentages, and CMAS scores for various districts.

## Features
- **Interactive Map**: Displays school district boundaries using GeoJSON data.
- **Charts**: Visualizes enrollment trends and CMAS scores using Recharts.
- **District Selection**: Allows users to click on districts to view detailed data.

## Technologies Used
- **React**: Frontend framework for building the user interface.
- **Leaflet**: Library for interactive maps.
- **React-Leaflet**: React bindings for Leaflet.
- **Recharts**: Library for creating charts.
- **Vite**: Build tool for fast development.

## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd CO_District_Map_App_Charts_FULL
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Usage
### Development
Start the development server:
```bash
npm run dev
```
Access the application at `http://localhost:3000`.

### Build
Build the application for production:
```bash
npm run build
```

### Preview
Preview the production build:
```bash
npm run preview
```

## File Structure
- **index.html**: Entry point for the application.
- **package.json**: Project metadata and dependencies.
- **vite.config.js**: Configuration for Vite.
- **public/**: Contains static assets like GeoJSON and JSON data files.
  - `School_Districts.geojson`: GeoJSON data for district boundaries.
  - `district_data_combined.json`: Combined data for districts.
- **src/**: Source code for the application.
  - `COMap.jsx`: Main component for rendering the map and charts.
  - `main.jsx`: Entry point for React application.

## Data Sources
- **GeoJSON**: Contains spatial data for school district boundaries.
- **JSON**: Includes enrollment trends, free/reduced lunch percentages, and CMAS scores.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License.

---

## Additional Documentation

### `COMap.jsx`
- **Purpose**: Main component for rendering the map and charts.
- **Key Features**:
  - Fetches GeoJSON and district data on mount.
  - Displays a map with district boundaries.
  - Allows district selection via map interaction.
  - Renders charts for enrollment trends and CMAS scores.

### `main.jsx`
- **Purpose**: Entry point for the React application.
- **Key Features**:
  - Renders the `COMap` component inside the root div.

### `School_Districts.geojson`
- **Purpose**: Contains spatial data for Colorado school districts.
- **Key Features**:
  - Each feature represents a district with properties like name, area, and URL.

### `district_data_combined.json`
- **Purpose**: Provides detailed data for each district.
- **Key Features**:
  - Includes enrollment trends, free/reduced lunch percentages, and CMAS scores.
