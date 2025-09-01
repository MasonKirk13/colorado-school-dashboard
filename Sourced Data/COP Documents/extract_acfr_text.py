#!/usr/bin/env python3
"""
DPS ACFR PDF Text Extraction Tool
Extracts COP-related sections from large ACFR PDFs for analysis
"""

import os
import sys
import re
from pathlib import Path

try:
    import PyPDF2
    import pdfplumber
except ImportError:
    print("Installing required PDF libraries...")
    os.system("pip install PyPDF2 pdfplumber")
    import PyPDF2
    import pdfplumber

def extract_cop_sections_pdfplumber(pdf_path):
    """Extract COP-related text using pdfplumber (better for tables)"""
    print(f"Processing {pdf_path} with pdfplumber...")
    
    cop_content = []
    keywords = [
        'certificate of participation', 'certificates of participation',
        'long-term debt', 'long term debt', 'debt service',
        'outstanding debt', 'principal amount', 'interest rate',
        'maturity date', 'annual debt service', 'debt burden'
    ]
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if not text:
                    continue
                    
                # Check if page contains COP-related content
                text_lower = text.lower()
                if any(keyword in text_lower for keyword in keywords):
                    cop_content.append(f"\n--- PAGE {page_num} ---\n")
                    cop_content.append(text)
                    
                    # Try to extract tables on this page
                    tables = page.extract_tables()
                    if tables:
                        for i, table in enumerate(tables):
                            cop_content.append(f"\n--- TABLE {i+1} ON PAGE {page_num} ---\n")
                            for row in table:
                                if row:
                                    cop_content.append("\t".join([str(cell) if cell else "" for cell in row]))
                                    cop_content.append("\n")
                    
                print(f"Processed page {page_num}/{len(pdf.pages)}", end='\r')
                
    except Exception as e:
        print(f"Error with pdfplumber: {e}")
        return None
        
    return "\n".join(cop_content) if cop_content else None

def extract_cop_sections_pypdf2(pdf_path):
    """Fallback extraction using PyPDF2"""
    print(f"Processing {pdf_path} with PyPDF2...")
    
    cop_content = []
    keywords = [
        'certificate of participation', 'certificates of participation',
        'long-term debt', 'long term debt', 'debt service'
    ]
    
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page_num, page in enumerate(pdf_reader.pages, 1):
                try:
                    text = page.extract_text()
                    if not text:
                        continue
                        
                    text_lower = text.lower()
                    if any(keyword in text_lower for keyword in keywords):
                        cop_content.append(f"\n--- PAGE {page_num} ---\n")
                        cop_content.append(text)
                        
                    print(f"Processed page {page_num}/{len(pdf_reader.pages)}", end='\r')
                    
                except Exception as page_error:
                    print(f"Error on page {page_num}: {page_error}")
                    continue
                    
    except Exception as e:
        print(f"Error with PyPDF2: {e}")
        return None
        
    return "\n".join(cop_content) if cop_content else None

def process_acfr_file(pdf_path, output_dir):
    """Process a single ACFR file"""
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        print(f"File not found: {pdf_path}")
        return False
        
    print(f"\n📄 Processing: {pdf_path.name}")
    print(f"File size: {pdf_path.stat().st_size / (1024*1024):.1f} MB")
    
    # Try pdfplumber first (better for tables)
    extracted_text = extract_cop_sections_pdfplumber(pdf_path)
    
    # Fallback to PyPDF2 if needed
    if not extracted_text:
        print("Trying PyPDF2 fallback...")
        extracted_text = extract_cop_sections_pypdf2(pdf_path)
    
    if not extracted_text:
        print("❌ No COP-related content found")
        return False
    
    # Save extracted content
    output_file = Path(output_dir) / f"{pdf_path.stem}_COP_extracted.txt"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"EXTRACTED COP CONTENT FROM: {pdf_path.name}\n")
        f.write(f"EXTRACTION DATE: {pd.Timestamp.now()}\n")
        f.write("="*80 + "\n\n")
        f.write(extracted_text)
    
    print(f"✅ Extracted content saved to: {output_file}")
    return True

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python extract_acfr_text.py <pdf_file>")
        print("  python extract_acfr_text.py <directory_with_pdfs>")
        print("\nExample:")
        print("  python extract_acfr_text.py FY24_ACFR.pdf")
        print("  python extract_acfr_text.py ./acfr_files/")
        return
    
    input_path = Path(sys.argv[1])
    output_dir = Path("./extracted_cop_content")
    output_dir.mkdir(exist_ok=True)
    
    if input_path.is_file():
        # Process single file
        process_acfr_file(input_path, output_dir)
    elif input_path.is_dir():
        # Process all PDFs in directory
        pdf_files = list(input_path.glob("*.pdf"))
        if not pdf_files:
            print(f"No PDF files found in {input_path}")
            return
        
        print(f"Found {len(pdf_files)} PDF files")
        for pdf_file in pdf_files:
            process_acfr_file(pdf_file, output_dir)
    else:
        print(f"Invalid path: {input_path}")
        return
    
    print(f"\n🎉 Processing complete!")
    print(f"📁 Check extracted content in: {output_dir}")
    print("\nNext steps:")
    print("1. Review the extracted text files")
    print("2. Look for debt service schedules and COP totals")
    print("3. Use the manual extraction template to organize the data")
    print("4. Run the COP data processor to integrate into the visualization")

if __name__ == "__main__":
    # Add pandas import for timestamp
    try:
        import pandas as pd
    except ImportError:
        import datetime
        pd = type('pd', (), {'Timestamp': datetime.datetime})()
        pd.Timestamp.now = datetime.datetime.now
    
    main()