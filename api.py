from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
from datetime import date, datetime
import io
import os
import sqlite3
from contextlib import contextmanager
import hashlib
import re
import xlsxwriter  
from subject_codes import parse_subject_codes, get_subjects_for_semester

app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Define subjects for each department
DEPARTMENT_SUBJECTS = {
    'cse': ['Python Programming', 'Data Structures', 'Database Management', 'Computer Networks', 'Operating Systems'],
    'ece': ['Digital Electronics', 'Signals and Systems', 'Communication Systems', 'VLSI Design', 'Microprocessors'],
    'ise': ['Information Security', 'Software Engineering', 'Web Technologies', 'Cloud Computing', 'AI & ML'],
    'mech': ['Thermodynamics', 'Machine Design', 'Fluid Mechanics', 'Manufacturing Process', 'Engineering Materials']
}

DATABASE_FILE = 'attendance.db'

# Load subject codes from file
SUBJECT_CODES_FILE = os.path.join(os.path.dirname(__file__), 'subcodes.md')
with open(SUBJECT_CODES_FILE, 'r') as f:
    SUBJECTS_DATA = parse_subject_codes(f.read())

def migrate_database():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Check if subject_name column exists in section_mapping
            cursor.execute("PRAGMA table_info(section_mapping)")
            columns = [col['name'] for col in cursor.fetchall()]
            
            if 'subject_name' not in columns:
                print("Migrating section_mapping table...")
                # Create temporary table with new schema
                cursor.execute('''
                    CREATE TABLE section_mapping_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        faculty_id TEXT NOT NULL,
                        department TEXT NOT NULL,
                        semester TEXT NOT NULL,
                        section TEXT NOT NULL,
                        subject_code TEXT NOT NULL,
                        subject_name TEXT NOT NULL,
                        academic_year TEXT NOT NULL,
                        FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
                        UNIQUE(department, semester, section, subject_code, academic_year)
                    )
                ''')
                
                # Copy data from old table to new table
                cursor.execute('''
                    INSERT INTO section_mapping_new 
                    (faculty_id, department, semester, section, subject_code, subject_name, academic_year)
                    SELECT faculty_id, department, semester, section, subject, subject, academic_year
                    FROM section_mapping
                ''')
                
                # Drop old table and rename new table
                cursor.execute('DROP TABLE section_mapping')
                cursor.execute('ALTER TABLE section_mapping_new RENAME TO section_mapping')
                
                print("Section mapping table migration completed")
            
            # Check if attendance table needs migration
            cursor.execute("PRAGMA table_info(attendance)")
            columns = [col['name'] for col in cursor.fetchall()]
            
            if 'subject_code' not in columns:
                print("Migrating attendance table...")
                # Create temporary table with new schema
                cursor.execute('''
                    CREATE TABLE attendance_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        USN TEXT NOT NULL,
                        Date TEXT NOT NULL,
                        subject_code TEXT NOT NULL,
                        Present BOOLEAN NOT NULL,
                        department TEXT NOT NULL,
                        semester TEXT NOT NULL,
                        section TEXT NOT NULL,
                        AcademicYear TEXT NOT NULL,
                        FOREIGN KEY (USN) REFERENCES students(USN),
                        UNIQUE(USN, Date, subject_code, section)
                    )
                ''')
                
                # Copy data from old table to new table
                cursor.execute('''
                    INSERT INTO attendance_new 
                    (USN, Date, subject_code, Present, department, semester, section, AcademicYear)
                    SELECT USN, Date, Subject, Present, Department, Semester, Section, AcademicYear
                    FROM attendance
                ''')
                
                # Drop old table and rename new table
                cursor.execute('DROP TABLE attendance')
                cursor.execute('ALTER TABLE attendance_new RENAME TO attendance')
                
                print("Attendance table migration completed")
            
            conn.commit()
            print("Database migration completed successfully")
            
    except Exception as e:
        print(f"Error during migration: {e}")
        raise

def init_db():
    with sqlite3.connect(DATABASE_FILE) as conn:
        cursor = conn.cursor()
        
        # Create students table with all required columns
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS students (
                USN TEXT PRIMARY KEY,
                Name TEXT NOT NULL,
                Department TEXT NOT NULL,
                Semester TEXT NOT NULL,
                Section TEXT NOT NULL,
                AcademicYear TEXT NOT NULL
            )
        ''')
        
        # Create faculty table with password field
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS faculty (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                faculty_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                department TEXT NOT NULL,
                designation TEXT NOT NULL,
                joining_date TEXT NOT NULL,
                password_hash TEXT NOT NULL
            )
        ''')
        
        # Create section_mapping table to map faculty to sections
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS section_mapping (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                faculty_id TEXT NOT NULL,
                department TEXT NOT NULL,
                semester TEXT NOT NULL,
                section TEXT NOT NULL,
                subject_code TEXT NOT NULL,
                subject_name TEXT NOT NULL,
                academic_year TEXT NOT NULL,
                FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
                UNIQUE(department, semester, section, subject_code, academic_year)
            )
        ''')
        
        # Create attendance table with Section field and updated unique constraint
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                USN TEXT NOT NULL,
                Date TEXT NOT NULL,
                subject_code TEXT NOT NULL,
                Present BOOLEAN NOT NULL,
                department TEXT NOT NULL,
                semester TEXT NOT NULL,
                section TEXT NOT NULL,
                AcademicYear TEXT NOT NULL,
                FOREIGN KEY (USN) REFERENCES students(USN),
                UNIQUE(USN, Date, subject_code, section)
            )
        ''')
        
        conn.commit()
        print("Database initialized successfully with all required tables and columns.")
        
    # Run migration after initialization
    migrate_database()

