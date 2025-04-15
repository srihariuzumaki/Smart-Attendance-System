# Smart Attendance System

A Streamlit-based web application for managing student attendance in an educational institution.

#Still in working phase 

## Features

- Mark attendance for different departments, subjects, and semesters
- Upload student lists via CSV or Excel files
- Prevent duplicate attendance entries for the same date
- View attendance records with date range filtering
- Download attendance reports in CSV or Excel format
- Support for multiple departments (CSE, ECE, ISE, MECH)

## Setup

1. Create a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the application:

```bash
streamlit run app.py
```

## Usage

1. **Upload Student List**:

   - Prepare a CSV or Excel file with columns: Semester, Name, AcademicYear, Department, USN
   - Upload the file through the "Mark Attendance" tab

2. **Mark Attendance**:

   - Select Department, Academic Year, Semester, and Subject
   - Choose the date for attendance
   - Mark students as present using checkboxes
   - Submit and download attendance record if needed

3. **View Attendance**:
   - Use the "View Attendance" tab
   - Filter by Department, Academic Year, Semester, and Subject
   - Select date range to view attendance records
   - Download consolidated reports in CSV or Excel format

## File Structure

- `app.py`: Main application code
- `requirements.txt`: Python dependencies
- `.gitignore`: Git ignore rules for data files
- `README.md`: Project documentation
