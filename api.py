from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
from datetime import date, datetime
import io
import os
import sqlite3
from contextlib import contextmanager
import hashlib
import re  # Add this at the top with other imports

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:8080"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Define subjects for each department
DEPARTMENT_SUBJECTS = {
    'cse': ['Python Programming', 'Data Structures', 'Database Management', 'Computer Networks', 'Operating Systems'],
    'ece': ['Digital Electronics', 'Signals and Systems', 'Communication Systems', 'VLSI Design', 'Microprocessors'],
    'ise': ['Information Security', 'Software Engineering', 'Web Technologies', 'Cloud Computing', 'AI & ML'],
    'mech': ['Thermodynamics', 'Machine Design', 'Fluid Mechanics', 'Manufacturing Process', 'Engineering Materials']
}

DATABASE_FILE = 'attendance.db'

def init_db():
    with sqlite3.connect(DATABASE_FILE) as conn:
        cursor = conn.cursor()
        
        # Drop existing attendance table to recreate with correct schema
        cursor.execute('DROP TABLE IF EXISTS attendance')
        
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
                subject TEXT NOT NULL,
                academic_year TEXT NOT NULL,
                FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
                UNIQUE(department, semester, section, subject, academic_year)
            )
        ''')
        
        # Create attendance table with Section field and updated unique constraint
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                USN TEXT NOT NULL,
                Date TEXT NOT NULL,
                Subject TEXT NOT NULL,
                Present BOOLEAN NOT NULL,
                Department TEXT NOT NULL,
                Semester TEXT NOT NULL,
                Section TEXT NOT NULL,
                AcademicYear TEXT NOT NULL,
                FOREIGN KEY (USN) REFERENCES students(USN),
                UNIQUE(USN, Date, Subject, Section)
            )
        ''')
        
        conn.commit()
        print("Database initialized successfully with all required tables and columns.")

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
    return jsonify(DEPARTMENT_SUBJECTS.get(department, []))

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
        subject = data['subject']
        section = data['section']
        attendance_date = data['date']
        records = data['records']

        # Print received data for debugging
        print("Received attendance data:", {
            'department': department,
            'semester': semester,
            'subject': subject,
            'section': section,
            'date': attendance_date,
            'records_count': len(records) if records else 0
        })

        # Validate records
        if not records or not isinstance(records, list):
            return jsonify({'error': 'Invalid or empty records'}), 400

        # Check if attendance already exists for this section
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT COUNT(*) as count
                FROM attendance
                WHERE Department = ?
                AND Semester = ?
                AND Subject = ?
                AND Section = ?
                AND Date = ?
            ''', (department, semester, subject, section, attendance_date))
            
            if cursor.fetchone()['count'] > 0:
                return jsonify({'error': 'Attendance already marked for this section and date'}), 400

            # Get academic year from section mapping
            cursor.execute('''
                SELECT academic_year
                FROM section_mapping
                WHERE department = ?
                AND semester = ?
                AND subject = ?
                AND section = ?
                AND academic_year = (
                    SELECT MAX(academic_year)
                    FROM section_mapping
                    WHERE department = ?
                    AND semester = ?
                    AND subject = ?
                    AND section = ?
                )
            ''', (department, semester, subject, section,
                 department, semester, subject, section))
            
            result = cursor.fetchone()
            if not result:
                return jsonify({'error': 'Section mapping not found. Please contact admin to map this section.'}), 400
            
            academic_year = result['academic_year']

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
                    'Subject': subject,
                    'Present': record['present'],
                    'Department': department,
                    'Semester': semester,
                    'Section': section,
                    'AcademicYear': academic_year
                })

            if not attendance_records:
                return jsonify({'error': 'No valid records to insert'}), 400

            # First verify all USNs exist in students table
            usns = [record['USN'] for record in attendance_records]
            placeholders = ','.join(['?' for _ in usns])
            cursor.execute(f'SELECT USN FROM students WHERE USN IN ({placeholders})', usns)
            existing_usns = set(row['USN'] for row in cursor.fetchall())
            
            missing_usns = set(usns) - existing_usns
            if missing_usns:
                return jsonify({'error': f'Invalid USNs: {", ".join(missing_usns)}'}), 400

            try:
                # Begin transaction
                cursor.execute('BEGIN TRANSACTION')
                
                # Insert attendance records
                cursor.executemany('''
                    INSERT INTO attendance (USN, Date, Subject, Present, Department, Semester, Section, AcademicYear)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', [(r['USN'], r['Date'], r['Subject'], r['Present'], 
                      r['Department'], r['Semester'], r['Section'], r['AcademicYear']) 
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
                return jsonify({'faculty': faculty})
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

        required_fields = ['faculty_id', 'department', 'semester', 'section', 'subject', 'academic_year']
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
                    (faculty_id, department, semester, section, subject, academic_year)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (data['faculty_id'], data['department'], data['semester'],
                     data['section'], data['subject'], data['academic_year']))
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
                            'id': faculty['faculty_id'],
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
                    sm.subject as name,
                    sm.subject as course_code,
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
                SELECT DISTINCT sm.subject, sm.section, sm.department, sm.semester
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
                subject_query += ' AND sm.subject = ?'
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
                    WHERE Subject = ?
                    AND Department = ?
                    AND Semester = ?
                ''', (subject_data['subject'], subject_data['department'], subject_data['semester']))
                
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
                             WHERE Subject = ? AND Department = ? AND Semester = ?) as total_classes,
                            ROUND(CAST(COUNT(CASE WHEN a.Present = 1 THEN 1 END) AS FLOAT) / 
                                  CAST(COUNT(DISTINCT a.Date) AS FLOAT) * 100, 2) as attendance_percentage
                        FROM students s
                        LEFT JOIN attendance a ON s.USN = a.USN 
                            AND a.Subject = ? 
                            AND a.Department = ? 
                            AND a.Semester = ?
                        WHERE s.Department = ?
                            AND s.Semester = ?
                        GROUP BY s.USN, s.Name
                        ORDER BY s.USN
                    ''', (
                        subject_data['subject'], subject_data['department'], subject_data['semester'],
                        subject_data['subject'], subject_data['department'], subject_data['semester'],
                        subject_data['department'], subject_data['semester']
                    ))
                    
                    student_details = [dict(row) for row in cursor.fetchall()]
                    
                    # Get dates when attendance was marked
                    cursor.execute('''
                        SELECT DISTINCT Date
                        FROM attendance
                        WHERE Subject = ?
                        AND Department = ?
                        AND Semester = ?
                        ORDER BY Date
                    ''', (subject_data['subject'], subject_data['department'], subject_data['semester']))
                    
                    dates = [row['Date'] for row in cursor.fetchall()]
                    
                    reports.append({
                        'subject_name': subject_data['subject'],
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
                    sm.subject,
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
                ORDER BY sm.subject, sm.section
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
                WHERE Subject = ?
                AND Department = ?
                AND Semester = ?
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
                        AND a.Subject = ?
                        AND a.Department = ?
                        AND a.Semester = ?
                        AND a.Date BETWEEN ? AND ?
                    WHERE s.Department = ?
                        AND s.Semester = ?
                    GROUP BY s.USN, s.Name
                )
                SELECT 
                    sa.*,
                    GROUP_CONCAT(
                        a.Date || ':' || CASE WHEN a.Present = 1 THEN '1' ELSE '0' END
                    ) as attendance_dates
                FROM StudentAttendance sa
                LEFT JOIN attendance a ON sa.USN = a.USN 
                    AND a.Subject = ?
                    AND a.Department = ?
                    AND a.Semester = ?
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

@app.route('/api/attendance/report/download', methods=['POST'])
def download_attendance_report():
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
        file_format = data.get('format', 'csv')

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
                WHERE Subject = ? 
                AND Department = ? 
                AND Semester = ? 
                AND Section = ?
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
                    AND a.Subject = ?
                    AND a.Department = ?
                    AND a.Semester = ?
                    AND a.Section = ?
                WHERE s.Department = ?
                    AND s.Semester = ?
                    AND s.Section = ?
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
        buffer = io.BytesIO()
        if file_format == 'csv':
            df.to_csv(buffer, index=False)
            mimetype = 'text/csv'
            file_ext = 'csv'
        else:
            df.to_excel(buffer, index=False)
            mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            file_ext = 'xlsx'

        buffer.seek(0)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'attendance_report_{subject}_{section}_{timestamp}.{file_ext}'

        response = send_file(
            buffer,
            mimetype=mimetype,
            as_attachment=True,
            download_name=filename
        )

        # Add CORS headers
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:8080'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        return response

    except Exception as e:
        print(f"Error generating report download: {str(e)}")
        return jsonify({'error': 'Failed to generate report download'}), 500

# Initialize database when the app starts
init_db()

if __name__ == '__main__':
    app.run(debug=True, port=5000)