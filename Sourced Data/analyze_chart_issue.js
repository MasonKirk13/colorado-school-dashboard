const fs = require('fs');
const data = JSON.parse(fs.readFileSync('../public/district_data_complete.json', 'utf8'));

// Function to normalize year data (same as in React component)
function normalizeYearData(data, dataKey) {
  const allYears = ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];
  const dataMap = new Map();
  
  if (data && Array.isArray(data)) {
    data.forEach(item => {
      dataMap.set(item.year, item);
    });
  }
  
  return allYears.map(year => {
    const existing = dataMap.get(year);
    if (existing) {
      return existing;
    } else {
      if (dataKey === 'cmas') {
        return { year, met_or_exceeded_pct: null };
      }
    }
  });
}

// Check a specific district
const testDistricts = ['Academy 20', 'Denver County 1', 'Cherry Creek 5'];

testDistricts.forEach(districtName => {
  const district = data[districtName];
  if (district && district.cmas_scores) {
    console.log(`\n${districtName}:`);
    console.log('Raw CMAS data:', district.cmas_scores);
    
    const normalized = normalizeYearData(district.cmas_scores, 'cmas');
    console.log('Normalized CMAS data:', normalized);
    
    // Check for any values over 100
    const overHundred = normalized.filter(d => d.met_or_exceeded_pct > 100);
    if (overHundred.length > 0) {
      console.log('VALUES OVER 100 FOUND:', overHundred);
    }
    
    // Check max value
    const nonNullValues = normalized.filter(d => d.met_or_exceeded_pct !== null).map(d => d.met_or_exceeded_pct);
    if (nonNullValues.length > 0) {
      console.log('Max value:', Math.max(...nonNullValues));
    }
  }
});