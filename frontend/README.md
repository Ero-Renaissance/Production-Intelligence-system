# Production Intelligence System

A modern web application for real-time production monitoring, gap analysis, and intelligent optimization in oil and gas operations.

## Features

- **Real-time Production Monitoring**
  - Asset-level KPIs (East and West Assets)
  - Production unit drill-down
  - Terminal operations tracking

- **Intelligent Automation**
  - Automated gap analysis
  - ML-based pattern recognition
  - Dynamic cargo forecasting
  - Constraint detection and optimization

- **Role-Based Dashboards**
  - Production Monitoring Engineers
  - Performance Management Engineers
  - Production Programmers

## Tech Stack

- React 18 with TypeScript
- TailwindCSS for styling
- React Query for data fetching
- MSW (Mock Service Worker) for API mocking
- ApexCharts for data visualization
- React Router v6 for navigation

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/production-intelligence-system.git
   cd production-intelligence-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open the application**
   Navigate to `http://localhost:5173` in your browser

## Project Structure

```
production-gap-forecast/
├── src/
│   ├── api/              # API client and mock configurations
│   ├── components/       # Reusable React components
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── public/              # Static assets
└── tests/              # Test files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=/api
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Documentation

Additional documentation:
- [Technical Requirements](./Technical%20requirement.txt)
- [System Capabilities](./SYSTEM_CAPABILITIES.md)
- [Implementation Plan](./PROJECT_IMPLEMENTATION_PLAN.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Your Name - your.email@example.com
Project Link: https://github.com/yourusername/production-intelligence-system
