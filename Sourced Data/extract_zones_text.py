import subprocess
import sys

# Try different methods to read the Word doc
try:
    # Method 1: Try with python-docx
    try:
        from docx import Document
    except ImportError:
        print("python-docx not available")
        
    # Method 2: Try converting with pandoc if available
    try:
        result = subprocess.run(['pandoc', 'Enrollment Zones/School Enrollment Zones.docx', '-t', 'plain'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("=== EXTRACTED TEXT FROM WORD DOCUMENT ===\n")
            print(result.stdout)
    except:
        pass
        
    # Method 3: Try with antiword
    try:
        result = subprocess.run(['antiword', 'Enrollment Zones/School Enrollment Zones.docx'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print(result.stdout)
    except:
        pass
        
    # Method 4: Just look for the file and suggest manual extraction
    import os
    if os.path.exists('Enrollment Zones/School Enrollment Zones.docx'):
        print("\nWord document exists but cannot be read programmatically.")
        print("Please manually extract the zone names that follow patterns like:")
        print('"The schools below are in the [ZONE NAME] zone"')
        
except Exception as e:
    print(f"Error: {e}")