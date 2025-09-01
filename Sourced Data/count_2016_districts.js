const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'General CMAS Score Data/2016 ELA Math District and School Summary final.xlsx');
const workbook = XLSX.readFile(filePath);

workbook.SheetNames.forEach(sheetName => {
  console.log(`\nSheet: ${sheetName}`);
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`Total rows: ${rawData.length}`);
  
  // Count DISTRICT rows
  let districtRows = 0;
  const uniqueDistricts = new Set();
  
  for (let i = 0; i < rawData.length; i++) {
    if (rawData[i] && rawData[i][0] === 'DISTRICT') {
      districtRows++;
      uniqueDistricts.add(rawData[i][2]);
    }
  }
  
  console.log(`DISTRICT rows: ${districtRows}`);
  console.log(`Unique districts: ${uniqueDistricts.size}`);
  console.log('Sample districts:', Array.from(uniqueDistricts).slice(0, 10));
});