# EuroMotors Internal Platform

A comprehensive internal platform for EuroMotors that centralizes and automates key business processes through integrated tools and services.

## 🚀 Overview

EuroMotors Internal Platform is a modern web application built with React and TypeScript, serving as the digital backbone of EuroMotors’ internal operations. The platform provides secure access to various third-party services and internal tools, streamlining workflows and improving productivity.

## 🏗️ Architecture

### Frontend Stack

- **React 19** with TypeScript for type-safe development
- **Vite 6** for fast development and optimized build process
- **Tailwind CSS 4** for modern, responsive UI design
- **React Router 7** for navigation and routing
- **Clerk** for authentication and user management

### Backend Stack

- **Node.js** with Express.js for RESTful API
- **TypeScript** for type safety and a better developer experience
- **AWS S3** for cloud storage of images and files
- **Playwright** for web scraping and automation
- **Multer** for file uploads and management

### Third-party Services

- **CarCutter API** - AI-powered image processing for vehicle photos
- **AWS S3** - Cloud storage for processed images
- **Scrape.do** - Web scraping with proxy support
- **Blocket.se** - Automated data extraction from car listings

## 📁 Project Structure

```
Internal Platform/
├── backend/                    # Express.js API server
│   ├── controllers/           # API controllers
│   ├── services/              # Business logic services
│   ├── routes/                # API routes
│   ├── middlewares/           # Express middlewares
│   ├── config/                # Configuration files
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Helper functions
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── image-editor/  # Image processing interface
│   │   │   ├── data-editor/   # Data management tools
│   │   │   ├── scrape-editor/ # Web scraping tools
│   │   │   └── ui/           # Basic UI components
│   │   ├── pages/            # Main pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── contexts/         # React contexts
│   │   ├── libs/             # External libraries
│   │   └── utils/            # Utilities
│   └── public/               # Static files
└── docker-compose.yml        # Docker configuration
```

## 🛠️ Key Features

### 1. **Image Processing (Image Editor)**

- **AI-based background removal** via CarCutter API
- **Batch processing** of multiple images simultaneously
- **Support for multiple image formats** (JPG, PNG, WebP)
- **Cloud storage** with AWS S3 integration
- **Automatic license plate overlays** for EuroMotors and CarTrade24
- **Customizable scenes** and overlay images

### 2. **Data Management (Data Editor)**

- **Excel file processing** with XLSX library
- **Data validation** and transformation using Zod
- **Export functions** for processed data
- **Template-based data entry**
- **Structured data management** for vehicle catalogs

### 3. **Web Scraping (Scrape Editor)**

- **Blocket.se integration** for automatic car listing extraction
- **Playwright-based scraping** with headless browser
- **Proxy support** to avoid detection
- **Image downloading** and automatic processing
- **Configurable scraping parameters**

### 4. **Security Features**

- **Clerk authentication** with Google OAuth
- **Protected API access** with middleware
- **Environment variable management** for sensitive data
- **Input validation** and sanitization
- **CORS configuration** for secure communication

## 🔐 Security and Authentication

### Authentication System

- **Clerk** with Google OAuth integration
- **Protected routes** with `ProtectedRoute` component
- **Automatic redirection** for unauthenticated users
- **SSO callback** handling

### API Security

- **Helmet** for security headers
- **CORS configuration** with specified origins
- **Input validation** with express-validator
- **Rate limiting** and timeout handling

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (optional for containerization)
- Access to EuroMotors' internal network

### Installation

1. **Clone the repository**

   ```bash
   git clone [repository-url]
   cd internal-platform
   ```

2. **Install dependencies**

   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

3. **Environment variables**

   ```bash
   # Create .env files in both frontend/ and backend/
   # See .env.example for required variables
   ```

4. **Start development environment**

   **Using Docker (recommended):**

   ```bash
   docker-compose up --build
   ```

   **Manually:**

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

### Access

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health

## 🎨 UI/UX Features

### Design System

- **Dark theme** for a professional work environment
- **Responsive design** that works on desktop and mobile
- **Modern component architecture** with reusable elements
- **Accessibility** following WCAG guidelines

### User Experience

- **Loading indicators** for smooth user experience
- **Error handling** with clear messages
- **Debug terminal** for developers
- **Toast notifications** for feedback

## 🔧 Development

### Code Standards

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Functional programming** patterns
- **DRY and SOLID** principles

### Build Process

```bash
# Frontend
npm run build    # Production build
npm run preview  # Preview the build
npm run lint     # Linting

# Backend
npm run build    # TypeScript compilation
npm run dev      # Development mode with hot reload
```

### Docker Support

- **Multi-stage builds** for optimized images
- **Development containers** with hot reload
- **Production-ready** configuration

## 📈 Performance and Optimization

### Frontend Optimization

- **Code splitting** with dynamic imports
- **Tree shaking** for smaller bundle size
- **Vite** for fast development and build
- **React.memo** for component optimization

### Backend Optimization

- **Asynchronous processing** for heavy operations
- **Connection pooling** for database connections
- **Caching** of API responses
- **Streaming** for large files

## 🧪 Testing and Quality Assurance

### Code Quality

- **TypeScript** for compile-time checks
- **ESLint** for code standards
- **Prettier** for consistent formatting
- **Manual testing** with debug terminal

### Security Testing

- **Input validation** on all endpoints
- **CORS configuration** for secure communication
- **Environment variable validation**
- **Error handling** for robust applications

## 📚 Documentation and Support

### API Documentation

- **Swagger/OpenAPI** integration (planned)
- **Inline comments** for complex logic
- **Type definitions** for all interfaces

### Troubleshooting

- **Debug terminal** in frontend
- **Console logging** with structured output
- **Error boundaries** for React components

## 🔄 Deployment and CI/CD

### Environments

- **Development** - Local development
- **Staging** - Test environment (planned)
- **Production** - Live environment

### Deployment

- **Docker containers** for a consistent environment
- **Environment variables** for configuration
- **Health checks** for monitoring

## 📋 Roadmap and Future Features

### Planned Improvements

- [ ] **Apify integration** for advanced web scraping
- [ ] **Bulk operations** for large datasets
- [ ] **API rate limiting** and caching
- [ ] **Real-time notifications** with WebSockets
- [ ] **Advanced image processing** with more AI services
- [ ] **Data export** in multiple formats (CSV, JSON, XML)
- [ ] **User management** and role-based access
- [ ] **Audit logging** for security tracking

### Technical Enhancements

- [ ] **Unit testing** with Jest/Vitest
- [ ] **E2E testing** with Playwright
- [ ] **Performance monitoring** with APM
- [ ] **Database integration** for persistent storage
- [ ] **Microservices architecture** for scalability

## 🤝 Contribution and Development

### Development Process

1. **Fork** the repository
2. **Create a feature branch** from main
3. **Implement changes** with clear commits
4. **Test changes locally** before pushing
5. **Create a Pull Request** with a description

### Coding Standards

- Follow existing TypeScript/React patterns
- Use semantic commit messages
- Include documentation for new features
- Test changes locally before submission

## 📞 Support and Contact

For technical questions or support, contact the development team via:

- **Internal Slack** - #internal-platform
- **Email** - support@eumotors.com
- **GitHub Issues** - For bug reports and feature requests

---

**Version:** 1.0.0  
**Last updated:** 2024  
**License:** EuroMotors AG
