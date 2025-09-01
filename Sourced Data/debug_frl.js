const XLSX = require('xlsx');
const workbook = XLSX.readFile('Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');

// Check multiple years
const years = ['2024-2025 Data', '2023-2024 Data', '2020-2021 Data', '2016-2017 Data'];
years.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  // Find Academy 20 schools
  const academy = data.filter(row => row['Organization Name'] === 'Academy 20');
  
  console.log('\n' + sheetName + ':');
  console.log('Academy 20 schools found:', academy.length);
  if (academy.length > 0) {
    console.log('First school:', {
      name: academy[0]['School Name'],
      enrollment: academy[0]['PK-12 Total'],
      free: academy[0]['Free Lunch'],
      reduced: academy[0]['Reduced Lunch'],
      freeLunchType: typeof academy[0]['Free Lunch'],
      reducedLunchType: typeof academy[0]['Reduced Lunch']
    });
    
    // Check if it's a string like "Not Available"
    const freeValue = academy[0]['Free Lunch'];
    console.log('Free lunch raw value:', JSON.stringify(freeValue));
  }
});