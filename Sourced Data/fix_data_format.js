#!/usr/bin/env node

/**
 * Fix data format issues in the complete dataset
 * - Handle null FRL values
 * - Ensure consistent formatting
 */

const fs = require('fs');
const path = require('path');

function fixDataFormat() {
    const inputPath = path.join(__dirname, '../public/district_data_complete.json');
    const outputPath = path.join(__dirname, '../public/district_data_complete.json');
    
    // Read the data
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    
    let fixedCount = 0;
    
    // Fix each district's data
    Object.keys(data).forEach(district => {
        // Fix enrollment trends
        if (data[district].enrollment_trends) {
            data[district].enrollment_trends = data[district].enrollment_trends.map(trend => {
                if (trend.frl === null || trend.frl === undefined) {
                    // If FRL is null, try to estimate from nearby years or set to 0
                    const validFrls = data[district].enrollment_trends
                        .filter(t => t.frl !== null && t.frl !== undefined)
                        .map(t => t.frl);
                    
                    if (validFrls.length > 0) {
                        // Use average of valid FRL values
                        trend.frl = Math.round(validFrls.reduce((a, b) => a + b, 0) / validFrls.length * 10) / 10;
                    } else {
                        // No valid FRL data, set to 0
                        trend.frl = 0;
                    }
                    fixedCount++;
                }
                return trend;
            });
        }
        
        // Ensure CMAS scores are sorted by year
        if (data[district].cmas_scores) {
            data[district].cmas_scores.sort((a, b) => a.year.localeCompare(b.year));
        }
        
        // Ensure enrollment trends are sorted by year
        if (data[district].enrollment_trends) {
            data[district].enrollment_trends.sort((a, b) => a.year.localeCompare(b.year));
        }
    });
    
    // Save the fixed data
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    
    console.log(`Fixed ${fixedCount} null FRL values`);
    console.log(`Data saved to: ${outputPath}`);
    
    // Show sample of fixed data
    const sampleDistrict = Object.entries(data).find(([_, d]) => 
        d.enrollment_trends.length > 5 && d.cmas_scores.length > 5);
    
    if (sampleDistrict) {
        console.log('\nSample district with complete data:');
        console.log(sampleDistrict[0]);
        console.log('Enrollment (last 3 years):');
        sampleDistrict[1].enrollment_trends.slice(-3).forEach(e => {
            console.log(`  ${e.year}: ${e.enrollment} students, ${e.frl}% FRL`);
        });
        console.log('CMAS scores (last 3 years):');
        sampleDistrict[1].cmas_scores.slice(-3).forEach(c => {
            console.log(`  ${c.year}: ${c.met_or_exceeded_pct}%`);
        });
    }
}

// Run the fix
fixDataFormat();