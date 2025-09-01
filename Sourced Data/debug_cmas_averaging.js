const { processAllCMASData } = require('./process_all_district_data.js');

console.log('Analyzing CMAS data processing...\n');

const results = processAllCMASData();

// Group by district and year to see subjects
const byDistrictYear = {};
results.forEach(r => {
  const key = `${r.district} - ${r.year}`;
  if (!byDistrictYear[key]) byDistrictYear[key] = [];
  byDistrictYear[key].push({ subject: r.subject, percent: r.percent });
});

// Show entries with multiple subjects
let count = 0;
Object.entries(byDistrictYear).forEach(([key, subjects]) => {
  if (subjects.length > 1 && count < 10) {
    console.log(key + ':');
    subjects.forEach(s => console.log(`  ${s.subject}: ${s.percent}%`));
    const total = subjects.reduce((sum, s) => sum + s.percent, 0);
    const avg = total / subjects.length;
    console.log(`  Sum of percentages: ${total.toFixed(1)}%`);
    console.log(`  Average: ${avg.toFixed(1)}%`);
    console.log('');
    count++;
  }
});

console.log(`\nTotal data points: ${results.length}`);
console.log(`Unique district-year combinations: ${Object.keys(byDistrictYear).length}`);