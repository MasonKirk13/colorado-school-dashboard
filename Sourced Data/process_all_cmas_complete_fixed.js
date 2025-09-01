#!/usr/bin/env node

/**
 * Fixed version to process ALL CMAS data files from 2016-2024
 * Handles different file formats and COVID years properly
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Process old format files (different structures)
function processOldCMASFile(filePath, year) {
    console.log(`Processing ${year} file...`);
    const results = [];
    
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Find header row
        let headerRow = -1;
        for (let i = 0; i < Math.min(10, data.length); i++) {
            if (data[i] && data[i][0] === 'Level') {
                headerRow = i;
                break;
            }
        }
        
        if (headerRow === -1) {
            console.log(`  Warning: No header row found in ${year} file`);
            return results;
        }
        
        const headers = data[headerRow];
        
        // Find key columns
        const levelIdx = 0;
        const districtNameIdx = headers.findIndex(h => h && h.toString().includes('District') && h.toString().includes('Name'));
        const contentIdx = headers.findIndex(h => h && h.toString() === 'Content');
        const testIdx = headers.findIndex(h => h && h.toString() === 'Test');
        
        // Find percent column - look for "% Met or Exceeded"
        let pctIdx = headers.findIndex(h => h && h.toString().includes('% Met or') && h.toString().includes('Exceeded'));
        
        console.log(`  Found columns - District: ${districtNameIdx}, Content: ${contentIdx}, Test: ${testIdx}, Percent: ${pctIdx}`);
        
        if (districtNameIdx === -1 || pctIdx === -1) {
            console.log(`  Warning: Missing required columns in ${year} file`);
            return results;
        }
        
        // Process district rows
        const districtData = {};
        
        for (let i = headerRow + 1; i < data.length; i++) {
            const row = data[i];
            if (row[levelIdx] === 'DISTRICT') {
                const district = row[districtNameIdx];
                const content = row[contentIdx];
                const test = row[testIdx];
                const percent = parseFloat(row[pctIdx]) || 0;
                
                // Skip if not a grade-level test
                if (!test || (!test.includes('Grade') && !test.includes('All Grades'))) continue;
                
                if (!districtData[district]) {
                    districtData[district] = { scores: [], count: 0 };
                }
                
                districtData[district].scores.push(percent);
                districtData[district].count++;
            }
        }
        
        // Calculate averages
        Object.entries(districtData).forEach(([district, data]) => {
            if (data.count > 0) {
                const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.count;
                results.push({
                    district,
                    year,
                    percent: Math.round(avgScore * 10) / 10
                });
            }
        });
        
        console.log(`  Processed ${results.length} districts for ${year}`);
        return results;
        
    } catch (error) {
        console.error(`  Error processing ${year} file:`, error.message);
        return [];
    }
}

// Process newer format files
function processNewCMASFile(filePath) {
    const filename = path.basename(filePath);
    console.log(`Processing ${filename}...`);
    const results = [];
    
    try {
        const workbook = XLSX.readFile(filePath);
        let sheetName = workbook.SheetNames[0];
        
        // Handle 2021 special case
        if (filename.includes('2021') && workbook.SheetNames.includes('CMAS ELA and Math')) {
            sheetName = 'CMAS ELA and Math';
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Find header row
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(rawData.length, 40); i++) {
            if (rawData[i] && rawData[i].some(cell => cell && cell.toString() === 'Level')) {
                headerRowIndex = i;
                break;
            }
        }
        
        if (headerRowIndex === -1) {
            console.log(`  Warning: No header row found`);
            return results;
        }
        
        const headers = rawData[headerRowIndex];
        const data = rawData.slice(headerRowIndex + 1);
        
        // Find column indices
        const levelIdx = headers.findIndex(h => h && h.toString() === 'Level');
        const gradeIdx = headers.findIndex(h => h && h.toString() === 'Grade');
        const districtIdx = headers.findIndex(h => h && h.toString() === 'District Name');
        const subjectIdx = headers.findIndex(h => h && (h.toString() === 'Content' || h.toString() === 'Subject'));
        
        // Find year columns - these files have multiple years
        const yearColumns = [];
        headers.forEach((header, idx) => {
            if (header && /^\\d{4}$/.test(header.toString())) {
                yearColumns.push({ year: header.toString(), index: idx });
            }
        });
        
        console.log(`  Found year columns: ${yearColumns.map(y => y.year).join(', ')}`);
        
        // Process data
        data.forEach(row => {
            if (row[levelIdx] === 'DISTRICT' && row[gradeIdx] === 'All Grades') {
                const district = row[districtIdx];
                const subject = row[subjectIdx];
                
                if (district) {
                    yearColumns.forEach(col => {
                        const value = row[col.index];
                        if (value === 'N/A' || value === 'n/a' || value === '-' || value === '--') {
                            results.push({
                                district,
                                year: col.year,
                                percent: null,
                                subject
                            });
                        } else {
                            const percent = parseFloat(value);
                            if (!isNaN(percent)) {
                                results.push({
                                    district,
                                    year: col.year,
                                    percent,
                                    subject
                                });
                            }
                        }
                    });
                }
            }
        });
        
        console.log(`  Processed ${results.length / yearColumns.length} districts`);
        return results;
        
    } catch (error) {
        console.error(`  Error processing ${filename}:`, error.message);
        return [];
    }
}

// Combine all results
function combineAllResults(allResults) {
    const combined = {};
    
    // Group by district and year
    allResults.forEach(result => {
        if (!combined[result.district]) {
            combined[result.district] = {};
        }
        
        if (!combined[result.district][result.year]) {
            combined[result.district][result.year] = {
                scores: [],
                hasData: false
            };
        }
        
        if (result.percent !== null) {
            combined[result.district][result.year].scores.push(result.percent);
            combined[result.district][result.year].hasData = true;
        }
    });
    
    // Format final output with ALL years
    const finalResult = {};
    
    Object.entries(combined).forEach(([district, years]) => {
        finalResult[district] = { cmas_scores: [] };
        
        // Add all years 2016-2024
        ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'].forEach(year => {
            if (year === '2020') {
                // No testing in 2020
                finalResult[district].cmas_scores.push({
                    year,
                    met_or_exceeded_pct: null,
                    note: "No testing due to COVID-19"
                });
            } else if (years[year] && years[year].hasData) {
                const avg = years[year].scores.reduce((a, b) => a + b, 0) / years[year].scores.length;
                finalResult[district].cmas_scores.push({
                    year,
                    met_or_exceeded_pct: Math.round(avg * 10) / 10
                });
            } else if (year === '2021') {
                // Special case for 2021 - limited testing
                finalResult[district].cmas_scores.push({
                    year,
                    met_or_exceeded_pct: null,
                    note: "Limited testing due to COVID-19"
                });
            }
            // Note: We don't add empty entries for other missing years
        });
    });
    
    return finalResult;
}

// Main execution
async function main() {
    console.log('Processing ALL CMAS data from 2016-2024...\n');
    
    const cmasDir = path.join(__dirname, 'General CMAS Score Data');
    const allResults = [];
    
    // Process old format files
    const oldFiles = [
        { file: '2016 ELA Math District and School Summary final.xlsx', year: '2016' },
        { file: '2017 CMAS ELA Math District & School Overall Results FINAL.xlsx', year: '2017' },
        { file: '2018 CMAS ELA and Math District and School Summary Achievement Results_FINAL.xlsx', year: '2018' }
    ];
    
    oldFiles.forEach(({ file, year }) => {
        const filePath = path.join(cmasDir, file);
        if (fs.existsSync(filePath)) {
            const results = processOldCMASFile(filePath, year);
            allResults.push(...results);
        }
    });
    
    // Process new format files
    const newFiles = [
        '2019 CMAS ELA MATH District and School Achievement Results.xlsx',
        '2021 CMAS ELA and Math District and School Summary Achievement Results - Required Tests.xlsx',
        '2022 CMAS ELA and Math District and School Summary Achievement Results.xlsx',
        '2023 CMAS ELA and Math District and School Summary Achievement Results.xlsx',
        '2024 CMAS ELA and Math District and School Summary Results.xlsx'
    ];
    
    newFiles.forEach(file => {
        const filePath = path.join(cmasDir, file);
        if (fs.existsSync(filePath)) {
            const results = processNewCMASFile(filePath);
            allResults.push(...results);
        }
    });
    
    console.log(`\nTotal data points collected: ${allResults.length}`);
    
    // Show years collected
    const yearsSet = new Set(allResults.map(r => r.year));
    console.log('Years collected:', Array.from(yearsSet).sort());
    
    // Combine all results
    const finalData = combineAllResults(allResults);
    
    // Save the output
    const outputPath = path.join(__dirname, 'cmas_all_years_complete_fixed.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
    
    console.log(`\nSaved complete CMAS data to: ${outputPath}`);
    console.log(`Total districts: ${Object.keys(finalData).length}`);
    
    // Show sample
    const sampleDistrict = Object.entries(finalData)[0];
    if (sampleDistrict) {
        console.log(`\nSample district (${sampleDistrict[0]}):`);
        sampleDistrict[1].cmas_scores.forEach(score => {
            const value = score.met_or_exceeded_pct !== null ? 
                `${score.met_or_exceeded_pct}%` : 
                score.note || 'No data';
            console.log(`  ${score.year}: ${value}`);
        });
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { processOldCMASFile, processNewCMASFile, combineAllResults };