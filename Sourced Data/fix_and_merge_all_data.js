#!/usr/bin/env node

/**
 * Fix and properly merge all district data
 * - Use existing CMAS processed data
 * - Fix FRL calculations
 * - Ensure proper merging
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Process enrollment data with proper FRL calculations
function processEnrollmentDataFixed() {
    console.log('Processing enrollment data with fixed FRL calculations...');
    const filePath = path.join(__dirname, 'Final FRL_Race_Gender_bySchoolandSchoolFlags.xlsx');
    const districtEnrollment = {};
    
    try {
        const workbook = XLSX.readFile(filePath);
        
        // Process each year's sheet
        workbook.SheetNames.forEach(sheetName => {
            if (sheetName.includes('Cheat Sheet')) return;
            
            const yearMatch = sheetName.match(/(\d{4})-(\d{4})/);
            if (!yearMatch) return;
            const startYear = yearMatch[1];
            const endYear = yearMatch[2];
            // Use the end year minus 1 for school year (e.g., 2023-2024 Data -> 2023)
            const year = (parseInt(endYear) - 1).toString();
            
            console.log(`  Processing ${sheetName}... (Year: ${year})`);
            
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            
            // Aggregate by district
            data.forEach(row => {
                let districtName = row['Organization Name'];
                if (!districtName || districtName === '9999') return; // Skip invalid
                
                // Normalize district names - handle case changes over years
                // Convert all-caps district names to proper case for consistency
                if (districtName === districtName.toUpperCase()) {
                    districtName = districtName.split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(' ');
                }
                
                if (!districtEnrollment[districtName]) {
                    districtEnrollment[districtName] = {};
                }
                
                if (!districtEnrollment[districtName][year]) {
                    districtEnrollment[districtName][year] = {
                        enrollment: 0,
                        freeLunch: 0,
                        reducedLunch: 0,
                        paidLunch: 0,
                        hasLunchData: false
                    };
                }
                
                // Sum up district totals
                const enrollment = parseInt(row['PK-12 Total']) || 0;
                const freeLunch = parseInt(row['Free Lunch']) || 0;
                const reducedLunch = parseInt(row['Reduced Lunch']) || 0;
                const paidLunch = parseInt(row['Paid Lunch']) || 0;
                
                districtEnrollment[districtName][year].enrollment += enrollment;
                districtEnrollment[districtName][year].freeLunch += freeLunch;
                districtEnrollment[districtName][year].reducedLunch += reducedLunch;
                districtEnrollment[districtName][year].paidLunch += paidLunch;
                
                // Check if we have valid lunch data
                if (freeLunch > 0 || reducedLunch > 0 || paidLunch > 0) {
                    districtEnrollment[districtName][year].hasLunchData = true;
                }
            });
        });
        
        // Calculate FRL percentages correctly
        Object.keys(districtEnrollment).forEach(district => {
            Object.keys(districtEnrollment[district]).forEach(year => {
                const data = districtEnrollment[district][year];
                
                if (data.hasLunchData && data.enrollment > 0) {
                    // Calculate FRL percentage from free + reduced lunch
                    const frlTotal = data.freeLunch + data.reducedLunch;
                    data.frlPercent = Math.round((frlTotal / data.enrollment) * 1000) / 10;
                } else {
                    // No lunch data available - common for 2016-2017 and earlier
                    data.frlPercent = null;
                }
                
                // Remove this verbose logging
                // console.log(`    ${district} ${year}: ${data.enrollment} students, ${data.frlPercent}% FRL`);
            });
        });
        
        return districtEnrollment;
        
    } catch (error) {
        console.error('Error processing enrollment data:', error.message);
        return {};
    }
}

// Merge all data properly
function mergeAllDataProperly() {
    console.log('\nMerging all data sources...');
    
    // Load complete CMAS data
    const cmasDataPath = path.join(__dirname, 'cmas_complete_all_sources.json');
    const cmasData = JSON.parse(fs.readFileSync(cmasDataPath, 'utf8'));
    console.log(`Loaded complete CMAS data for ${Object.keys(cmasData).length} districts`);
    
    // Process enrollment data
    const enrollmentData = processEnrollmentDataFixed();
    console.log(`\nProcessed enrollment data for ${Object.keys(enrollmentData).length} districts`);
    
    // Create final merged dataset
    const finalData = {};
    
    // Start with all districts from enrollment data
    Object.keys(enrollmentData).forEach(district => {
        finalData[district] = {
            enrollment_trends: [],
            cmas_scores: []
        };
        
        // Add enrollment data
        Object.entries(enrollmentData[district]).forEach(([year, data]) => {
            finalData[district].enrollment_trends.push({
                year: year,
                enrollment: data.enrollment,
                frl: data.frlPercent  // Keep null as null, don't convert to 0
            });
        });
        
        // Sort by year
        finalData[district].enrollment_trends.sort((a, b) => a.year.localeCompare(b.year));
    });
    
    // Add CMAS data - handle case differences
    Object.entries(cmasData).forEach(([cmasDistrict, data]) => {
        // Normalize CMAS district name to match enrollment data format
        let normalizedCmasDistrict = cmasDistrict;
        if (cmasDistrict === cmasDistrict.toUpperCase()) {
            // Convert all-caps to proper case
            normalizedCmasDistrict = cmasDistrict.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
        }
        
        // Try exact match first
        let matchedDistrict = normalizedCmasDistrict;
        
        // If no exact match, try case-insensitive match
        if (!finalData[normalizedCmasDistrict]) {
            const lowerCMAS = normalizedCmasDistrict.toLowerCase();
            matchedDistrict = Object.keys(finalData).find(d => d.toLowerCase() === lowerCMAS);
            
            // If still no match, create new entry with normalized district name
            if (!matchedDistrict) {
                finalData[normalizedCmasDistrict] = {
                    enrollment_trends: [],
                    cmas_scores: data.cmas_scores
                };
                return;
            }
        }
        
        // Merge CMAS scores if district already has some
        if (finalData[matchedDistrict].cmas_scores && finalData[matchedDistrict].cmas_scores.length > 0) {
            // Merge the scores, keeping newer data when there are duplicates
            const existingYears = new Set(finalData[matchedDistrict].cmas_scores.map(s => s.year));
            data.cmas_scores.forEach(score => {
                if (!existingYears.has(score.year)) {
                    finalData[matchedDistrict].cmas_scores.push(score);
                }
            });
            // Sort by year
            finalData[matchedDistrict].cmas_scores.sort((a, b) => a.year.localeCompare(b.year));
        } else {
            // No existing scores, just add all
            finalData[matchedDistrict].cmas_scores = data.cmas_scores;
        }
    });
    
    // Check for districts in CMAS but not in enrollment
    const cmasOnlyDistricts = Object.keys(cmasData).filter(d => !enrollmentData[d]);
    if (cmasOnlyDistricts.length > 0) {
        console.log(`\nDistricts in CMAS but not enrollment data: ${cmasOnlyDistricts.length}`);
        console.log('Examples:', cmasOnlyDistricts.slice(0, 5));
    }
    
    return finalData;
}

// Main execution
function main() {
    console.log('Fixing and merging all Colorado district data...\n');
    
    const finalData = mergeAllDataProperly();
    
    // Save the complete dataset
    const outputPath = path.join(__dirname, '../public/district_data_complete.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
    
    console.log(`\nSaved complete data to: ${outputPath}`);
    console.log(`Total districts: ${Object.keys(finalData).length}`);
    
    // Statistics
    const withBoth = Object.entries(finalData).filter(([_, d]) => 
        d.enrollment_trends.length > 0 && d.cmas_scores.length > 0);
    const enrollOnly = Object.entries(finalData).filter(([_, d]) => 
        d.enrollment_trends.length > 0 && d.cmas_scores.length === 0);
    const cmasOnly = Object.entries(finalData).filter(([_, d]) => 
        d.enrollment_trends.length === 0 && d.cmas_scores.length > 0);
    
    console.log(`\nData coverage:`);
    console.log(`  - Districts with both enrollment and CMAS: ${withBoth.length}`);
    console.log(`  - Districts with enrollment only: ${enrollOnly.length}`);
    console.log(`  - Districts with CMAS only: ${cmasOnly.length}`);
    
    // Show sample
    if (withBoth.length > 0) {
        const [name, data] = withBoth[0];
        console.log(`\nSample district with complete data: ${name}`);
        console.log('  Last 3 years enrollment:');
        data.enrollment_trends.slice(-3).forEach(e => {
            console.log(`    ${e.year}: ${e.enrollment} students, ${e.frl}% FRL`);
        });
        console.log('  CMAS scores:');
        data.cmas_scores.forEach(c => {
            console.log(`    ${c.year}: ${c.met_or_exceeded_pct}%`);
        });
    }
}

if (require.main === module) {
    main();
}

module.exports = { processEnrollmentDataFixed, mergeAllDataProperly };