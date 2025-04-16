import streamlit as st
import pandas as pd
from datetime import date
import io

# Initialize theme state
if 'theme' not in st.session_state:
    st.session_state.theme = 'light'

# Custom CSS for animations and micro-interactions
st.markdown("""
<style>
    /* Dark theme specific text colors */
    [data-theme="dark"] {
        color: white !important;
    }
    
    [data-theme="dark"] [data-testid="stFileUploader"] {
        color: white !important;
    }
    
    [data-theme="dark"] [data-testid="stFileUploader"] label {
        color: white !important;
    }
    
    [data-theme="dark"] [data-testid="stFileUploader"] small {
        color: rgba(255, 255, 255, 0.8) !important;
    }
    
    [data-theme="dark"] [data-testid="stFileUploader"] svg {
        fill: white !important;
    }
    
    [data-theme="dark"] .uploadedFileName {
        color: white !important;
    }
    
    /* File uploader text colors in dark theme */
    .stApp.dark [data-testid="stFileUploader"] {
        color: white !important;
    }
    
    .stApp.dark [data-testid="stFileUploader"] p {
        color: rgba(255, 255, 255, 0.9) !important;
    }
    
    .stApp.dark [data-testid="stFileUploader"] small {
        color: rgba(255, 255, 255, 0.7) !important;
    }
    
    .stApp.dark [data-testid="stFileUploader"] svg {
        fill: white !important;
    }
    
    .stApp.dark [data-testid="stFileUploader"] button {
        color: white !important;
        border-color: rgba(255, 255, 255, 0.2) !important;
    }
    
    .stApp.dark [data-testid="stFileUploader"] [data-testid="stMarkdownContainer"] {
        color: rgba(255, 255, 255, 0.9) !important;
    }
    
    .stApp.dark .drag-and-drop-text {
        color: white !important;
    }
    
    /* Animations */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes slideIn {
        from { transform: translateX(-10px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    /* Apply animations to elements */
    .stButton button {
        transition: all 0.3s ease !important;
        animation: fadeIn 0.5s ease-out;
    }
    
    .stButton button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
    }
    
    .stButton button:active {
        transform: translateY(0px) !important;
    }
    
    /* Theme toggle button specific styles */
    .theme-toggle {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
    }
    
    .theme-toggle button {
        border-radius: 50% !important;
        width: 40px !important;
        height: 40px !important;
        padding: 0px !important;
        transition: all 0.3s ease !important;
        animation: fadeIn 0.5s ease-out;
    }
    
    .theme-toggle button:hover {
        transform: rotate(180deg) !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
    }
    
    /* File uploader animations */
    [data-testid="stFileUploader"] {
        transition: all 0.3s ease;
        animation: fadeIn 0.5s ease-out;
    }
    
    [data-testid="stFileUploader"]:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    /* Checkbox animations */
    .stCheckbox {
        transition: all 0.2s ease;
        animation: slideIn 0.3s ease-out;
    }
    
    .stCheckbox:hover {
        transform: translateX(2px);
    }
    
    /* Select box animations */
    div[data-baseweb="select"] {
        transition: all 0.3s ease;
        animation: fadeIn 0.5s ease-out;
    }
    
    div[data-baseweb="select"]:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    /* Success message animation */
    div[data-testid="stAlert"] {
        animation: pulse 0.5s ease-out;
    }
    
    /* Table animations */
    div[data-testid="stTable"] {
        animation: fadeIn 0.5s ease-out;
    }
    
    /* Tab animations */
    .stTabs [data-baseweb="tab-list"] {
        transition: all 0.3s ease;
    }
    
    .stTabs [data-baseweb="tab"] {
        transition: all 0.2s ease;
    }
    
    .stTabs [data-baseweb="tab"]:hover {
        transform: translateY(-2px);
    }
    
    /* Loading spinner animation */
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .stSpinner {
        animation: spin 1s linear infinite;
    }
    
    /* Main content fade in */
    .main .block-container {
        animation: fadeIn 0.5s ease-out;
    }
    
    /* Ensure uploaded file is visible in both themes */
    [data-testid="stFileUploader"] {
        background: transparent !important;
    }
    
    /* Light theme - force black text for uploaded file */
    .stApp.light [data-testid="stFileUploader"] p {
        color: black !important;
    }
    
    .stApp.light [data-testid="stFileUploader"] span {
        color: black !important;
    }
    
    .stApp.light [data-testid="stFileUploader"] div {
        color: black !important;
    }
    
    .stApp.light [data-testid="stFileUploader"] [data-testid="stMarkdownContainer"] {
        color: black !important;
    }
    
    .stApp.light .uploadedFileName {
        color: #000000 !important;
    }
    
    /* Dark theme specific text colors */
    .stApp.dark [data-testid="stMarkdownContainer"] {
        color: rgba(255, 255, 255, 0.9) !important;
    }
    
    .stApp.dark .uploadedFileName {
        color: white !important;
    }
    
    .stApp.dark [data-testid="stFileUploader"] p,
    .stApp.dark [data-testid="stFileUploader"] span,
    .stApp.dark [data-testid="stFileUploader"] div,
    .stApp.dark [data-testid="stFileUploader"] [data-testid="stMarkdownContainer"] {
        color: white !important;
    }
</style>
""", unsafe_allow_html=True)

