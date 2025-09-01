#!/usr/bin/env node

/**
 * Simplify CMAS data for the Colorado District Map App
 * Enhanced version that handles multiple years of data
 * 
 * First install xlsx package:
 * npm install xlsx
 * 
 * Usage:
 *   node simplify_cmas_data_multi_year.js                    # Process default 2024 file
 *   node simplify_cmas_data_multi_year.js --dir "path/to/dir" # Process all Excel files in directory
 *   node simplify_cmas_data_multi_year.js --files "file1.xlsx,file2.xlsx" # Process specific files
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        mode: 'single',
        files: [],
        outputFile: 'cmas_district_simplified_multi_year.json'
    };
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--dir' && i + 1 < args.length) {
            options.mode = 'directory';
            options.directory = args[i + 1];
            i++;
        } else if (args[i] === '--files' && i + 1 < args.length) {
            options.mode = 'files';
            options.files = args[i + 1].split(',').map(f => f.trim());
            i++;
        } else if (args[i] === '--output' && i + 1 < args.length) {
            options.outputFile = args[i + 1];
            i++;
        }
    }
    
    return options;
}

// Extract year from filename or use provided year
function extractYearFromFilename(filename) {
    // Try to extract 4-digit year from filename
    const yearMatch = filename.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? yearMatch[0] : null;
}

// Find year columns in headers (e.g., '2024', '2023', '2019')
function findYearColumns(headers) {
    const yearColumns = {};
    headers.forEach((header, idx) => {
        if (header && /^\d{4}$/.test(header.toString())) {
            yearColumns[header.toString()] = idx;
        }
    });
    return yearColumns;
}

// Process a single Excel file
function processCMASFile(filePath, defaultYear = null) {
    console.log(`\nProcessing ${filePath}...`);
    
    const yearFromFilename = extractYearFromFilename(path.basename(filePath));
    
    try {
        const workbook = XLSX.readFile(filePath);
        // Handle 2021 file which has data in second sheet
        let sheetName = workbook.SheetNames[0];
        if (filePath.includes('2021') && workbook.SheetNames.includes('CMAS ELA and Math')) {
            sheetName = 'CMAS ELA and Math';
        }
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
        
        // Get headers and data
        const headers = rawData[headerRowIndex];
        const data = rawData.slice(headerRowIndex + 1);
        
        // Find column indices
        const levelIdx = headers.findIndex(h => h && h.toString() === 'Level');
        const gradeIdx = headers.findIndex(h => h && h.toString() === 'Grade');
        const districtIdx = headers.findIndex(h => h && h.toString() === 'District Name');
        const subjectIdx = headers.findIndex(h => h && h.toString() === 'Content');
        
        // Find year columns
        const yearColumns = findYearColumns(headers);
        console.log('Found year columns:', Object.keys(yearColumns));
        
        // If no year columns found, use the default year or filename year
        const processYear = defaultYear || yearFromFilename;
        
        // Filter for district-level, all-grades data
        const filtered = data.filter(row => 
            row[levelIdx] === 'DISTRICT' && 
            row[gradeIdx] === 'All Grades'
        );
        
        console.log(`Filtered to ${filtered.length} district records`);
        
        // Collect results
        const results = [];
        
        // Process data for each year column found
        if (Object.keys(yearColumns).length > 0) {
            // Multiple year columns in same file
            Object.entries(yearColumns).forEach(([year, colIdx]) => {
                filtered.forEach(row => {
                    const district = row[districtIdx];
                    const subject = row[subjectIdx];
                    const percent = parseFloat(row[colIdx]) || 0;
                    
                    if (district) {
                        results.push({
                            district,
                            subject,
                            year,
                            percent
                        });
                    }
                });
            });
        } else if (processYear) {
            // Single year file - look for percent column
            const pctIdx = headers.findIndex(h => h && h.toString().includes('Percent Met or Exceeded'));
            
            if (pctIdx >= 0) {
                filtered.forEach(row => {
                    const district = row[districtIdx];
                    const subject = row[subjectIdx];
                    const percent = parseFloat(row[pctIdx]) || 0;
                    
                    if (district) {
                        results.push({
                            district,
                            subject,
                            year: processYear,
                            percent
                        });
                    }
                });
            }
        }
        
        return results;
        
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return [];
    }
}

// Combine results from multiple files
function combineResults(allResults) {
    const combined = {};
    
    // Group by district and year
    allResults.forEach(result => {
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
    
    // Calculate averages and format output
    const finalResult = {};
    
    Object.entries(combined).forEach(([district, years]) => {
        const cmasScores = [];
        
        Object.entries(years).forEach(([year, data]) => {
            const avgScore = data.total / data.subjects.length;
            cmasScores.push({
                year: year,
                met_or_exceeded_pct: Math.round(avgScore * 10) / 10
            });
        });
        
        // Sort by year
        cmasScores.sort((a, b) => a.year.localeCompare(b.year));
        
        finalResult[district] = {
            cmas_scores: cmasScores
        };
    });
    
    return finalResult;
}

// Main execution
async function main() {
    const options = parseArgs();
    let filesToProcess = [];
    
    // Determine which files to process
    if (options.mode === 'directory') {
        const files = fs.readdirSync(options.directory);
        filesToProcess = files
            .filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
            .map(f => path.join(options.directory, f));
    } else if (options.mode === 'files') {
        filesToProcess = options.files;
    } else {
        // Default: process the 2024 file
        const defaultFile = path.join(__dirname, 'General CMAS Score Data', '2024 CMAS ELA and Math District and School Summary Results.xlsx');
        if (fs.existsSync(defaultFile)) {
            filesToProcess = [defaultFile];
        } else {
            console.error('No files specified and default file not found.');
            process.exit(1);
        }
    }
    
    console.log(`Processing ${filesToProcess.length} file(s)...`);
    
    // Process all files
    const allResults = [];
    for (const file of filesToProcess) {
        const results = processCMASFile(file);
        allResults.push(...results);
    }
    
    // Combine and save results
    const finalData = combineResults(allResults);
    
    // Save to JSON
    const outputPath = path.join(__dirname, options.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
    
    console.log(`\nSaved combined data to ${outputPath}`);
    console.log(`Processed ${Object.keys(finalData).length} districts`);
    
    // Show sample with multiple years
    const sampleDistricts = Object.entries(finalData)
        .filter(([_, data]) => data.cmas_scores.length > 1)
        .slice(0, 2);
    
    if (sampleDistricts.length > 0) {
        console.log('\nSample data with trends:');
        sampleDistricts.forEach(([district, data]) => {
            console.log(`\n${district}:`);
            console.log(JSON.stringify(data, null, 2));
        });
    }
}

// Run the main function
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { processCMASFile, combineResults };