def verify_database():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Check if all required tables exist
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name IN ('students', 'faculty', 'section_mapping', 'attendance')
            """)
            existing_tables = set(row['name'] for row in cursor.fetchall())
            required_tables = {'students', 'faculty', 'section_mapping', 'attendance'}
            
            missing_tables = required_tables - existing_tables
            if missing_tables:
                print(f"Warning: Missing tables: {missing_tables}")
                init_db()  # Initialize only if tables are missing
                return
            
            # Verify attendance table structure
            cursor.execute('PRAGMA table_info(attendance)')
            columns = {row['name'] for row in cursor.fetchall()}
            required_columns = {
                'id', 'USN', 'Date', 'Subject', 'Present', 
                'Department', 'Semester', 'Section', 'AcademicYear'
            }
            
            if not required_columns.issubset(columns):
                missing_columns = required_columns - columns
                print(f"Warning: Attendance table is missing columns: {missing_columns}")
                print("Please backup your data and contact system administrator to fix the database schema.")
                return
            
            print("Database verification completed successfully")
            
    except sqlite3.Error as e:
        print(f"Database verification failed: {e}")
        init_db()  # Initialize only on complete database failure

@contextmanager
def get_db():
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def attendance_exists(department, semester, subject, date_to_check):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT COUNT(*) FROM attendance 
            WHERE Department = ? AND Semester = ? AND Subject = ? AND Date = ?
        ''', (department, semester, subject, date_to_check))
        count = cursor.fetchone()[0]
        return count > 0

@app.route('/api/departments', methods=['GET'])
def get_departments():
    return jsonify(list(DEPARTMENT_SUBJECTS.keys()))

@app.route('/api/subjects/<department>', methods=['GET'])
def get_subjects(department):
    semester = request.args.get('semester')
    group = request.args.get('group', 'cse_physics')  # Default to physics group
    scheme = request.args.get('scheme', '2022')  # Default to 2022 scheme
    
    if not semester:
        return jsonify([])
    
    try:
        subjects = get_subjects_for_semester(semester, group, SUBJECTS_DATA, scheme)
        return jsonify([{
            'code': subject['code'],
            'name': subject['name'],
            'semester': subject['semester'],
            'scheme': subject['scheme'],
            'branch': subject['branch']
        } for subject in subjects])
    except Exception as e:
        print(f"Error fetching subjects: {str(e)}")
        return jsonify({'error': str(e)}), 500

def validate_student_data(df, section_mapping=None):
    errors = []
    
    print("\nValidating DataFrame:")
    print("Shape:", df.shape)
    print("Columns:", df.columns.tolist())
    print("First few rows:")
    print(df.head())
    
    if section_mapping:
        print("\nSection Mapping:", section_mapping)
    
    # Check for empty values
    for col in df.columns:
        empty_rows = df[df[col].isna() | (df[col].astype(str).str.strip() == '')].index.tolist()
        if empty_rows:
            error_msg = f"Empty values in {col} at rows: {', '.join(map(str, [i+2 for i in empty_rows]))}"
            print(error_msg)
            errors.append(error_msg)
    
    # Validate USN format with detailed error reporting
    invalid_usn_rows = []
    usn_pattern = r'^\d[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{3}$'  # Pattern for format like 3PG22CS107
    for idx, usn in enumerate(df['USN']):
        usn_str = str(usn).strip().upper()  # Convert to uppercase for validation
        if not re.match(usn_pattern, usn_str):
            invalid_usn_rows.append(idx)
            print(f"Invalid USN format at row {idx+2}: '{usn_str}' - Expected format: 3PG22CS107")
    
    if invalid_usn_rows:
        error_msg = f"Invalid USN format at rows: {', '.join(map(str, [i+2 for i in invalid_usn_rows]))}"
        print(error_msg)
        errors.append(error_msg)
    
    # If section mapping is provided, validate against it
    if section_mapping:
        # Validate Department matches
        invalid_dept = df[df['Department'].str.lower() != section_mapping['department'].lower()].index.tolist()
        if invalid_dept:
            error_msg = f"Department must be {section_mapping['department']} at rows: {', '.join(map(str, [i+2 for i in invalid_dept]))}"
            print(error_msg)
            errors.append(error_msg)
        
        # Validate Semester matches
        invalid_sem = df[df['Semester'].astype(str) != str(section_mapping['semester'])].index.tolist()
        if invalid_sem:
            error_msg = f"Semester must be {section_mapping['semester']} at rows: {', '.join(map(str, [i+2 for i in invalid_sem]))}"
            print(error_msg)
            errors.append(error_msg)
        
        # Validate Academic Year matches
        invalid_year = df[df['AcademicYear'] != section_mapping['academic_year']].index.tolist()
        if invalid_year:
            error_msg = f"Academic Year must be {section_mapping['academic_year']} at rows: {', '.join(map(str, [i+2 for i in invalid_year]))}"
            print(error_msg)
            errors.append(error_msg)
    
    print(f"\nValidation completed with {len(errors)} errors")
    return errors

@app.route('/api/upload-students/preview', methods=['POST'])
def preview_students():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    section_mapping_id = request.form.get('section_mapping_id')
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not section_mapping_id:
        return jsonify({'error': 'Section mapping ID is required'}), 400

    try:
        print(f"\nProcessing file: {file.filename}")
        print(f"Section mapping ID: {section_mapping_id}")
        
        # First get the section mapping details
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT department, semester, section, academic_year
                FROM section_mapping
                WHERE id = ?
            ''', (section_mapping_id,))
            
            mapping = cursor.fetchone()
            if not mapping:
                print(f"Invalid section mapping ID: {section_mapping_id}")
                return jsonify({'error': 'Invalid section mapping ID'}), 400
            
            mapping = dict(mapping)
            print(f"Section mapping details: {mapping}")

        # Read the file with headers
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file, dtype=str)
            print("File read as CSV with headers")
        else:
            df = pd.read_excel(file, engine='openpyxl', dtype=str)
            print("File read as Excel with headers")
        
        print("\nInitial DataFrame:")
        print(df.head())
        print("\nColumns:", df.columns.tolist())
        
        # Validate data and check if it matches the section mapping
        errors = validate_student_data(df, mapping)
        if errors:
            print("\nValidation errors:", errors)
            return jsonify({
                'error': 'Validation failed',
                'errors': errors,
                'data': df.to_dict('records')  # Include the data for debugging
            }), 400
        
        # Standardize the data
        df['Department'] = df['Department'].str.lower()
        df['USN'] = df['USN'].str.upper()
        
        # Add section information
        df['Section'] = mapping['section']
        
        # Convert DataFrame to list of dictionaries
        students = df.to_dict('records')
        
        print("\nProcessed successfully!")
        return jsonify({
            'students': students,
            'total_records': len(students),
            'section_info': mapping
        })
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/upload-students', methods=['POST'])
def upload_students():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    section_mapping_id = request.form.get('section_mapping_id')
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not section_mapping_id:
        return jsonify({'error': 'Section mapping ID is required'}), 400

    try:
        print("\nProcessing student upload:")
        print(f"File: {file.filename}")
        print(f"Section mapping ID: {section_mapping_id}")
        
        # First get the section mapping details
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT department, semester, section, academic_year
                FROM section_mapping
                WHERE id = ?
            ''', (section_mapping_id,))
            
            mapping = cursor.fetchone()
            if not mapping:
                print(f"Invalid section mapping ID: {section_mapping_id}")
                return jsonify({'error': 'Invalid section mapping ID'}), 400
            
            mapping = dict(mapping)
            print(f"Section mapping details: {mapping}")

        # Read the file with headers
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file, dtype=str)
            print("File read as CSV with headers")
        else:
            df = pd.read_excel(file, engine='openpyxl', dtype=str)
            print("File read as Excel with headers")
        
        print("\nInitial DataFrame:")
        print(df.head())
        print("\nColumns:", df.columns.tolist())
        
        # Validate data
        errors = validate_student_data(df, mapping)
        if errors:
            print("\nValidation errors:", errors)
            return jsonify({
                'error': 'Validation failed',
                'errors': errors
            }), 400
        
        # Standardize data
        df['Department'] = df['Department'].str.lower()
        df['USN'] = df['USN'].str.upper()
        df['Section'] = mapping['section']  # Add section from mapping
        
        print("\nPrepared data for insertion:")
        print(df.head())
        
        # Insert students into database
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Begin transaction
            cursor.execute('BEGIN TRANSACTION')
            
            try:
                # Check for duplicate USNs
                usns = df['USN'].tolist()
                placeholders = ','.join(['?' for _ in usns])
                cursor.execute(f'''
                    SELECT USN 
                    FROM students 
                    WHERE USN IN ({placeholders})
                ''', usns)
                
                existing_usns = set(row['USN'] for row in cursor.fetchall())
                if existing_usns:
                    print(f"\nFound duplicate USNs: {existing_usns}")
                    return jsonify({
                        'error': 'Duplicate USNs found',
                        'duplicates': list(existing_usns)
                    }), 400
                
                # Prepare data for insertion
                insert_data = []
                for _, row in df.iterrows():
                    insert_data.append((
                        row['USN'],
                        row['Name'],
                        row['Department'],
                        row['Semester'],
                        row['Section'],
                        row['AcademicYear']
                    ))
                
                # Insert new students
                cursor.executemany('''
                    INSERT INTO students (USN, Name, Department, Semester, Section, AcademicYear)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', insert_data)
                
                # Commit transaction
                conn.commit()
                print("\nSuccessfully inserted students into database")
                
                return jsonify({
                    'message': 'Students uploaded successfully',
                    'count': len(df)
                })
                
            except Exception as e:
                # Rollback transaction on error
                conn.rollback()
                print(f"\nError during database insertion: {str(e)}")
                raise e
            
    except Exception as e:
        print(f"\nError in upload_students: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/mark-attendance', methods=['POST'])
def mark_attendance():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Validate required fields
        required_fields = ['department', 'semester', 'subject', 'section', 'date', 'records']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        department = data['department']
        semester = data['semester']
        subject_code = data['subject']  # This is now the subject_code
        section = data['section']
        attendance_date = data['date']
        records = data['records']

        # Enhanced debugging output
        print("\n=== ATTENDANCE MARKING DEBUG ===")
        print(f"Time: {datetime.now()}")
        print(f"Department: {department}")
        print(f"Semester: {semester}")
        print(f"Subject Code: {subject_code}")
        print(f"Section: {section}")
        print(f"Date: {attendance_date}")
        print(f"Number of records: {len(records)}")
        print("Sample records:", records[:2] if records else "No records")

        # Validate records
        if not records or not isinstance(records, list):
            print("Error: Invalid or empty records")
            return jsonify({'error': 'Invalid or empty records'}), 400

        # Check if attendance already exists for this section
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Debug: Check existing attendance
            cursor.execute('''
                SELECT COUNT(*) as count
                FROM attendance
                WHERE department = ?
                AND semester = ?
                AND subject_code = ?
                AND section = ?
                AND Date = ?
            ''', (department, semester, subject_code, section, attendance_date))
            
            existing_count = cursor.fetchone()['count']
            print(f"Existing attendance records for this section: {existing_count}")
            
            if existing_count > 0:
                print("Error: Attendance already exists for this section and date")
                return jsonify({'error': 'Attendance already marked for this section and date'}), 400

            # Get academic year from section mapping
            cursor.execute('''
                SELECT academic_year
                FROM section_mapping
                WHERE department = ?
                AND semester = ?
                AND subject_code = ?
                AND section = ?
                AND academic_year = (
                    SELECT MAX(academic_year)
                    FROM section_mapping
                    WHERE department = ?
                    AND semester = ?
                    AND subject_code = ?
                    AND section = ?
                )
            ''', (department, semester, subject_code, section,
                 department, semester, subject_code, section))
            
            result = cursor.fetchone()
            if not result:
                print("Error: Section mapping not found")
                return jsonify({'error': 'Section mapping not found. Please contact admin to map this section.'}), 400
            
            academic_year = result['academic_year']
            print(f"Academic year from mapping: {academic_year}")

            # Validate each record and prepare data for insertion
            attendance_records = []
            for record in records:
                if not isinstance(record, dict):
                    print(f"Invalid record format (not a dict): {record}")
                    continue
                    
                if not all(key in record for key in ['USN', 'present']):
                    print(f"Missing required fields in record: {record}")
                    continue

                attendance_records.append({
                    'USN': record['USN'],
                    'Date': attendance_date,
                    'subject_code': subject_code,
                    'Present': record['present'],
                    'department': department,
                    'semester': semester,
                    'section': section,
                    'AcademicYear': academic_year
                })

            if not attendance_records:
                print("Error: No valid records to insert")
                return jsonify({'error': 'No valid records to insert'}), 400

            print(f"Prepared {len(attendance_records)} valid records for insertion")

            # First verify all USNs exist in students table
            usns = [record['USN'] for record in attendance_records]
            placeholders = ','.join(['?' for _ in usns])
            cursor.execute(f'SELECT USN FROM students WHERE USN IN ({placeholders})', usns)
            existing_usns = set(row['USN'] for row in cursor.fetchall())
            
            missing_usns = set(usns) - existing_usns
            if missing_usns:
                print(f"Error: Invalid USNs found: {missing_usns}")
                return jsonify({'error': f'Invalid USNs: {", ".join(missing_usns)}'}), 400

            try:
                # Begin transaction
                cursor.execute('BEGIN TRANSACTION')
                
                # Insert attendance records
                cursor.executemany('''
                    INSERT INTO attendance (USN, Date, subject_code, Present, department, semester, section, AcademicYear)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', [(r['USN'], r['Date'], r['subject_code'], r['Present'], 
                      r['department'], r['semester'], r['section'], r['AcademicYear']) 
                     for r in attendance_records])
                
                # Commit transaction
                conn.commit()
                print(f"Successfully inserted {len(attendance_records)} attendance records")
                
                return jsonify({
                    'message': 'Attendance marked successfully',
                    'records_processed': len(attendance_records)
                })
                
            except Exception as e:
                # Rollback transaction on error
                conn.rollback()
                print(f"Error during attendance insertion: {str(e)}")
                raise e

    except sqlite3.IntegrityError as e:
        print(f"Database integrity error: {str(e)}")
        return jsonify({'error': 'Database integrity error. Possible duplicate entry.'}), 400
    except Exception as e:
        print(f"Error marking attendance: {str(e)}")
        return jsonify({'error': 'Failed to mark attendance. Please try again.'}), 500

@app.route('/api/view-attendance', methods=['GET'])
def view_attendance():
    department = request.args.get('department')
    academic_year = request.args.get('academicYear')
    semester = request.args.get('semester')
    subject = request.args.get('subject')
    from_date = request.args.get('fromDate')
    to_date = request.args.get('toDate')

    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT a.USN, s.Name, a.Date, a.Present
                FROM attendance a
                JOIN students s ON a.USN = s.USN
                WHERE a.Department = ? 
                AND a.AcademicYear = ?
                AND a.Semester = ?
                AND a.Subject = ?
                AND a.Date BETWEEN ? AND ?
                ORDER BY a.Date, a.USN
            ''', (department, academic_year, semester, subject, from_date, to_date))
            
            records = [dict(row) for row in cursor.fetchall()]

        if not records:
            return jsonify({'message': 'No records found'}), 404

        df = pd.DataFrame(records)
        
        # Create pivot table
        pivot_df = pd.pivot_table(
            df,
            values='Present',
            index=['USN', 'Name'],
            columns='Date',
            aggfunc=lambda x: 'Present' if x.iloc[0] else 'Absent',
            fill_value='NA'
        ).reset_index()
        
        # Sort columns
        date_columns = sorted([col for col in pivot_df.columns if isinstance(col, str) and col not in ['USN', 'Name']])
        column_order = ['USN', 'Name'] + date_columns
        pivot_df = pivot_df[column_order]
        
        # Convert to CSV and Excel
        csv_buffer = io.StringIO()
        pivot_df.to_csv(csv_buffer, index=False)
        csv_data = csv_buffer.getvalue()
        
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            pivot_df.to_excel(writer, index=False)
        excel_data = excel_buffer.getvalue()
        
        return jsonify({
            'records': pivot_df.to_dict('records'),
            'csv_data': csv_data,
            'excel_data': excel_data.hex()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/metadata', methods=['GET'])
def get_student_metadata():
    department = request.args.get('department')
    
    if not department:
        return jsonify({'error': 'Department is required'}), 400
    
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT DISTINCT AcademicYear, Semester
                FROM students
                WHERE LOWER(Department) = LOWER(?)
            ''', (department,))
            
            results = cursor.fetchall()
            
            if not results:
                return jsonify({
                    'academicYears': [],
                    'semesters': [],
                    'message': f'No data found for department: {department}'
                }), 404
            
            academic_years = sorted(set(row['AcademicYear'] for row in results))
            semesters = sorted(set(row['Semester'] for row in results))
            
            return jsonify({
                'academicYears': academic_years,
                'semesters': semesters
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students', methods=['GET'])
def get_students():
    department = request.args.get('department')
    academic_year = request.args.get('academicYear')
    semester = request.args.get('semester')
    
    if not all([department, academic_year, semester]):
        return jsonify({'error': 'Missing required parameters'}), 400
    
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM students
                WHERE LOWER(Department) = LOWER(?)
                AND AcademicYear = ?
                AND Semester = ?
            ''', (department, academic_year, semester))
            
            students = [dict(row) for row in cursor.fetchall()]
            
            if not students:
                return jsonify({
                    'students': [],
                    'message': f'No students found for department: {department}, academic year: {academic_year}, semester: {semester}'
                }), 404
            
            return jsonify({'students': students})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/faculty/reports', methods=['GET'])
def get_faculty_reports_old():
    department = request.args.get('department')
    if not department:
        return jsonify({'error': 'Department is required'}), 400
    
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT DISTINCT Subject, Semester, AcademicYear
                FROM attendance
                WHERE LOWER(Department) = LOWER(?)
                ORDER BY Subject, Semester, AcademicYear
            ''', (department,))
            
            reports = [dict(row) for row in cursor.fetchall()]
            return jsonify({'reports': reports})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/debug/students', methods=['GET'])
def debug_view_students():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM students ORDER BY Department, USN')
            students = [dict(row) for row in cursor.fetchall()]
            return jsonify({
                'total_students': len(students),
                'students': students
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/debug/attendance', methods=['GET'])
def debug_view_attendance():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT a.*, s.Name 
                FROM attendance a
                JOIN students s ON a.USN = s.USN
                ORDER BY a.Date DESC, a.Department, a.USN
                LIMIT 100
            ''')
            records = [dict(row) for row in cursor.fetchall()]
            return jsonify({
                'total_records': len(records),
                'latest_records': records
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/faculty', methods=['GET', 'POST'])
def manage_faculty():
    if request.method == 'POST':
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['faculty_id', 'name', 'email', 'department', 'designation', 'joining_date', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        try:
            # Hash the password before storing
            password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
            
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO faculty (faculty_id, name, email, department, designation, joining_date, password_hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (data['faculty_id'], data['name'], data['email'], data['department'],
                     data['designation'], data['joining_date'], password_hash))
                conn.commit()
                return jsonify({'message': 'Faculty added successfully'})
        except sqlite3.IntegrityError as e:
            return jsonify({'error': 'Faculty ID or email already exists'}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        department = request.args.get('department')
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                if department:
                    cursor.execute('SELECT * FROM faculty WHERE department = ?', (department,))
                else:
                    cursor.execute('SELECT * FROM faculty')
                faculty = [dict(row) for row in cursor.fetchall()]
                
                # Get total count of faculty
                cursor.execute('SELECT COUNT(*) as total FROM faculty')
                total = cursor.fetchone()['total']
                
                return jsonify({
                    'faculty': faculty,
                    'total': total
                })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/faculty/<faculty_id>', methods=['PUT', 'DELETE'])
def manage_single_faculty(faculty_id):
    if request.method == 'DELETE':
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM faculty WHERE faculty_id = ?', (faculty_id,))
                if cursor.rowcount == 0:
                    return jsonify({'error': 'Faculty not found'}), 404
                conn.commit()
                return jsonify({'message': 'Faculty deleted successfully'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:  # PUT
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        try:
            with get_db() as conn:
                cursor = conn.cursor()
                update_fields = []
                values = []
                for field in ['name', 'email', 'department', 'designation']:
                    if field in data:
                        update_fields.append(f'{field} = ?')
                        values.append(data[field])
                
                if not update_fields:
                    return jsonify({'error': 'No fields to update'}), 400

                values.append(faculty_id)
                query = f'''
                    UPDATE faculty 
                    SET {', '.join(update_fields)}
                    WHERE faculty_id = ?
                '''
                cursor.execute(query, values)
                
                if cursor.rowcount == 0:
                    return jsonify({'error': 'Faculty not found'}), 404
                
                conn.commit()
                return jsonify({'message': 'Faculty updated successfully'})
        except sqlite3.IntegrityError as e:
            return jsonify({'error': 'Email already exists'}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/section-mapping', methods=['GET', 'POST'])
def manage_section_mapping():
    if request.method == 'POST':
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['faculty_id', 'department', 'semester', 'section', 'subject_code', 'subject_name', 'academic_year']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        try:
            with get_db() as conn:
                cursor = conn.cursor()
                # First verify faculty exists
                cursor.execute('SELECT id FROM faculty WHERE faculty_id = ?', (data['faculty_id'],))
                if not cursor.fetchone():
                    return jsonify({'error': 'Faculty not found'}), 404

                cursor.execute('''
                    INSERT INTO section_mapping 
                    (faculty_id, department, semester, section, subject_code, subject_name, academic_year)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (data['faculty_id'], data['department'], data['semester'],
                     data['section'], data['subject_code'], data['subject_name'], data['academic_year']))
                conn.commit()
                return jsonify({'message': 'Section mapping added successfully'})
        except sqlite3.IntegrityError as e:
            return jsonify({'error': 'Section mapping already exists'}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        department = request.args.get('department')
        academic_year = request.args.get('academic_year')
        semester = request.args.get('semester')
        
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                query = '''
                    SELECT sm.*, f.name as faculty_name
                    FROM section_mapping sm
                    JOIN faculty f ON sm.faculty_id = f.faculty_id
                    WHERE 1=1
                '''
                params = []
                
                if department:
                    query += ' AND sm.department = ?'
                    params.append(department)
                if academic_year:
                    query += ' AND sm.academic_year = ?'
                    params.append(academic_year)
                if semester:
                    query += ' AND sm.semester = ?'
                    params.append(semester)
                
                cursor.execute(query, params)
                mappings = [dict(row) for row in cursor.fetchall()]
                return jsonify({'section_mappings': mappings})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/section-mapping/<int:mapping_id>', methods=['DELETE'])
def delete_section_mapping(mapping_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM section_mapping WHERE id = ?', (mapping_id,))
            if cursor.rowcount == 0:
                return jsonify({'error': 'Section mapping not found'}), 404
            conn.commit()
            return jsonify({'message': 'Section mapping deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/faculty', methods=['POST'])
def faculty_login():
    data = request.json
    if not data or 'faculty_id' not in data or 'password' not in data:
        return jsonify({'error': 'Faculty ID and password are required'}), 400

    faculty_id = data['faculty_id']
    password = data['password']
    
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM faculty WHERE faculty_id = ?', (faculty_id,))
            faculty = cursor.fetchone()
            
            if faculty:
                # Verify password
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                if password_hash == faculty['password_hash']:
                    return jsonify({
                        'message': 'Login successful',
                        'faculty': {
                            'faculty_id': faculty['faculty_id'],
                            'name': faculty['name'],
                            'email': faculty['email'],
                            'department': faculty['department'],
                            'designation': faculty['designation']
                        }
                    })
                else:
                    return jsonify({'error': 'Invalid password'}), 401
            else:
                return jsonify({'error': 'Invalid faculty ID'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/faculty/<faculty_id>/subjects', methods=['GET'])
def get_faculty_subjects(faculty_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT DISTINCT
                    sm.subject_code as code,
                    sm.subject_name as name,
                    sm.semester,
                    sm.department,
                    sm.section
                FROM section_mapping sm
                WHERE sm.faculty_id = ?
                AND sm.academic_year = (
                    SELECT MAX(academic_year) 
                    FROM section_mapping 
                    WHERE faculty_id = ?
                )
            ''', (faculty_id, faculty_id))
            
            subjects = [dict(row) for row in cursor.fetchall()]
            
            # Add subject_id for frontend
            for i, subject in enumerate(subjects):
                subject['subject_id'] = str(i + 1)
            
            return jsonify({'subjects': subjects})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/faculty/<faculty_id>/reports', methods=['GET'])
def get_faculty_reports(faculty_id):
    try:
        subject_filter = request.args.get('subject', 'all')
        
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Base query for getting mapped subjects
            subject_query = '''
                SELECT DISTINCT sm.subject_code, sm.subject_name, sm.section, sm.department, sm.semester
                FROM section_mapping sm
                WHERE sm.faculty_id = ?
                AND sm.academic_year = (
                    SELECT MAX(academic_year) 
                    FROM section_mapping 
                    WHERE faculty_id = ?
                )
            '''
            
            # Add subject filter if specified
            if subject_filter != 'all':
                subject_query += ' AND sm.subject_code = ?'
                cursor.execute(subject_query, (faculty_id, faculty_id, subject_filter))
            else:
                cursor.execute(subject_query, (faculty_id, faculty_id))
            
            mapped_subjects = cursor.fetchall()
            reports = []
            
            for subject_row in mapped_subjects:
                subject_data = dict(subject_row)
                
                # Get overall attendance statistics
                cursor.execute('''
                    SELECT 
                        COUNT(DISTINCT Date) as total_classes,
                        ROUND(AVG(CASE WHEN Present = 1 THEN 100.0 ELSE 0.0 END), 2) as avg_attendance,
                        MAX(Date) as last_updated
                    FROM attendance
                    WHERE subject_code = ?
                    AND department = ?
                    AND semester = ?
                ''', (subject_data['subject_code'], subject_data['department'], subject_data['semester']))
                
                stats_row = cursor.fetchone()
                if stats_row:
                    stats = dict(stats_row)
                    
                    # Get student-wise attendance details
                    cursor.execute('''
                        SELECT 
                            s.USN,
                            s.Name,
                            COUNT(DISTINCT a.Date) as classes_attended,
                            (SELECT COUNT(DISTINCT Date) FROM attendance 
                             WHERE subject_code = ? AND department = ? AND semester = ?) as total_classes,
                            ROUND(CAST(COUNT(CASE WHEN a.Present = 1 THEN 1 END) AS FLOAT) / 
                                  CAST(COUNT(DISTINCT a.Date) AS FLOAT) * 100, 2) as attendance_percentage
                        FROM students s
                        LEFT JOIN attendance a ON s.USN = a.USN 
                            AND a.subject_code = ? 
                            AND a.department = ? 
                            AND a.semester = ?
                        WHERE s.department = ?
                            AND s.semester = ?
                        GROUP BY s.USN, s.Name
                        ORDER BY s.USN
                    ''', (
                        subject_data['subject_code'], subject_data['department'], subject_data['semester'],
                        subject_data['subject_code'], subject_data['department'], subject_data['semester'],
                        subject_data['department'], subject_data['semester']
                    ))
                    
                    student_details = [dict(row) for row in cursor.fetchall()]
                    
                    # Get dates when attendance was marked
                    cursor.execute('''
                        SELECT DISTINCT Date
                        FROM attendance
                        WHERE subject_code = ?
                        AND department = ?
                        AND semester = ?
                        ORDER BY Date
                    ''', (subject_data['subject_code'], subject_data['department'], subject_data['semester']))
                    
                    dates = [row['Date'] for row in cursor.fetchall()]
                    
                    reports.append({
                        'subject_name': subject_data['subject_name'],
                        'section': subject_data['section'],
                        'department': subject_data['department'],
                        'semester': subject_data['semester'],
                        'total_classes': stats['total_classes'] or 0,
                        'average_attendance': stats['avg_attendance'] or 0.0,
                        'last_updated': stats['last_updated'] or datetime.now().strftime('%Y-%m-%d'),
                        'student_details': student_details,
                        'attendance_dates': dates
                    })
            
            return jsonify({'reports': reports})
    except Exception as e:
        print(f"Error in get_faculty_reports: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/faculty/<faculty_id>/sections', methods=['GET'])
def get_faculty_sections(faculty_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT 
                    sm.id,
                    sm.subject_code,
                    sm.subject_name,
                    sm.section,
                    sm.department,
                    sm.semester
                FROM section_mapping sm
                WHERE sm.faculty_id = ?
                AND sm.academic_year = (
                    SELECT MAX(academic_year) 
                    FROM section_mapping 
                    WHERE faculty_id = ?
                )
                ORDER BY sm.subject_code, sm.section
            ''', (faculty_id, faculty_id))
            
            sections = [dict(row) for row in cursor.fetchall()]
            return jsonify({'sections': sections})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/faculty/<faculty_id>/attendance-report', methods=['GET'])
def get_attendance_report(faculty_id):
    subject = request.args.get('subject')
    department = request.args.get('department')
    semester = request.args.get('semester')
    section = request.args.get('section')
    from_date = request.args.get('fromDate')
    to_date = request.args.get('toDate')
    
    if not all([subject, department, semester, section, from_date, to_date]):
        return jsonify({'error': 'Missing required parameters'}), 400
    
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # First get all dates within the range where attendance was marked
            cursor.execute('''
                SELECT DISTINCT Date
                FROM attendance
                WHERE subject_code = ?
                AND department = ?
                AND semester = ?
                AND Date BETWEEN ? AND ?
                ORDER BY Date
            ''', (subject, department, semester, from_date, to_date))
            
            dates = [row['Date'] for row in cursor.fetchall()]
            
            if not dates:
                return jsonify({
                    'records': [],
                    'dates': [],
                    'message': 'No attendance records found for the selected date range'
                })
            
            # Get student attendance records with detailed attendance status for each date
            cursor.execute('''
                WITH StudentAttendance AS (
                    SELECT 
                        s.USN,
                        s.Name,
                        COUNT(CASE WHEN a.Present = 1 THEN 1 END) as classes_attended,
                        COUNT(DISTINCT a.Date) as total_classes,
                        ROUND(CAST(COUNT(CASE WHEN a.Present = 1 THEN 1 END) AS FLOAT) / 
                              CAST(COUNT(DISTINCT a.Date) AS FLOAT) * 100, 2) as attendance_percentage
                    FROM students s
                    LEFT JOIN attendance a ON s.USN = a.USN 
                        AND a.subject_code = ?
                        AND a.department = ?
                        AND a.semester = ?
                        AND a.Date BETWEEN ? AND ?
                    WHERE s.department = ?
                        AND s.semester = ?
                    GROUP BY s.USN, s.Name
                )
                SELECT 
                    sa.*,
                    GROUP_CONCAT(
                        a.Date || ':' || CASE WHEN a.Present = 1 THEN '1' ELSE '0' END
                    ) as attendance_dates
                FROM StudentAttendance sa
                LEFT JOIN attendance a ON sa.USN = a.USN 
                    AND a.subject_code = ?
                    AND a.department = ?
                    AND a.semester = ?
                    AND a.Date BETWEEN ? AND ?
                GROUP BY sa.USN, sa.Name
                ORDER BY sa.USN
            ''', (
                subject, department, semester, from_date, to_date,
                department, semester,
                subject, department, semester, from_date, to_date
            ))
            
            records = []
            for row in cursor.fetchall():
                attendance_dates = {}
                if row['attendance_dates']:
                    for date_status in row['attendance_dates'].split(','):
                        if ':' in date_status:
                            date, status = date_status.split(':')
                            attendance_dates[date] = status == '1'
                
                records.append({
                    'USN': row['USN'],
                    'Name': row['Name'],
                    'dates': attendance_dates,
                    'classesAttended': row['classes_attended'],
                    'totalClasses': row['total_classes'],
                    'attendancePercentage': row['attendance_percentage']
                })
            
            return jsonify({
                'records': records,
                'dates': dates
            })
            
    except Exception as e:
        print(f"Error in get_attendance_report: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/attendance-report', methods=['GET'])
def get_admin_attendance_report():
    try:
        department = request.args.get('department')
        academic_year = request.args.get('academicYear')
        semester = request.args.get('semester')
        subject = request.args.get('subject')
        from_date = request.args.get('fromDate')
        to_date = request.args.get('toDate')

        print(f"\nDebug - Received parameters:")
        print(f"Department: {department}")
        print(f"Academic Year: {academic_year}")
        print(f"Semester: {semester}")
        print(f"Subject: {subject}")
        print(f"From Date: {from_date}")
        print(f"To Date: {to_date}")

        if not all([department, academic_year, semester, subject, from_date, to_date]):
            print("Missing required parameters")
            return jsonify({'error': 'Missing required parameters'}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            # Get all students in the department and semester
            print("\nFetching students...")
            cursor.execute('''
                SELECT USN, Name
                FROM students
                WHERE department = ? AND semester = ?
                ORDER BY USN
            ''', (department, semester))
            
            students = [dict(row) for row in cursor.fetchall()]
            print(f"Found {len(students)} students")

            if not students:
                print("No students found for the given department and semester")
                return jsonify({
                    'students': [],
                    'dates': [],
                    'message': 'No students found for the given criteria'
                })

            # Get all dates between from_date and to_date where attendance was marked
            print("\nFetching attendance dates...")
            cursor.execute('''
                SELECT DISTINCT Date
                FROM attendance
                WHERE subject_code = ?
                AND Date BETWEEN ? AND ?
                ORDER BY Date
            ''', (subject, from_date, to_date))
            
            dates = [row['Date'] for row in cursor.fetchall()]
            print(f"Found {len(dates)} attendance dates")

            if not dates:
                print("No attendance records found for the given date range")
                return jsonify({
                    'students': students,
                    'dates': [],
                    'message': 'No attendance records found for the selected date range'
                })

            # For each student, get their attendance records
            print("\nProcessing attendance records for each student...")
            processed_students = []
            for student in students:
                # Get total classes and attended classes
                cursor.execute('''
                    SELECT 
                        COUNT(DISTINCT Date) as total_classes,
                        COUNT(CASE WHEN Present = 1 THEN 1 END) as classes_attended
                    FROM attendance
                    WHERE USN = ?
                    AND subject_code = ?
                    AND Date BETWEEN ? AND ?
                ''', (student['USN'], subject, from_date, to_date))
                
                attendance_stats = dict(cursor.fetchone())

                # Get date-wise attendance
                cursor.execute('''
                    SELECT Date, Present
                    FROM attendance
                    WHERE USN = ?
                    AND subject_code = ?
                    AND Date BETWEEN ? AND ?
                ''', (student['USN'], subject, from_date, to_date))
                
                attendance_records = cursor.fetchall()
                
                # Calculate attendance percentage
                total = attendance_stats['total_classes'] or 0
                attended = attendance_stats['classes_attended'] or 0
                
                # Create processed student record with camelCase keys
                processed_student = {
                    'usn': student['USN'],
                    'name': student['Name'],
                    'totalClasses': total,
                    'classesAttended': attended,
                    'attendancePercentage': round((attended / total * 100), 2) if total > 0 else 0,
                    'attendance': {
                        record['Date']: bool(record['Present'])
                        for record in attendance_records
                    }
                }
                processed_students.append(processed_student)

            print("\nSending response:")
            print(f"Total students: {len(processed_students)}")
            print(f"Total dates: {len(dates)}")
            return jsonify({
                'students': processed_students,
                'dates': dates
            })

    except Exception as e:
        print(f"\nError in get_admin_attendance_report: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/attendance/report/download', methods=['POST', 'OPTIONS'])
def download_attendance_report():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Extract parameters
        subject = data.get('subject')
        department = data.get('department')
        section = data.get('section')
        semester = data.get('semester')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        file_format = data.get('format', 'csv').lower()  # Ensure lowercase for comparison

        # Validate required fields
        required_fields = ['subject', 'department', 'semester', 'section', 'start_date', 'end_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Get attendance data from database
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get all dates between start_date and end_date
            cursor.execute('''
                SELECT DISTINCT Date 
                FROM attendance 
                WHERE subject_code = ? 
                AND department = ? 
                AND semester = ? 
                AND section = ?
                AND Date BETWEEN ? AND ?
                ORDER BY Date
            ''', (subject, department, semester, section, start_date, end_date))
            
            dates = [row['Date'] for row in cursor.fetchall()]
            
            if not dates:
                return jsonify({'error': 'No attendance records found for the selected period'}), 404
            
            # Get student attendance records
            cursor.execute('''
                SELECT s.USN, s.Name, 
                       GROUP_CONCAT(CASE WHEN a.Present = 1 THEN 'P' ELSE 'A' END) as attendance_string,
                       SUM(CASE WHEN a.Present = 1 THEN 1 ELSE 0 END) as classes_attended,
                       COUNT(a.Present) as total_classes
                FROM students s
                LEFT JOIN attendance a ON s.USN = a.USN 
                    AND a.Date BETWEEN ? AND ?
                    AND a.subject_code = ?
                    AND a.department = ?
                    AND a.semester = ?
                    AND a.section = ?
                WHERE s.department = ?
                    AND s.semester = ?
                    AND s.section = ?
                GROUP BY s.USN, s.Name
                ORDER BY s.USN
            ''', (start_date, end_date, subject, department, semester, section,
                  department, semester, section))
            
            records = cursor.fetchall()
            
            if not records:
                return jsonify({'error': 'No students found in the selected section'}), 404
            
            # Create DataFrame for export
            df_data = []
            for record in records:
                attendance_list = record['attendance_string'].split(',') if record['attendance_string'] else []
                student_data = {
                    'USN': record['USN'],
                    'Name': record['Name']
                }
                
                # Add attendance for each date
                for i, date in enumerate(dates):
                    student_data[date] = attendance_list[i] if i < len(attendance_list) else '-'
                
                # Add summary columns
                student_data['Total Classes'] = record['total_classes']
                student_data['Classes Attended'] = record['classes_attended']
                student_data['Attendance %'] = round((record['classes_attended'] / record['total_classes'] * 100), 2) if record['total_classes'] > 0 else 0
                
                df_data.append(student_data)
            
            df = pd.DataFrame(df_data)

        # Prepare the file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if file_format == 'csv':
            # Handle CSV format
            output = io.BytesIO()
            df.to_csv(output, index=False, encoding='utf-8')
            output.seek(0)
            
            filename = f'attendance_report_{subject}_{section}_{timestamp}.csv'
            mimetype = 'text/csv'
        else:
            # Handle Excel format
            output = io.BytesIO()
            
            # Create Excel writer with xlsxwriter engine
            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            worksheet = workbook.add_worksheet('Attendance Report')
            
            # Define formats
            header_format = workbook.add_format({
                'bold': True,
                'text_wrap': True,
                'valign': 'top',
                'align': 'center',
                'bg_color': '#D9D9D9',
                'border': 1
            })
            
            present_format = workbook.add_format({
                'bg_color': '#C6EFCE',
                'align': 'center'
            })
            
            absent_format = workbook.add_format({
                'bg_color': '#FFC7CE',
                'align': 'center'
            })
            
            # Write headers
            for col_num, column in enumerate(df.columns):
                worksheet.write(0, col_num, column, header_format)
                worksheet.set_column(col_num, col_num, 15)
            
            # Write data
            for row_num, row in enumerate(df.values, 1):
                for col_num, value in enumerate(row):
                    if col_num >= 2 and col_num < len(dates) + 2:  # Only format attendance columns
                        if value == 'P':
                            worksheet.write(row_num, col_num, value, present_format)
                        elif value == 'A':
                            worksheet.write(row_num, col_num, value, absent_format)
                        else:
                            worksheet.write(row_num, col_num, value)
                    else:
                        worksheet.write(row_num, col_num, value)
            
            # Close workbook
            workbook.close()
            
            # Prepare file for sending
            output.seek(0)
            
            filename = f'attendance_report_{subject}_{section}_{timestamp}.xlsx'
            mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        
        # Send file with proper MIME type and filename
        response = send_file(
            output,
            mimetype=mimetype,
            as_attachment=True,
            download_name=filename
        )
        
        # Add CORS headers
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:8080'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        
        return response

    except Exception as e:
        print(f"Error generating report download: {str(e)}")
        import traceback
        traceback.print_exc()  # Print full traceback for debugging
        return jsonify({'error': f'Failed to generate report download: {str(e)}'}), 500

@app.route('/api/attendance/stats/monthly', methods=['GET'])
def get_monthly_attendance_stats():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            # Get total classes for the current month
            cursor.execute('''
                SELECT COUNT(DISTINCT Date || subject_code || department || semester || section) as total_classes
                FROM attendance
                WHERE strftime('%Y-%m', Date) = strftime('%Y-%m', 'now')
            ''')
            result = cursor.fetchone()
            return jsonify({
                'total_classes': result['total_classes'] if result else 0
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/stats/weekly', methods=['GET'])
def get_weekly_reports_stats():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            # Get total reports generated in the last 7 days
            cursor.execute('''
                SELECT COUNT(*) as total_reports
                FROM (
                    SELECT DISTINCT Date, subject_code, department, semester, section
                    FROM attendance
                    WHERE Date >= date('now', '-7 days')
                    GROUP BY Date, subject_code, department, semester, section
                )
            ''')
            result = cursor.fetchone()
            return jsonify({
                'total_reports': result['total_reports'] if result else 0
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/subjects/all', methods=['GET'])
def get_all_subjects():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            # Get total unique subjects from section mappings
            cursor.execute('''
                SELECT COUNT(DISTINCT subject_code) as total_subjects
                FROM section_mapping
                WHERE academic_year = (
                    SELECT MAX(academic_year)
                    FROM section_mapping
                )
            ''')
            result = cursor.fetchone()
            return jsonify({
                'total': result['total_subjects'] if result else 0,
                'subjects': list(DEPARTMENT_SUBJECTS.values())
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/activities/recent', methods=['GET'])
def get_recent_activities():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get recent faculty additions
            cursor.execute('''
                SELECT 
                    'Faculty Added' as type,
                    name || ' added to ' || department as description,
                    datetime(joining_date) as timestamp
                FROM faculty
                ORDER BY joining_date DESC
                LIMIT 3
            ''')
            faculty_activities = [dict(row) for row in cursor.fetchall()]
            
            # Get recent attendance markings
            cursor.execute('''
                SELECT DISTINCT
                    'Attendance Marked' as type,
                    sm.subject_name || ' for ' || a.department || ' ' || a.semester || ' sem' as description,
                    datetime(a.Date) as timestamp
                FROM attendance a
                JOIN section_mapping sm ON 
                    a.subject_code = sm.subject_code 
                    AND a.department = sm.department 
                    AND a.semester = sm.semester
                ORDER BY a.Date DESC
                LIMIT 3
            ''')
            attendance_activities = [dict(row) for row in cursor.fetchall()]
            
            # Get recent section mappings
            cursor.execute('''
                SELECT 
                    'Subject Mapped' as type,
                    f.name || ' mapped to ' || sm.subject_name || ' (' || sm.department || ' ' || sm.semester || ' sem)' as description,
                    datetime('now', '-' || sm.id || ' minutes') as timestamp
                FROM section_mapping sm
                JOIN faculty f ON sm.faculty_id = f.faculty_id
                ORDER BY sm.id DESC
                LIMIT 3
            ''')
            mapping_activities = [dict(row) for row in cursor.fetchall()]
            
            # Combine all activities and sort by timestamp
            all_activities = faculty_activities + attendance_activities + mapping_activities
            sorted_activities = sorted(all_activities, key=lambda x: x['timestamp'], reverse=True)
            
            return jsonify({
                'activities': sorted_activities[:5]  # Return only the 5 most recent activities
            })
    except Exception as e:
        print(f"Error in get_recent_activities: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/faculty/<faculty_id>/dashboard', methods=['GET'])
def get_faculty_dashboard_stats(faculty_id):
    try:
        print(f"\nFetching dashboard stats for faculty: {faculty_id}")
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get faculty details
            print("Getting faculty details...")
            cursor.execute('''
                SELECT name, department
                FROM faculty
                WHERE faculty_id = ?
            ''', (faculty_id,))
            faculty = cursor.fetchone()
            if not faculty:
                print(f"Faculty not found: {faculty_id}")
                return jsonify({'error': 'Faculty not found'}), 404
            
            print(f"Found faculty: {dict(faculty)}")
            
            # Get total subjects for current academic year
            print("Getting total subjects...")
            cursor.execute('''
                SELECT COUNT(DISTINCT subject_code) as total_subjects
                FROM section_mapping
                WHERE faculty_id = ?
                AND academic_year = (
                    SELECT MAX(academic_year) FROM section_mapping
                )
            ''', (faculty_id,))
            total_subjects = cursor.fetchone()['total_subjects']
            print(f"Total subjects: {total_subjects}")
            
            # Get today's classes
            today = datetime.now().strftime('%Y-%m-%d')
            print(f"Getting today's classes for {today}...")
            cursor.execute('''
                SELECT sm.subject_name, sm.department, sm.semester, sm.section,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM attendance a
                            WHERE a.subject_code = sm.subject_code 
                            AND a.department = sm.department
                            AND a.semester = sm.semester
                            AND a.section = sm.section
                            AND a.Date = ?
                        ) THEN 'Completed'
                        ELSE 'Pending'
                    END as status
                FROM section_mapping sm
                WHERE sm.faculty_id = ?
                AND sm.academic_year = (
                    SELECT MAX(academic_year) FROM section_mapping
                )
            ''', (today, faculty_id))
            todays_classes = [dict(row) for row in cursor.fetchall()]
            print(f"Today's classes: {todays_classes}")
            
            # Get attendance marked stats (default to 0 if no records)
            print("Getting attendance stats...")
            cursor.execute('''
                SELECT 
                    COUNT(DISTINCT a.Date || a.subject_code || a.department || a.semester || a.section) as total,
                    COUNT(DISTINCT CASE WHEN a.Date = ? THEN a.Date || a.subject_code || a.department || a.semester || a.section END) as today
                FROM attendance a
                JOIN section_mapping sm ON 
                    a.subject_code = sm.subject_code 
                    AND a.department = sm.department
                    AND a.semester = sm.semester
                    AND a.section = sm.section
                WHERE sm.faculty_id = ?
                AND strftime('%Y-%m', a.Date) = strftime('%Y-%m', 'now')
            ''', (today, faculty_id))
            result = cursor.fetchone()
            attendance_marked = {'total': result['total'], 'today': result['today']} if result else {'total': 0, 'today': 0}
            print(f"Attendance stats: {attendance_marked}")
            
            # Get subject-wise attendance percentage (default to empty list if no records)
            print("Getting subject-wise attendance...")
            cursor.execute('''
                WITH SubjectAttendance AS (
                    SELECT 
                        a.subject_code,
                        COUNT(CASE WHEN a.Present = 1 THEN 1 END) * 100.0 / COUNT(*) as attendance_percentage
                    FROM attendance a
                    JOIN section_mapping sm ON 
                        a.subject_code = sm.subject_code 
                        AND a.department = sm.department
                        AND a.semester = sm.semester
                        AND a.section = sm.section
                    WHERE sm.faculty_id = ?
                    GROUP BY a.subject_code
                )
                SELECT subject_code as subject, ROUND(attendance_percentage, 1) as attendance
                FROM SubjectAttendance
            ''', (faculty_id,))
            subject_attendance = [dict(row) for row in cursor.fetchall()]
            print(f"Subject attendance: {subject_attendance}")
            
            # Get recent classes with attendance stats (default to empty list if no records)
            print("Getting recent classes...")
            cursor.execute('''
                WITH RecentClasses AS (
                    SELECT 
                        a.subject_code || ' - ' || a.department || a.semester || a.section as name,
                        a.Date,
                        COUNT(CASE WHEN a.Present = 1 THEN 1 END) as present,
                        COUNT(CASE WHEN a.Present = 0 THEN 1 END) as absent
                    FROM attendance a
                    JOIN section_mapping sm ON 
                        a.subject_code = sm.subject_code 
                        AND a.department = sm.department
                        AND a.semester = sm.semester
                        AND a.section = sm.section
                    WHERE sm.faculty_id = ?
                    GROUP BY a.subject_code, a.department, a.semester, a.section, a.Date
                    ORDER BY a.Date DESC
                    LIMIT 5
                )
                SELECT name, present, absent
                FROM RecentClasses
            ''', (faculty_id,))
            recent_classes = [dict(row) for row in cursor.fetchall()]
            print(f"Recent classes: {recent_classes}")
            
            response_data = {
                'faculty_name': faculty['name'],
                'department': faculty['department'],
                'total_subjects': total_subjects,
                'todays_classes': todays_classes,
                'attendance_marked': attendance_marked,
                'subject_attendance': subject_attendance,
                'recent_classes': recent_classes
            }
            print(f"Sending response: {response_data}")
            return jsonify(response_data)
            
    except Exception as e:
        print(f"Error in get_faculty_dashboard_stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch dashboard data'}), 500

# Initialize database when the app starts
init_db()

if __name__ == '__main__':
    verify_database()  # Verify database structure before starting the app
    app.run(debug=True, port=5000)