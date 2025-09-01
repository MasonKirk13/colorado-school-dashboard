const data = require('../public/dps_schools_data_multi_year.json');

let noData2023 = 0;
let noData2022 = 0;
const missing2023 = [];

data.schools.forEach(school => {
  if (!school.attendance['2023-2024']) {
    noData2023++;
    missing2023.push(school.name);
  }
  if (!school.attendance['2022-2023']) noData2022++;
});

console.log('Schools without 2023-2024 data:', noData2023);
console.log('Schools without 2022-2023 data:', noData2022);

console.log('\nSchools without 2023-2024 data:');
missing2023.forEach(name => console.log(' -', name));