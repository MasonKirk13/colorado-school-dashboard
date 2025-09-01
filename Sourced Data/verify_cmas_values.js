const fs = require('fs');

console.log('Verifying CMAS values are reasonable...\n');

const data = JSON.parse(fs.readFileSync('../public/district_data_complete.json', 'utf8'));

// Check a few districts across different years
const checkDistricts = ['Academy 20', 'Denver County 1', 'Adams 12 Five Star Schools'];

checkDistricts.forEach(districtName => {
  const district = data[districtName];
  if (!district || !district.cmas_scores) return;
  
  console.log(`\n${districtName}:`);
  district.cmas_scores.forEach(score => {
    if (score.met_or_exceeded_pct !== null) {
      console.log(`  ${score.year}: ${score.met_or_exceeded_pct}%`);
    }
  });
});

// Check overall statistics
let allScores = [];
Object.values(data).forEach(district => {
  if (district.cmas_scores) {
    district.cmas_scores.forEach(score => {
      if (score.met_or_exceeded_pct !== null) {
        allScores.push(score.met_or_exceeded_pct);
      }
    });
  }
});

console.log('\n\nOverall CMAS Statistics:');
console.log(`Total scores: ${allScores.length}`);
console.log(`Min: ${Math.min(...allScores)}%`);
console.log(`Max: ${Math.max(...allScores)}%`);
console.log(`Average: ${(allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)}%`);

// Check distribution
const ranges = [
  { min: 0, max: 20, count: 0 },
  { min: 20, max: 40, count: 0 },
  { min: 40, max: 60, count: 0 },
  { min: 60, max: 80, count: 0 },
  { min: 80, max: 100, count: 0 }
];

allScores.forEach(score => {
  const range = ranges.find(r => score >= r.min && score < r.max);
  if (range) range.count++;
});

console.log('\nScore Distribution:');
ranges.forEach(r => {
  const pct = ((r.count / allScores.length) * 100).toFixed(1);
  console.log(`  ${r.min}-${r.max}%: ${r.count} scores (${pct}%)`);
});