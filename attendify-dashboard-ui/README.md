# Attendify Dashboard UI

A modern, responsive dashboard interface for the Smart Attendance System that provides real-time attendance tracking, analytics, and management capabilities.

## Features

- **Real-time Dashboard**: View live attendance statistics and analytics
- **Student Management**: Add, edit, and manage student profiles
- **Attendance Tracking**: Monitor attendance records with detailed insights
- **Course Management**: Manage courses, schedules, and attendance rules
- **Analytics & Reports**: Generate detailed attendance reports and visualizations
- **Responsive Design**: Fully responsive interface that works on all devices

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn-ui components
- **Build Tool**: Vite
- **State Management**: React Context/Hooks
- **Charts & Visualizations**: Recharts/Chart.js

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd attendify-dashboard-ui
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
attendify-dashboard-ui/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── layouts/       # Layout components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API services
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   └── styles/        # Global styles and Tailwind config
├── public/            # Static assets
└── ...config files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