# Apply theme to body
st.markdown(f"""
    <script>
        document.body.setAttribute('data-theme', '{st.session_state.theme}');
    </script>
    """, unsafe_allow_html=True)

# Create a container for the theme toggle
toggle_col = st.container()
with toggle_col:
    _, right_col = st.columns([6, 1])
    with right_col:
        theme_icon = "🌑" if st.session_state.theme == 'light' else "☀️"
        if st.button(theme_icon, key="theme_toggle"):
            st.session_state.theme = 'dark' if st.session_state.theme == 'light' else 'light'
            st.rerun()

# Custom CSS for background and styling based on theme
dark_theme = """
<style>
    .stApp {
        background: linear-gradient(to bottom, rgba(14, 17, 23, 0.95), rgba(14, 17, 23, 0.95)),
                    url("https://transparenttextures.com/patterns/notebook-dark.png");
    }
    
    .stTabs [data-baseweb="tab-list"] {
        background-color: rgba(25, 30, 40, 0.95);
        padding: 10px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .stTabs [data-baseweb="tab"] {
        background-color: transparent;
        color: #FAFAFA;
        font-weight: 500;
    }
    
    div[data-testid="stForm"] {
        background-color: rgba(25, 30, 40, 0.95);
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    div.stButton > button {
        background-color: #FF4B4B;
        color: white;
        font-weight: bold;
    }
    
    div.stButton > button:hover {
        background-color: #FF3333;
    }
    
    .stCheckbox {
        background-color: rgba(25, 30, 40, 0.95);
        padding: 5px 10px;
        border-radius: 5px;
        margin: 2px 0;
        color: #FAFAFA;
    }
    
    div[data-testid="stMarkdownContainer"] {
        color: #FAFAFA;
    }
    
    div[data-baseweb="select"] {
        background-color: rgba(25, 30, 40, 0.95);
        border-radius: 5px;
        color: #FAFAFA;
    }
    
    .stDateInput {
        background-color: rgba(25, 30, 40, 0.95);
        border-radius: 5px;
        color: #FAFAFA;
    }
    
    div[data-testid="stFileUploader"] {
        background-color: rgba(25, 30, 40, 0.95);
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        color: #FAFAFA;
    }
    
    .stAlert {
        background-color: rgba(25, 30, 40, 0.95);
        color: #FAFAFA;
    }
</style>
"""

light_theme = """
<style>
    .stApp {
        background: linear-gradient(to bottom, rgba(240, 242, 246, 0.95), rgba(240, 242, 246, 0.95)),
                    url("https://transparenttextures.com/patterns/notebook-dark.png");
    }
    
    .stTabs [data-baseweb="tab-list"] {
        background-color: rgba(255, 255, 255, 0.95);
        padding: 10px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .stTabs [data-baseweb="tab"] {
        background-color: transparent;
        color: #0E1117;
        font-weight: 500;
    }
    
    div[data-testid="stForm"] {
        background-color: rgba(255, 255, 255, 0.95);
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    div.stButton > button {
        background-color: #FF4B4B;
        color: white;
        font-weight: bold;
    }
    
    div.stButton > button:hover {
        background-color: #FF3333;
    }
    
    .stCheckbox {
        background-color: rgba(255, 255, 255, 0.95);
        padding: 5px 10px;
        border-radius: 5px;
        margin: 2px 0;
    }
    
    div[data-testid="stMarkdownContainer"] {
        color: #0E1117;
    }
    
    div[data-baseweb="select"] {
        background-color: rgba(255, 255, 255, 0.95);
        border-radius: 5px;
    }
    
    .stDateInput {
        background-color: rgba(255, 255, 255, 0.95);
        border-radius: 5px;
    }
    
    div[data-testid="stFileUploader"] {
        background-color: rgba(255, 255, 255, 0.95);
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
</style>
"""

