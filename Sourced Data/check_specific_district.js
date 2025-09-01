const fs = require('fs');
const data = JSON.parse(fs.readFileSync('../public/district_data_complete.json', 'utf8'));

// Check a few districts with potentially high values
const districtsToCheck = ['Academy 20', 'Cherry Creek 5', 'Douglas County RE 1', 'Littleton 6'];

districtsToCheck.forEach(districtName => {
  const district = data[districtName];
  if (district && district.cmas_scores) {
    console.log(`\n${districtName} CMAS Scores:`);
    district.cmas_scores.forEach(score => {
      console.log(`  ${score.year}: ${score.met_or_exceeded_pct}%`);
    });
  }
});

// Also check for any data anomalies
console.log('\n\nChecking for any unusual patterns in CMAS data:');
let anomalies = 0;
Object.entries(data).forEach(([name, district]) => {
  if (district.cmas_scores) {
    district.cmas_scores.forEach(score => {
      if (score.met_or_exceeded_pct !== null && score.met_or_exceeded_pct !== undefined) {
        // Check if it's a number
        if (typeof score.met_or_exceeded_pct !== 'number') {
          console.log(`Non-numeric value in ${name} for ${score.year}: ${score.met_or_exceeded_pct} (type: ${typeof score.met_or_exceeded_pct})`);
          anomalies++;
        }
        // Check if it's negative or extremely high
        if (score.met_or_exceeded_pct < 0 || score.met_or_exceeded_pct > 100) {
          console.log(`Out of range value in ${name} for ${score.year}: ${score.met_or_exceeded_pct}%`);
          anomalies++;
        }
      }
    });
  }
});

console.log(`\nTotal anomalies found: ${anomalies}`);