# Smart Attendance System

A comprehensive attendance management system with a Python backend and React frontend.

## Features

- Mark and track student attendance
- Support for multiple departments and subjects
- Export attendance records in CSV and Excel formats
- View attendance history with date range filtering
- Dark/Light theme support
- Responsive and modern UI

## Project Structure

```
Smart_Attendance_System/
├── api.py                 # Backend API server
├── requirements.txt       # Python dependencies
├── attendify-dashboard-ui/# Frontend React application
│   ├── src/              # Frontend source code
│   ├── package.json      # Frontend dependencies
│   └── ...
└── ...
```

## Setup Instructions

### Backend Setup

1. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the backend server:
   ```bash
   python api.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd attendify-dashboard-ui
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Development

- Backend API runs on: http://localhost:5000
- Frontend development server runs on: http://localhost:5173

## Deployment

### Backend Deployment

- The backend can be deployed to any Python-supporting platform (e.g., Heroku, DigitalOcean, AWS)
- Make sure to set appropriate environment variables

### Frontend Deployment

- Build the frontend for production:
  ```bash
  cd attendify-dashboard-ui
  npm run build
  ```
- Deploy the contents of the `dist` directory to any static hosting service (e.g., Vercel, Netlify, GitHub Pages)

## Environment Variables

### Backend

Create a `.env` file in the root directory with:

```
DATABASE_URL=...
SECRET_KEY=...
```

### Frontend

Create a `.env` file in the `attendify-dashboard-ui` directory with:

```
VITE_API_URL=http://localhost:5000  # Update with production API URL when deploying
```

## API Endpoints

- `GET /api/departments` - Get list of departments
- `GET /api/subjects/<department>` - Get subjects for a department
- `POST /api/upload-students` - Upload student list (CSV/Excel)
- `POST /api/mark-attendance` - Mark attendance for a class
- `GET /api/view-attendance` - View attendance records with filters

## File Format

The student list file (CSV/Excel) should have the following columns in order:

- Semester
- Name
- AcademicYear
- Department
- USN (University Seat Number)

## Contributing

Feel free to submit issues and enhancement requests!