# Apply the appropriate theme
st.markdown(dark_theme if st.session_state.theme == 'dark' else light_theme, unsafe_allow_html=True)

# Define subjects for each department
DEPARTMENT_SUBJECTS = {
    'CSE': ['Python Programming', 'Data Structures', 'Database Management', 'Computer Networks', 'Operating Systems'],
    'ECE': ['Digital Electronics', 'Signals and Systems', 'Communication Systems', 'VLSI Design', 'Microprocessors'],
    'ISE': ['Information Security', 'Software Engineering', 'Web Technologies', 'Cloud Computing', 'AI & ML'],
    'MECH': ['Thermodynamics', 'Machine Design', 'Fluid Mechanics', 'Manufacturing Process', 'Engineering Materials']
}

st.title("Smart Attendance System")

# Initialize session state for attendance records if not exists
if 'attendance_history' not in st.session_state:
    st.session_state.attendance_history = []

# Function to check if attendance already exists
def attendance_exists(department, semester, subject, date_to_check):
    return any(
        record['Department'] == department and
        str(record['Semester']) == str(semester) and
        record['Subject'] == subject and
        record['Date'] == date_to_check
        for record in st.session_state.attendance_history
    )

# Create tabs for marking and viewing attendance
tab1, tab2 = st.tabs(["Mark Attendance", "View Attendance"])

with tab1:
    # Upload student list
    st.write("Please ensure your file has these columns in order: Semester, Name, AcademicYear, Department, USN")
    uploaded_file = st.file_uploader("Upload Student List (CSV/Excel)", type=["csv", "xlsx", "xls"])

    if uploaded_file is not None:
        try:
            # Read the uploaded file based on its type
            if uploaded_file.name.endswith('.csv'):
                df = pd.read_csv(uploaded_file, header=None, 
                               names=['Semester', 'Name', 'AcademicYear', 'Department', 'USN'])
            else:
                df = pd.read_excel(uploaded_file, header=None, engine='openpyxl',
                                 names=['Semester', 'Name', 'AcademicYear', 'Department', 'USN'])

            # Dropdowns for filtering
            department = st.selectbox("Select Department", options=sorted(DEPARTMENT_SUBJECTS.keys()), key="mark_dept")
            academic_year = st.selectbox("Select Academic Year", options=sorted(df['AcademicYear'].unique()), key="mark_year")
            semester = st.selectbox("Select Semester", options=sorted(df['Semester'].astype(str).unique()), key="mark_sem")
            
            # Get subjects for selected department
            subjects = DEPARTMENT_SUBJECTS.get(department, ['No subjects available'])
            subject = st.selectbox("Select Subject", options=subjects, key="mark_subject")
            
            attendance_date = st.date_input("Select Date", value=date.today(), key="mark_date")

            # Check if attendance already exists for this date
            if attendance_exists(department, semester, subject, attendance_date):
                st.warning(f"Attendance for {subject} on {attendance_date} has already been marked!")
            else:
                # Filter students based on selections
                filtered_df = df.copy()
                if department != df['Department'].iloc[0]:
                    st.warning(f"Note: The uploaded file contains students from {df['Department'].iloc[0]} department. Please upload the correct file for {department} department.")
                    filtered_df = pd.DataFrame(columns=df.columns)
                else:
                    filtered_df = df[
                        (df['Department'] == department) &
                        (df['AcademicYear'] == academic_year) &
                        (df['Semester'].astype(str) == semester)
                    ]

                if not filtered_df.empty:
                    st.subheader(f"Attendance for {subject} - {department}, Sem {semester} on {attendance_date}")
                    attendance_records = []

                    # Generate a unique key for this attendance session
                    session_key = f"{department}_{semester}_{subject}_{attendance_date}"
                    
                    # Check if we need to clear checkboxes
                    if 'last_submission_key' not in st.session_state:
                        st.session_state.last_submission_key = None

                    # Mark attendance with checkboxes
                    for _, row in filtered_df.iterrows():
                        # Create a unique key for each checkbox that includes the session
                        checkbox_key = f"{session_key}_{row['USN']}"
                        is_present = st.checkbox(
                            f"{row['USN']} - {row['Name']}", 
                            value=False, 
                            key=checkbox_key
                        )
                        attendance_records.append({
                            'USN': row['USN'],
                            'Name': row['Name'],
                            'Subject': subject,
                            'Department': department,
                            'Semester': semester,
                            'AcademicYear': academic_year,
                            'Date': attendance_date,
                            'Present': is_present
                        })

                    # Submit button
                    if st.button("Submit Attendance"):
                        st.session_state.attendance_history.extend(attendance_records)
                        st.success("Attendance submitted successfully!")
                        
                        # Create DataFrame for download
                        attendance_df = pd.DataFrame(attendance_records)
                        
                        # Offer both CSV and Excel download options
                        col1, col2 = st.columns(2)
                        
                        with col1:
                            # CSV Download
                            csv = attendance_df.to_csv(index=False)
                            st.download_button(
                                "Download as CSV",
                                data=csv,
                                file_name=f"attendance_{department}_{semester}_{subject}_{attendance_date}.csv",
                                mime='text/csv'
                            )
                        
                        with col2:
                            # Excel Download
                            buffer = io.BytesIO()
                            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                                attendance_df.to_excel(writer, index=False)
                            
                            st.download_button(
                                "Download as Excel",
                                data=buffer.getvalue(),
                                file_name=f"attendance_{department}_{semester}_{subject}_{attendance_date}.xlsx",
                                mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                            )
                        
                        # Update last submission key to trigger checkbox reset
                        st.session_state.last_submission_key = session_key
                        # Rerun the app to clear the checkboxes
                        st.rerun()
                else:
                    st.warning("No students found for the selected filters.")
        except Exception as e:
            st.error(f"Error reading file: {str(e)}")
            st.error("Please ensure your file has these columns: Semester, Name, AcademicYear, Department, USN")
    else:
        st.info("Please upload a student list file (CSV or Excel) to proceed.")

