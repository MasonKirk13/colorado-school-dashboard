#!/usr/bin/env node

/**
 * Simplify CMAS data for the Colorado District Map App
 * This Node.js version doesn't require pandas
 * 
 * First install xlsx package:
 * npm install xlsx
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function processWithJSON(data, outputFile) {
    // Filter for district-level, all-grades data
    const filtered = data.filter(row => 
        row['Level'] === 'DISTRICT' && 
        row['Grade'] === 'All Grades'
    );
    
    console.log(`Filtered to ${filtered.length} district records`);
    
    // Transform to desired format
    const result = {};
    
    filtered.forEach(row => {
        const district = row['District Name'] || row['DistrictName'] || row['Organization Name'];
        const subject = row['Subject'] || row['Content'];
        const year = (row['School Year'] || row['Year'] || '').toString().substring(0, 4);
        const percent = parseFloat(row['Percent Met or Exceeded Expectations'] || row['% Met or Exceeded'] || 0);
        
        if (!district || !year) return;
        
        if (!result[district]) {
            result[district] = { yearlyData: {} };
        }
        
        if (!result[district].yearlyData[year]) {
            result[district].yearlyData[year] = { subjects: [], total: 0 };
        }
        
        result[district].yearlyData[year].subjects.push(percent);
        result[district].yearlyData[year].total += percent;
    });
    
    // Calculate averages and format output
    Object.keys(result).forEach(district => {
        const cmasScores = [];
        const yearlyData = result[district].yearlyData;
        
        Object.keys(yearlyData).sort().forEach(year => {
            const avgScore = yearlyData[year].total / yearlyData[year].subjects.length;
            cmasScores.push({
                year: year,
                met_or_exceeded_pct: Math.round(avgScore * 10) / 10
            });
        });
        
        result[district] = {
            cmas_scores: cmasScores
        };
    });
    
    // Save to JSON
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    
    console.log(`Saved simplified data to ${outputFile}`);
    console.log(`Processed ${Object.keys(result).length} districts`);
    
    // Show sample
    const sampleDistrict = Object.keys(result)[0];
    if (sampleDistrict) {
        console.log(`\nSample data for ${sampleDistrict}:`);
        console.log(JSON.stringify(result[sampleDistrict], null, 2));
    }
}

function simplifyCMASData(inputFile, outputFile) {
    console.log(`Reading ${inputFile}...`);
    
    try {
        // Read the Excel file
        const workbook = XLSX.readFile(inputFile);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header detection
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Find header row (look for row containing 'Level')
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rawData.length, 40); i++) {
            if (rawData[i] && rawData[i].some(cell => cell && cell.toString() === 'Level')) {
                headerRowIndex = i;
                console.log(`Found header row at index ${i}`);
                break;
            }
        }
        
        // If no header found, try to read with sheet_to_json default behavior
        if (headerRowIndex === 0 && rawData.length > 0) {
            console.log('Trying alternative parsing method...');
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            if (jsonData.length > 0) {
                console.log('Sample row:', Object.keys(jsonData[0]));
                return processWithJSON(jsonData, outputFile);
            }
        }
        
        // Get headers and data
        const headers = rawData[headerRowIndex];
        const data = rawData.slice(headerRowIndex + 1);
        
        console.log('Found columns:', headers);
        
        // Find column indices
        const levelIdx = headers.findIndex(h => h && h.toString() === 'Level');
        const gradeIdx = headers.findIndex(h => h && h.toString() === 'Grade');
        const districtIdx = headers.findIndex(h => h && h.toString() === 'District Name');
        const subjectIdx = headers.findIndex(h => h && h.toString() === 'Content');
        const pctIdx = headers.findIndex(h => h && h.toString() === '2024'); // The 2024 column contains the percent met/exceeded
        
        // Filter for district-level, all-grades data
        const filtered = data.filter(row => 
            row[levelIdx] === 'DISTRICT' && 
            row[gradeIdx] === 'All Grades'
        );
        
        console.log(`Filtered to ${filtered.length} district records`);
        
        // Transform to desired format
        const result = {};
        
        filtered.forEach(row => {
            const district = row[districtIdx];
            const subject = row[subjectIdx];
            const year = '2024'; // This is 2024 data
            const percent = parseFloat(row[pctIdx]) || 0;
            
            if (!result[district]) {
                result[district] = { yearlyData: {} };
            }
            
            if (!result[district].yearlyData[year]) {
                result[district].yearlyData[year] = { subjects: [], total: 0 };
            }
            
            result[district].yearlyData[year].subjects.push(percent);
            result[district].yearlyData[year].total += percent;
        });
        
        // Calculate averages and format output
        Object.keys(result).forEach(district => {
            const cmasScores = [];
            const yearlyData = result[district].yearlyData;
            
            Object.keys(yearlyData).sort().forEach(year => {
                const avgScore = yearlyData[year].total / yearlyData[year].subjects.length;
                cmasScores.push({
                    year: year,
                    met_or_exceeded_pct: Math.round(avgScore * 10) / 10
                });
            });
            
            result[district] = {
                cmas_scores: cmasScores
            };
        });
        
        // Save to JSON
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
        
        console.log(`Saved simplified data to ${outputFile}`);
        console.log(`Processed ${Object.keys(result).length} districts`);
        
        // Show sample
        const sampleDistrict = Object.keys(result)[0];
        console.log(`\nSample data for ${sampleDistrict}:`);
        console.log(JSON.stringify(result[sampleDistrict], null, 2));
        
    } catch (error) {
        console.error('Error processing file:', error.message);
        console.error('Make sure to install xlsx: npm install xlsx');
        process.exit(1);
    }
}

// Main execution
if (require.main === module) {
    const inputFile = path.join(__dirname, 'General CMAS Score Data', '2024 CMAS ELA and Math District and School Summary Results.xlsx');
    const outputFile = path.join(__dirname, 'cmas_district_simplified.json');
    
    simplifyCMASData(inputFile, outputFile);
}

module.exports = { simplifyCMASData };