#!/usr/bin/env python3
"""
Batch COP Data Extraction from Multiple ACFR Years
Processes multiple years of ACFR files and creates structured output
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime

def extract_financial_patterns(text):
    """Extract financial data using regex patterns"""
    
    patterns = {
        'total_cop_debt': [
            r'total.*certificate.*participation.*?[\$\s]*([0-9,]+)',
            r'certificate.*participation.*total.*?[\$\s]*([0-9,]+)',
            r'outstanding.*cop.*debt.*?[\$\s]*([0-9,]+)',
        ],
        'debt_service': [
            r'debt\s+service.*?[\$\s]*([0-9,]+)',
            r'annual.*debt.*service.*?[\$\s]*([0-9,]+)',
            r'principal.*interest.*total.*?[\$\s]*([0-9,]+)',
        ],
        'individual_cops': [
            r'(EA|EP|ER|ES|MD|MS)\s*\d+.*?[\$\s]*([0-9,]+)',
            r'series\s+(EA|EP|ER|ES|MD|MS).*?[\$\s]*([0-9,]+)',
        ],
        'interest_rates': [
            r'(\d+\.\d+)%.*interest',
            r'interest.*rate.*?(\d+\.\d+)%',
        ],
        'maturity_dates': [
            r'matur\w+.*?(\d{4})',
            r'due.*?(\d{1,2}/\d{1,2}/\d{4})',
        ]
    }
    
    results = {}
    text_lower = text.lower()
    
    for category, pattern_list in patterns.items():
        matches = []
        for pattern in pattern_list:
            found = re.findall(pattern, text_lower, re.IGNORECASE | re.MULTILINE)
            matches.extend(found)
        
        results[category] = matches
    
    return results

def parse_debt_tables(text):
    """Look for structured debt tables"""
    
    # Common table headers for COP debt
    table_indicators = [
        'certificate of participation',
        'outstanding debt',
        'debt service schedule',
        'principal amount',
        'maturity date'
    ]
    
    lines = text.split('\n')
    table_sections = []
    current_section = []
    in_table = False
    
    for line in lines:
        line_lower = line.lower().strip()
        
        # Check if this line indicates a debt table
        if any(indicator in line_lower for indicator in table_indicators):
            if current_section:
                table_sections.append('\n'.join(current_section))
                current_section = []
            in_table = True
            current_section.append(line)
        elif in_table:
            # Continue collecting table data
            if line.strip():
                current_section.append(line)
            else:
                # Empty line might end the table
                if len(current_section) > 5:  # Only keep substantial sections
                    table_sections.append('\n'.join(current_section))
                current_section = []
                in_table = False
    
    # Don't forget the last section
    if current_section and len(current_section) > 5:
        table_sections.append('\n'.join(current_section))
    
    return table_sections

def analyze_extracted_file(file_path):
    """Analyze a single extracted text file for COP data"""
    
    print(f"Analyzing: {file_path.name}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None
    
    # Extract year from filename
    year_match = re.search(r'(20\d{2})', file_path.name)
    fiscal_year = year_match.group(1) if year_match else "Unknown"
    
    # Extract financial patterns
    financial_data = extract_financial_patterns(content)
    
    # Extract table sections
    table_sections = parse_debt_tables(content)
    
    # Create summary
    summary = {
        'fiscal_year': fiscal_year,
        'source_file': file_path.name,
        'analysis_date': datetime.now().isoformat(),
        'financial_patterns': financial_data,
        'table_sections': table_sections,
        'raw_content_length': len(content),
        'recommendations': []
    }
    
    # Add recommendations based on findings
    if financial_data['total_cop_debt']:
        summary['recommendations'].append("Found potential total COP debt figures")
    if financial_data['debt_service']:
        summary['recommendations'].append("Found debt service amounts")
    if table_sections:
        summary['recommendations'].append(f"Found {len(table_sections)} potential debt tables")
    if not any(financial_data.values()):
        summary['recommendations'].append("Consider manual review - no clear patterns found")
    
    return summary

def create_multi_year_analysis(extracted_files_dir):
    """Create comprehensive analysis across multiple years"""
    
    extracted_dir = Path(extracted_files_dir)
    if not extracted_dir.exists():
        print(f"Directory not found: {extracted_dir}")
        return
    
    # Find all extracted text files
    text_files = list(extracted_dir.glob("*_COP_extracted.txt"))
    if not text_files:
        print("No extracted text files found. Run extract_acfr_text.py first.")
        return
    
    print(f"Found {len(text_files)} extracted files")
    
    # Analyze each file
    all_analyses = []
    for text_file in sorted(text_files):
        analysis = analyze_extracted_file(text_file)
        if analysis:
            all_analyses.append(analysis)
    
    # Create comprehensive report
    report = {
        'analysis_summary': {
            'total_files_analyzed': len(all_analyses),
            'year_range': f"{min(a['fiscal_year'] for a in all_analyses)} - {max(a['fiscal_year'] for a in all_analyses)}",
            'analysis_date': datetime.now().isoformat()
        },
        'yearly_analyses': all_analyses,
        'cross_year_patterns': analyze_cross_year_patterns(all_analyses)
    }
    
    # Save comprehensive report
    report_file = extracted_dir / "comprehensive_cop_analysis.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"✅ Comprehensive analysis saved to: {report_file}")
    
    # Create human-readable summary
    create_readable_summary(report, extracted_dir)
    
    return report

def analyze_cross_year_patterns(analyses):
    """Look for patterns across multiple years"""
    
    patterns = {
        'years_with_cop_data': [],
        'debt_growth_indicators': [],
        'common_cop_series': set(),
        'data_quality_by_year': {}
    }
    
    for analysis in analyses:
        year = analysis['fiscal_year']
        
        # Track years with COP data
        if any(analysis['financial_patterns'].values()):
            patterns['years_with_cop_data'].append(year)
        
        # Track COP series found
        for match in analysis['financial_patterns'].get('individual_cops', []):
            if isinstance(match, tuple) and len(match) >= 2:
                patterns['common_cop_series'].add(match[0])
        
        # Assess data quality
        quality_score = 0
        quality_score += len(analysis['financial_patterns']['total_cop_debt'])
        quality_score += len(analysis['financial_patterns']['debt_service'])
        quality_score += len(analysis['table_sections'])
        
        patterns['data_quality_by_year'][year] = quality_score
    
    patterns['common_cop_series'] = list(patterns['common_cop_series'])
    
    return patterns

def create_readable_summary(report, output_dir):
    """Create a human-readable summary report"""
    
    summary_file = Path(output_dir) / "COP_Analysis_Summary.txt"
    
    with open(summary_file, 'w') as f:
        f.write("DPS CERTIFICATE OF PARTICIPATION (COP) ANALYSIS SUMMARY\n")
        f.write("=" * 60 + "\n\n")
        
        f.write(f"Analysis Date: {report['analysis_summary']['analysis_date']}\n")
        f.write(f"Files Analyzed: {report['analysis_summary']['total_files_analyzed']}\n")
        f.write(f"Year Range: {report['analysis_summary']['year_range']}\n\n")
        
        f.write("FINDINGS BY YEAR:\n")
        f.write("-" * 30 + "\n")
        
        for analysis in sorted(report['yearly_analyses'], key=lambda x: x['fiscal_year']):
            year = analysis['fiscal_year']
            f.write(f"\nFY {year}:\n")
            
            # Count findings
            total_debt_refs = len(analysis['financial_patterns']['total_cop_debt'])
            debt_service_refs = len(analysis['financial_patterns']['debt_service'])
            table_count = len(analysis['table_sections'])
            
            f.write(f"  - Total debt references: {total_debt_refs}\n")
            f.write(f"  - Debt service references: {debt_service_refs}\n")
            f.write(f"  - Potential debt tables: {table_count}\n")
            
            if analysis['recommendations']:
                f.write(f"  - Status: {', '.join(analysis['recommendations'])}\n")
        
        # Cross-year patterns
        patterns = report['cross_year_patterns']
        f.write(f"\nCROSS-YEAR PATTERNS:\n")
        f.write("-" * 30 + "\n")
        f.write(f"Years with COP data: {', '.join(patterns['years_with_cop_data'])}\n")
        f.write(f"Common COP series found: {', '.join(patterns['common_cop_series'])}\n")
        
        f.write(f"\nDATA QUALITY SCORES BY YEAR:\n")
        f.write("-" * 30 + "\n")
        for year, score in sorted(patterns['data_quality_by_year'].items()):
            f.write(f"FY {year}: {score} (higher = more data found)\n")
        
        f.write(f"\nRECOMMENDATIONS:\n")
        f.write("-" * 30 + "\n")
        f.write("1. Focus manual extraction on years with highest quality scores\n")
        f.write("2. Look for debt service schedules in table sections\n")
        f.write("3. Cross-reference COP series across multiple years\n")
        f.write("4. Pay attention to years showing significant debt increases\n")
        
        f.write(f"\nNEXT STEPS:\n")
        f.write("-" * 30 + "\n")
        f.write("1. Review individual extracted files for the most promising years\n")
        f.write("2. Use manual extraction templates for detailed data entry\n")
        f.write("3. Focus on total outstanding debt and annual debt service figures\n")
        f.write("4. Update the COP data processor with real financial data\n")
    
    print(f"✅ Readable summary saved to: {summary_file}")

def main():
    # Default to looking in extracted_cop_content directory
    extracted_dir = Path("./extracted_cop_content")
    
    if not extracted_dir.exists():
        print("Run extract_acfr_text.py first to extract COP content from ACFR files")
        print("\nUsage:")
        print("1. python extract_acfr_text.py <directory_with_acfr_pdfs>")
        print("2. python batch_extract_cop_data.py")
        return
    
    print("🔍 Analyzing extracted COP content for patterns...")
    report = create_multi_year_analysis(extracted_dir)
    
    if report:
        print(f"\n📊 Analysis complete!")
        print(f"📁 Check the comprehensive_cop_analysis.json and COP_Analysis_Summary.txt files")
        print(f"\n🎯 Next steps:")
        print("1. Review the summary to identify years with the best data")
        print("2. Manually extract specific financial figures from those years")
        print("3. Use the COP data collection template to organize the data")
        print("4. Run the data processor to integrate into the visualization")

if __name__ == "__main__":
    main()