with tab2:
    st.subheader("View Attendance Records")
    
    if st.session_state.attendance_history:
        # Create filters for viewing
        view_dept = st.selectbox("Department", options=sorted(DEPARTMENT_SUBJECTS.keys()), key="view_dept")
        view_year = st.selectbox("Academic Year", options=sorted(set(record['AcademicYear'] for record in st.session_state.attendance_history)), key="view_year")
        view_sem = st.selectbox("Semester", options=sorted(set(str(record['Semester']) for record in st.session_state.attendance_history)), key="view_sem")
        view_subject = st.selectbox("Subject", options=DEPARTMENT_SUBJECTS[view_dept], key="view_subject")
        col1, col2 = st.columns(2)
        with col1:
            from_date = st.date_input("From Date", value=date.today(), key="from_date")
        with col2:
            to_date = st.date_input("To Date", value=date.today(), key="to_date")

        if st.button("Show Attendance"):
            # Filter records based on selection
            filtered_records = [
                record for record in st.session_state.attendance_history
                if (record['Department'] == view_dept and
                    record['AcademicYear'] == view_year and
                    str(record['Semester']) == view_sem and
                    record['Subject'] == view_subject and
                    from_date <= record['Date'] <= to_date)
            ]

            if filtered_records:
                # Convert records to DataFrame
                view_df = pd.DataFrame(filtered_records)
                
                # Create pivot table with dates as columns
                pivot_df = pd.pivot_table(
                    view_df,
                    values='Present',
                    index=['USN', 'Name'],
                    columns='Date',
                    aggfunc=lambda x: 'Present' if x.iloc[0] else 'Absent',
                    fill_value='NA'
                ).reset_index()
                
                # Sort columns to ensure dates are in order
                date_columns = sorted([col for col in pivot_df.columns if isinstance(col, date)])
                column_order = ['USN', 'Name'] + date_columns
                
                # Reorder columns
                pivot_df = pivot_df[column_order]
                
                # Display the table
                st.table(pivot_df)
                
                # Add download buttons for both CSV and Excel
                col1, col2 = st.columns(2)
                
                with col1:
                    # CSV Download
                    csv = pivot_df.to_csv(index=False)
                    st.download_button(
                        "Download Report as CSV",
                        data=csv,
                        file_name=f"attendance_report_{view_dept}_{view_sem}_{view_subject}_{from_date}_to_{to_date}.csv",
                        mime='text/csv'
                    )
                
                with col2:
                    # Excel Download
                    buffer = io.BytesIO()
                    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                        pivot_df.to_excel(writer, index=False)
                    
                    st.download_button(
                        "Download Report as Excel",
                        data=buffer.getvalue(),
                        file_name=f"attendance_report_{view_dept}_{view_sem}_{view_subject}_{from_date}_to_{to_date}.xlsx",
                        mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    )
            else:
                st.warning("No attendance records found for the selected criteria.")
    else:
        st.info("No attendance records available. Please mark attendance first.")
