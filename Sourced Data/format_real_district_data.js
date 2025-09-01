#!/usr/bin/env node

/**
 * Format real CMAS data to match the app's expected structure
 * Adds empty enrollment_trends arrays since we don't have enrollment data
 */

const fs = require('fs');
const path = require('path');

function formatRealDistrictData(cmasDataPath, outputPath) {
    console.log('Formatting real district data...');
    
    try {
        // Read CMAS data
        const cmasData = JSON.parse(fs.readFileSync(cmasDataPath, 'utf8'));
        console.log(`Loaded CMAS data for ${Object.keys(cmasData).length} districts`);
        
        // Format data to match app structure
        const formattedData = {};
        
        Object.entries(cmasData).forEach(([districtName, data]) => {
            formattedData[districtName] = {
                enrollment_trends: [], // Empty array since we don't have enrollment data
                cmas_scores: data.cmas_scores
            };
        });
        
        // Save formatted data
        fs.writeFileSync(outputPath, JSON.stringify(formattedData, null, 2));
        
        console.log(`\nFormatted data saved to: ${outputPath}`);
        console.log(`Total districts: ${Object.keys(formattedData).length}`);
        
        // Show sample
        const sampleDistricts = Object.entries(formattedData).slice(0, 3);
        console.log('\nSample data:');
        sampleDistricts.forEach(([name, data]) => {
            console.log(`\n${name}:`);
            console.log(`  - Enrollment trends: ${data.enrollment_trends.length} entries`);
            console.log(`  - CMAS scores: ${data.cmas_scores.length} years`);
            console.log(`  - Years: ${data.cmas_scores.map(s => s.year).join(', ')}`);
        });
        
    } catch (error) {
        console.error('Error formatting data:', error.message);
        process.exit(1);
    }
}

// Main execution
if (require.main === module) {
    const cmasDataPath = path.join(__dirname, 'cmas_district_simplified_multi_year.json');
    const outputPath = path.join(__dirname, '../public/district_data_combined.json');
    
    if (!fs.existsSync(cmasDataPath)) {
        console.error(`CMAS data file not found: ${cmasDataPath}`);
        console.error('Please run simplify_cmas_data_multi_year.js first');
        process.exit(1);
    }
    
    // Create backup of existing file
    if (fs.existsSync(outputPath)) {
        const backupPath = outputPath.replace('.json', '_backup_mock_data.json');
        fs.copyFileSync(outputPath, backupPath);
        console.log(`Created backup of existing data at: ${backupPath}`);
    }
    
    formatRealDistrictData(cmasDataPath, outputPath);
}

module.exports = { formatRealDistrictData };