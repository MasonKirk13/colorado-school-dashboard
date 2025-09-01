#!/usr/bin/env node

/**
 * Merge CMAS data with existing district data
 * Combines enrollment trends and CMAS scores into a single file
 */

const fs = require('fs');
const path = require('path');

function mergeDistrictData(existingDataPath, cmasDataPath, outputPath) {
    console.log('Merging district data...');
    
    try {
        // Read existing district data
        const existingData = JSON.parse(fs.readFileSync(existingDataPath, 'utf8'));
        console.log(`Loaded existing data for ${Object.keys(existingData).length} districts`);
        
        // Read CMAS data
        const cmasData = JSON.parse(fs.readFileSync(cmasDataPath, 'utf8'));
        console.log(`Loaded CMAS data for ${Object.keys(cmasData).length} districts`);
        
        // Merge data
        let matchedCount = 0;
        let notFoundDistricts = [];
        
        Object.entries(cmasData).forEach(([districtName, data]) => {
            // Try exact match first
            if (existingData[districtName]) {
                existingData[districtName].cmas_scores = data.cmas_scores;
                matchedCount++;
            } else {
                // Try fuzzy matching
                const fuzzyMatch = Object.keys(existingData).find(existingName => 
                    existingName.toLowerCase() === districtName.toLowerCase() ||
                    existingName.includes(districtName) ||
                    districtName.includes(existingName)
                );
                
                if (fuzzyMatch) {
                    console.log(`Fuzzy matched: "${districtName}" → "${fuzzyMatch}"`);
                    existingData[fuzzyMatch].cmas_scores = data.cmas_scores;
                    matchedCount++;
                } else {
                    // Add new district with only CMAS data
                    existingData[districtName] = {
                        enrollment_trends: [],
                        cmas_scores: data.cmas_scores
                    };
                    notFoundDistricts.push(districtName);
                }
            }
        });
        
        // Save merged data
        fs.writeFileSync(outputPath, JSON.stringify(existingData, null, 2));
        
        console.log(`\nMerge complete!`);
        console.log(`- Matched ${matchedCount} districts with existing data`);
        console.log(`- Added ${notFoundDistricts.length} new districts (CMAS data only)`);
        
        if (notFoundDistricts.length > 0 && notFoundDistricts.length < 20) {
            console.log('\nNew districts added:');
            notFoundDistricts.forEach(d => console.log(`  - ${d}`));
        }
        
        console.log(`\nSaved merged data to: ${outputPath}`);
        
        // Show sample of merged data
        const sampleDistrict = Object.entries(existingData)
            .find(([_, data]) => data.enrollment_trends.length > 0 && data.cmas_scores && data.cmas_scores.length > 0);
        
        if (sampleDistrict) {
            console.log('\nSample merged district data:');
            console.log(`${sampleDistrict[0]}:`);
            console.log(JSON.stringify(sampleDistrict[1], null, 2));
        }
        
    } catch (error) {
        console.error('Error merging data:', error.message);
        process.exit(1);
    }
}

// Main execution
if (require.main === module) {
    const existingDataPath = path.join(__dirname, '../public/district_data_combined.json');
    const cmasDataPath = path.join(__dirname, 'cmas_district_simplified_multi_year.json');
    const outputPath = path.join(__dirname, '../public/district_data_combined_with_trends.json');
    
    // Check if files exist
    if (!fs.existsSync(existingDataPath)) {
        console.error(`Existing data file not found: ${existingDataPath}`);
        process.exit(1);
    }
    
    if (!fs.existsSync(cmasDataPath)) {
        console.error(`CMAS data file not found: ${cmasDataPath}`);
        console.error('Please run simplify_cmas_data_multi_year.js first');
        process.exit(1);
    }
    
    mergeDistrictData(existingDataPath, cmasDataPath, outputPath);
}

module.exports = { mergeDistrictData };