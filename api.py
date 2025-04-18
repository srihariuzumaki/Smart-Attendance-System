from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from datetime import date, datetime
import io
import os
import sqlite3
from contextlib import contextmanager
import hashlib

app = Flask(__name__)
CORS(app)

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
        
        # Create students table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS students (
                USN TEXT PRIMARY KEY,
                Name TEXT NOT NULL,
                Semester TEXT NOT NULL,
                Department TEXT NOT NULL,
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
        
        # Create attendance table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                USN TEXT NOT NULL,
                Date TEXT NOT NULL,
                Subject TEXT NOT NULL,
                Present BOOLEAN NOT NULL,
                Department TEXT NOT NULL,
                Semester TEXT NOT NULL,
                AcademicYear TEXT NOT NULL,
                FOREIGN KEY (USN) REFERENCES students(USN),
                UNIQUE(USN, Date, Subject)
            )
        ''')
        
        conn.commit()

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

@app.route('/api/upload-students', methods=['POST'])
def upload_students():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file, header=None, 
                           names=['Semester', 'Name', 'AcademicYear', 'Department', 'USN'])
        else:
            df = pd.read_excel(file, header=None, engine='openpyxl',
                             names=['Semester', 'Name', 'AcademicYear', 'Department', 'USN'])

        # Insert students into database
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.executemany('''
                INSERT OR REPLACE INTO students (USN, Name, Semester, Department, AcademicYear)
                VALUES (?, ?, ?, ?, ?)
            ''', [(row['USN'], row['Name'], row['Semester'], row['Department'], row['AcademicYear']) 
                 for _, row in df.iterrows()])
            conn.commit()

        students = df.to_dict('records')
        return jsonify({
            'students': students,
            'academicYears': sorted(df['AcademicYear'].unique().tolist()),
            'semesters': sorted(df['Semester'].astype(str).unique().tolist())
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/mark-attendance', methods=['POST'])
def mark_attendance():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Validate required fields
        required_fields = ['department', 'semester', 'subject', 'date', 'records']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        department = data['department']
        semester = data['semester']
        subject = data['subject']
        attendance_date = data['date']
        records = data['records']

        # Print received data for debugging
        print("Received attendance data:", {
            'department': department,
            'semester': semester,
            'subject': subject,
            'date': attendance_date,
            'records_count': len(records) if records else 0
        })

        # Validate records
        if not records or not isinstance(records, list):
            return jsonify({'error': 'Invalid or empty records'}), 400

        # Check if attendance already exists
        if attendance_exists(department, semester, subject, attendance_date):
            return jsonify({'error': 'Attendance already marked for this date'}), 400

        # Validate each record and prepare data for insertion
        attendance_records = []
        for record in records:
            if not isinstance(record, dict):
                print(f"Invalid record format (not a dict): {record}")
                continue
                
            if not all(key in record for key in ['USN', 'present', 'AcademicYear']):
                print(f"Missing required fields in record: {record}")
                continue

            attendance_records.append({
                'USN': record['USN'],
                'Date': attendance_date,
                'Subject': subject,
                'Present': record['present'],
                'Department': department,
                'Semester': semester,
                'AcademicYear': record['AcademicYear']
            })

        if not attendance_records:
            return jsonify({'error': 'No valid records to insert'}), 400

        with get_db() as conn:
            cursor = conn.cursor()
            
            # First verify all USNs exist in students table
            usns = [record['USN'] for record in attendance_records]
            placeholders = ','.join(['?' for _ in usns])
            cursor.execute(f'SELECT USN FROM students WHERE USN IN ({placeholders})', usns)
            existing_usns = set(row['USN'] for row in cursor.fetchall())
            
            missing_usns = set(usns) - existing_usns
            if missing_usns:
                return jsonify({'error': f'Invalid USNs: {", ".join(missing_usns)}'}), 400

            # Insert attendance records
            cursor.executemany('''
                INSERT INTO attendance (USN, Date, Subject, Present, Department, Semester, AcademicYear)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', [(r['USN'], r['Date'], r['Subject'], r['Present'], 
                  r['Department'], r['Semester'], r['AcademicYear']) for r in attendance_records])
            
            conn.commit()

        return jsonify({
            'message': 'Attendance marked successfully',
            'records_processed': len(attendance_records)
        })

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

@app.route('/faculty/subjects', methods=['GET'])
def get_faculty_subjects():
    department = request.args.get('department')
    if not department:
        return jsonify({'error': 'Department is required'}), 400
    return jsonify(DEPARTMENT_SUBJECTS.get(department.lower(), []))

@app.route('/faculty/reports', methods=['GET'])
def get_faculty_reports():
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

# Initialize database when the app starts
init_db()

if __name__ == '__main__':
    app.run(debug=True, port=5000)