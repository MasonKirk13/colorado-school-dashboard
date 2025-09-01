#!/usr/bin/env python3
"""
Simple PDF Text Extractor for ACFR files
Uses only built-in Python libraries - no external dependencies required
"""

import os
import sys
import re
from pathlib import Path

def extract_text_with_pdftotext(pdf_path):
    """Try to extract text using pdftotext command (if available)"""
    try:
        import subprocess
        result = subprocess.run(['pdftotext', str(pdf_path), '-'], 
                              capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            return result.stdout
    except Exception as e:
        print(f"pdftotext not available: {e}")
    return None

def extract_text_with_strings(pdf_path):
    """Fallback: extract readable strings from PDF using 'strings' command"""
    try:
        import subprocess
        result = subprocess.run(['strings', str(pdf_path)], 
                              capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            return result.stdout
    except Exception as e:
        print(f"strings command not available: {e}")
    return None

def search_cop_content(text):
    """Search for COP-related content in extracted text"""
    if not text:
        return []
    
    cop_keywords = [
        'certificate of participation',
        'certificates of participation', 
        'long-term debt',
        'outstanding debt',
        'debt service',
        'principal amount',
        'interest rate',
        'maturity date',
        'annual debt service'
    ]
    
    lines = text.split('\n')
    relevant_lines = []
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in cop_keywords):
            # Include some context around the match
            start = max(0, i-2)
            end = min(len(lines), i+3)
            context = lines[start:end]
            relevant_lines.append(f"--- CONTEXT AROUND LINE {i+1} ---")
            relevant_lines.extend(context)
            relevant_lines.append("")
    
    return relevant_lines

def extract_financial_numbers(text):
    """Extract potential financial figures from text"""
    if not text:
        return []
    
    # Look for dollar amounts and percentages
    financial_patterns = [
        r'\$[\d,]+\.?\d*',  # Dollar amounts like $123,456.78
        r'[\d,]+\.?\d*\s*million',  # Numbers with "million"
        r'[\d,]+\.?\d*\s*billion',  # Numbers with "billion" 
        r'\d+\.\d+%',  # Percentages like 4.25%
        r'\d{4}',  # Years like 2024
    ]
    
    findings = []
    for pattern in financial_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            findings.append(f"Pattern '{pattern}': {matches[:10]}")  # Limit to first 10 matches
    
    return findings

def process_pdf_file(pdf_path):
    """Process a single PDF file"""
    pdf_path = Path(pdf_path)
    print(f"\n📄 Processing: {pdf_path.name}")
    print(f"File size: {pdf_path.stat().st_size / (1024*1024):.1f} MB")
    
    # Try different extraction methods
    text = None
    
    # Method 1: pdftotext (best quality)
    print("Trying pdftotext extraction...")
    text = extract_text_with_pdftotext(pdf_path)
    
    # Method 2: strings command (fallback)
    if not text:
        print("Trying strings extraction...")
        text = extract_text_with_strings(pdf_path)
    
    if not text:
        print("❌ Could not extract text from PDF")
        return False
    
    print(f"✅ Extracted {len(text)} characters of text")
    
    # Search for COP-related content
    cop_content = search_cop_content(text)
    financial_numbers = extract_financial_numbers(text)
    
    if not cop_content and not financial_numbers:
        print("⚠️ No COP-related content found")
        return False
    
    # Save results
    output_file = pdf_path.parent / "extracted_cop_content" / f"{pdf_path.stem}_simple_extraction.txt"
    output_file.parent.mkdir(exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"SIMPLE PDF EXTRACTION FROM: {pdf_path.name}\n")
        f.write(f"EXTRACTION DATE: {Path(__file__).stat().st_mtime}\n")
        f.write(f"ORIGINAL FILE SIZE: {pdf_path.stat().st_size / (1024*1024):.1f} MB\n")
        f.write("="*80 + "\n\n")
        
        if cop_content:
            f.write("COP-RELATED CONTENT FOUND:\n")
            f.write("-"*40 + "\n")
            f.write("\n".join(cop_content))
            f.write("\n\n")
        
        if financial_numbers:
            f.write("FINANCIAL PATTERNS FOUND:\n")
            f.write("-"*40 + "\n")
            f.write("\n".join(financial_numbers))
            f.write("\n\n")
        
        # Include a sample of the full text for manual review
        f.write("FULL TEXT SAMPLE (first 5000 characters):\n")
        f.write("-"*40 + "\n")
        f.write(text[:5000])
        if len(text) > 5000:
            f.write(f"\n\n... (truncated, full text was {len(text)} characters)")
    
    print(f"✅ Results saved to: {output_file}")
    return True

def main():
    if len(sys.argv) < 2:
        print("Simple PDF Text Extractor for ACFR files")
        print("Usage:")
        print("  python3 simple_pdf_text_extractor.py <pdf_file>")
        print("  python3 simple_pdf_text_extractor.py <directory_with_pdfs>")
        print("\nThis version uses built-in system tools and doesn't require pip install")
        return
    
    input_path = Path(sys.argv[1])
    
    if input_path.is_file():
        # Process single file
        process_pdf_file(input_path)
    elif input_path.is_dir():
        # Process all PDFs in directory
        pdf_files = list(input_path.glob("*.pdf"))
        if not pdf_files:
            print(f"No PDF files found in {input_path}")
            return
        
        print(f"Found {len(pdf_files)} PDF files")
        success_count = 0
        for pdf_file in pdf_files:
            if process_pdf_file(pdf_file):
                success_count += 1
        
        print(f"\n🎉 Processing complete!")
        print(f"✅ Successfully processed {success_count}/{len(pdf_files)} files")
        print(f"📁 Check results in: extracted_cop_content/")
    else:
        print(f"Invalid path: {input_path}")
        return

if __name__ == "__main__":
    main()