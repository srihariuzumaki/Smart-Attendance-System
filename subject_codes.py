import re
from typing import Dict, List, TypedDict

class SubjectInfo(TypedDict):
    code: str
    name: str
    semester: str
    scheme: str
    branch: str

def parse_subject_codes(content: str) -> Dict[str, List[SubjectInfo]]:
    """
    Parse the subject codes from the content string and organize them by semester and branch
    Returns a dictionary with key format:
    - For sem 1-2: 'semester_group' (e.g., '1_cse_physics')
    - For sem 3-8: 'semester' (e.g., '3')
    """
    subjects_by_group = {}
    current_group = None
    current_semester = None
    current_scheme = None
    
    lines = content.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for group header (1st and 2nd sem)
        if "CSE Stream" in line and ("Physics Group" in line or "Chemistry Group" in line):
            if "Physics Group" in line:
                current_group = "cse_physics"
            else:
                current_group = "cse_chemistry"
            
            # Extract scheme year from the header
            scheme_match = re.search(r'(\d{4})\s+scheme', line, re.IGNORECASE)
            if scheme_match:
                current_scheme = scheme_match.group(1)
            continue
            
        # Check for semester header with scheme
        sem_scheme_match = re.search(r'VTU CSE (\d+) Sem (\d{4}) scheme', line)
        if sem_scheme_match:
            current_semester = sem_scheme_match.group(1)
            current_scheme = sem_scheme_match.group(2)
            continue
            
        # Check for standalone semester
        semester_match = re.search(r'(\d+)\s*Semester', line)
        if semester_match:
            current_semester = semester_match.group(1)
            continue
            
        # Check for scheme year in other sections
        if "scheme" in line.lower():
            scheme_match = re.search(r'(\d{4})', line)
            if scheme_match:
                current_scheme = scheme_match.group(1)
            continue
            
        # Parse subject entry - handle both tab-separated and space-separated formats
        if line.startswith('B') or line.startswith('21'):  # Handle both B* and 21* subject codes
            # Split by tabs first, if that doesn't work well, try splitting by multiple spaces
            parts = line.split('\t')
            if len(parts) < 2:
                parts = re.split(r'\s{2,}', line)
                
            if len(parts) >= 2:
                subject_code = parts[0].strip()
                subject_name = parts[1].strip()
                
                if current_semester and current_scheme:
                    # For 1st and 2nd semester, use group-based keys
                    if current_semester in ['1', '2'] and current_group:
                        group_key = f"{current_semester}_{current_group}"
                    else:
                        # For 3rd semester onwards, use just the semester as key
                        group_key = current_semester
                        
                    if group_key not in subjects_by_group:
                        subjects_by_group[group_key] = []
                        
                    subjects_by_group[group_key].append({
                        "code": subject_code,
                        "name": subject_name,
                        "semester": current_semester,
                        "scheme": current_scheme,
                        "branch": "CS"  # Changed from CSE to CS to match the format in subcodes.md
                    })
                
    return subjects_by_group

def get_subjects_for_semester(semester: str, group: str, subjects_data: Dict[str, List[SubjectInfo]], scheme: str = "2022") -> List[SubjectInfo]:
    """
    Get subjects for a specific semester, group, and scheme
    For semesters 1-2: Uses group parameter
    For semesters 3-8: Ignores group parameter
    """
    if semester in ['1', '2']:
        group_key = f"{semester}_{group}"
    else:
        group_key = semester
        
    subjects = subjects_data.get(group_key, [])
    
    # Filter subjects by scheme
    return [subject for subject in subjects if subject['scheme'] == scheme] 