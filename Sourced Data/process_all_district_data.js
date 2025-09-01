#!/usr/bin/env node

/**
 * Process all district data including:
 * - Multiple years of CMAS scores
 * - Enrollment and FRL (Free/Reduced Lunch) data
 * Combine into a single comprehensive dataset
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Process enrollment data from all sheets
function processEnrollmentData() {
    console.log('Processing enrollment data...');
    const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
    const districtEnrollment = {};
    
    try {
        const workbook = XLSX.readFile(filePath);
        
        // Process each year's sheet
        workbook.SheetNames.forEach(sheetName => {
            // Skip non-data sheets
            if (sheetName.includes('Cheat Sheet')) return;
            
            // Extract year from sheet name (e.g., "2024-2025 Data" -> "2024")
            const yearMatch = sheetName.match(/(\d{4})-\d{4}/);
            if (!yearMatch) return;
            const year = yearMatch[1];
            
            console.log(`  Processing ${sheetName}...`);
            
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            
            // Aggregate by district
            data.forEach(row => {
                const districtName = row['Organization Name'];
                if (!districtName) return;
                
                if (!districtEnrollment[districtName]) {
                    districtEnrollment[districtName] = {};
                }
                
                if (!districtEnrollment[districtName][year]) {
                    districtEnrollment[districtName][year] = {
                        enrollment: 0,
                        freeLunch: 0,
                        reducedLunch: 0,
                        schools: 0
                    };
                }
                
                // Sum up district totals
                districtEnrollment[districtName][year].enrollment += row['PK-12 Total'] || 0;
                districtEnrollment[districtName][year].freeLunch += row['Free Lunch'] || 0;
                districtEnrollment[districtName][year].reducedLunch += row['Reduced Lunch'] || 0;
                districtEnrollment[districtName][year].schools += 1;
            });
        });
        
        // Calculate FRL percentages
        Object.keys(districtEnrollment).forEach(district => {
            Object.keys(districtEnrollment[district]).forEach(year => {
                const data = districtEnrollment[district][year];
                const frlTotal = data.freeLunch + data.reducedLunch;
                data.frlPercent = data.enrollment > 0 ? 
                    Math.round((frlTotal / data.enrollment) * 1000) / 10 : 0;
            });
        });
        
        return districtEnrollment;
        
    } catch (error) {
        console.error('Error processing enrollment data:', error.message);
        return {};
    }
}

// Process all CMAS files
function processAllCMASData() {
    console.log('\nProcessing CMAS data...');
    const cmasDir = path.join(__dirname, 'General CMAS Score Data');
    const allResults = [];
    
    const cmasFiles = fs.readdirSync(cmasDir)
        .filter(f => f.endsWith('.xlsx') && !f.includes('inspect'));
    
    cmasFiles.forEach(file => {
        console.log(`  Processing ${file}...`);
        const filePath = path.join(cmasDir, file);
        
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to raw data to find headers
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Find header row
            let headerRowIndex = 0;
            for (let i = 0; i < Math.min(rawData.length, 40); i++) {
                if (rawData[i] && rawData[i].some(cell => 
                    cell && (cell.toString() === 'Level' || cell.toString().includes('Level')))) {
                    headerRowIndex = i;
                    break;
                }
            }
            
            const headers = rawData[headerRowIndex];
            const data = rawData.slice(headerRowIndex + 1);
            
            // Find important columns
            const levelIdx = headers.findIndex(h => h && h.toString().includes('Level'));
            const gradeIdx = headers.findIndex(h => h && h.toString().includes('Grade'));
            const districtIdx = headers.findIndex(h => h && 
                (h.toString() === 'District Name' || h.toString() === 'Organization Name'));
            const subjectIdx = headers.findIndex(h => h && 
                (h.toString() === 'Content' || h.toString() === 'Subject'));
            
            // Extract year from filename
            const yearMatch = file.match(/(\d{4})/);
            const fileYear = yearMatch ? yearMatch[0] : null;
            
            // Find percent columns (could be year columns or "Percent Met or Exceeded")
            const percentColumns = [];
            headers.forEach((header, idx) => {
                if (header && (
                    /^\d{4}$/.test(header.toString()) || 
                    header.toString().includes('Percent Met or Exceeded') ||
                    header.toString().includes('% Met or Exceeded')
                )) {
                    percentColumns.push({ year: header.toString(), index: idx });
                }
            });
            
            // Process data
            data.forEach(row => {
                if (row[levelIdx] === 'DISTRICT' && row[gradeIdx] === 'All Grades') {
                    const district = row[districtIdx];
                    const subject = row[subjectIdx];
                    
                    if (district) {
                        if (percentColumns.length === 0 && fileYear) {
                            // No percent columns found, look for a general percent column
                            const pctIdx = headers.findIndex(h => h && 
                                h.toString().toLowerCase().includes('percent'));
                            if (pctIdx >= 0) {
                                allResults.push({
                                    district,
                                    subject,
                                    year: fileYear,
                                    percent: parseFloat(row[pctIdx]) || 0
                                });
                            }
                        } else {
                            // Process each year column
                            percentColumns.forEach(col => {
                                const year = /^\d{4}$/.test(col.year) ? col.year : fileYear;
                                if (year) {
                                    allResults.push({
                                        district,
                                        subject,
                                        year,
                                        percent: parseFloat(row[col.index]) || 0
                                    });
                                }
                            });
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error(`    Error processing ${file}:`, error.message);
        }
    });
    
    return allResults;
}

// Combine CMAS results by district and year
function combineCMASData(results) {
    const combined = {};
    
    results.forEach(result => {
        if (!combined[result.district]) {
            combined[result.district] = {};
        }
        
        if (!combined[result.district][result.year]) {
            combined[result.district][result.year] = {
                subjects: [],
                total: 0
            };
        }
        
        combined[result.district][result.year].subjects.push(result.percent);
        combined[result.district][result.year].total += result.percent;
    });
    
    // Calculate averages
    const finalCMAS = {};
    Object.entries(combined).forEach(([district, years]) => {
        finalCMAS[district] = {};
        Object.entries(years).forEach(([year, data]) => {
            const avg = data.total / data.subjects.length;
            finalCMAS[district][year] = Math.round(avg * 10) / 10;
        });
    });
    
    return finalCMAS;
}

// Combine all data sources
function combineAllData(enrollmentData, cmasData) {
    console.log('\nCombining all data...');
    const finalData = {};
    
    // Get all unique district names
    const allDistricts = new Set([
        ...Object.keys(enrollmentData),
        ...Object.keys(cmasData)
    ]);
    
    allDistricts.forEach(district => {
        finalData[district] = {
            enrollment_trends: [],
            cmas_scores: []
        };
        
        // Add enrollment data
        if (enrollmentData[district]) {
            Object.entries(enrollmentData[district]).forEach(([year, data]) => {
                finalData[district].enrollment_trends.push({
                    year: year,
                    enrollment: data.enrollment,
                    frl: data.frlPercent
                });
            });
            // Sort by year
            finalData[district].enrollment_trends.sort((a, b) => 
                a.year.localeCompare(b.year));
        }
        
        // Add CMAS data
        if (cmasData[district]) {
            Object.entries(cmasData[district]).forEach(([year, percent]) => {
                finalData[district].cmas_scores.push({
                    year: year,
                    met_or_exceeded_pct: percent
                });
            });
            // Sort by year
            finalData[district].cmas_scores.sort((a, b) => 
                a.year.localeCompare(b.year));
        }
    });
    
    return finalData;
}

// Main execution
async function main() {
    console.log('Processing all Colorado district data...\n');
    
    // Process enrollment data
    const enrollmentData = processEnrollmentData();
    console.log(`Processed enrollment data for ${Object.keys(enrollmentData).length} districts`);
    
    // Process CMAS data
    const cmasResults = processAllCMASData();
    console.log(`Found ${cmasResults.length} CMAS data points`);
    
    const cmasData = combineCMASData(cmasResults);
    console.log(`Processed CMAS data for ${Object.keys(cmasData).length} districts`);
    
    // Combine all data
    const finalData = combineAllData(enrollmentData, cmasData);
    
    // Save the complete dataset
    const outputPath = path.join(__dirname, '../public/district_data_complete.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
    
    console.log(`\nSaved complete data to: ${outputPath}`);
    console.log(`Total districts: ${Object.keys(finalData).length}`);
    
    // Show sample
    const sampleDistrict = Object.entries(finalData)
        .find(([_, data]) => 
            data.enrollment_trends.length > 5 && 
            data.cmas_scores.length > 5);
    
    if (sampleDistrict) {
        console.log('\nSample district with comprehensive data:');
        console.log(`${sampleDistrict[0]}:`);
        console.log(`  Enrollment years: ${sampleDistrict[1].enrollment_trends.map(e => e.year).join(', ')}`);
        console.log(`  CMAS years: ${sampleDistrict[1].cmas_scores.map(c => c.year).join(', ')}`);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { processEnrollmentData, processAllCMASData, combineAllData };