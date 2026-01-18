# EuroMotors AG - Internal Tool Platformsss

A comprehensive internal platform designed to streamline EuroMotors' business operations through integrated tools and services.

## 🚀 Overview

The EuroMotors Internal Tool Platform is a modern web application built with React and TypeScript, providing centralized access to essential business tools and services. This platform serves as the digital backbone for EuroMotors' internal operations, offering secure access to various third-party services and internal utilities.

## 🏗️ Architecture

### Frontend Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for modern, responsive UI
- **React Router** for navigation

### Backend Stack

- **Node.js** with Express
- **TypeScript** for type safety
- **AWS S3** for file storage
- **CarCutter API** for image processing

## Authentication

- **Clerk** with Only Google OAuth integration

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── data-editor/     # Data editing tools
│   │   ├── image-editor/    # Image processing interface
│   │   ├── scrape-editor/   # Web scraping tools
│   │   └── ui/             # Base UI components
│   ├── pages/              # Main application pages
│   │   ├── Home.tsx        # Dashboard overview
│   │   ├── Image.tsx       # Image processing
│   │   ├── Data.tsx        # Data management
│   │   └── Scrape.tsx      # Web scraping
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── libs/               # External libraries
```

## 🛠️ Core Features

### 1. **Image Processing**

- Integration with CarCutter API for automotive image processing
- Batch image processing capabilities
- Multiple image format support
- Cloud storage integration with AWS S3

### 2. **Data Management**

- Excel file processing and editing
- Data validation and transformation
- Export capabilities for processed data
- Template-based data entry

### 3. **Web Scraping Tools**

- Integration with Scrape.do and Apify services
- Configurable scraping parameters
- Data extraction and processing
- Proxy and geotargeting support

## 🔐 Security Features

### Credential Protection

- **Environment Variables**: Sensitive data stored in `.env` files handled by Github Management
- **Obfuscation System**: Custom password obfuscation using fake API URLs
- **Secure Display**: Credentials hidden in UI with copy-to-clipboard functionality
- **No Plain Text**: Passwords never displayed in plain text

### Access Control

- Internal platform access only
- Secure API endpoints
- Input validation and sanitization

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Access to EuroMotors internal network

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

3. **Environment Setup**

   ```bash
   # Create .env file in frontend/
   cp .env.example .env

   # ... other credentials
   ```

4. **Start Development**

   ```bash
   # Frontend (from frontend/)
   npm run dev

   # Backend (from backend/)
   npm run dev
   ```

## 📊 Third-Party Integrations

### Active Services

- **CarCutter.com** - AI-powered automotive image processing
- **AWS S3** - Cloud storage for processed images
- **Scrape.do** - Web scraping with proxy support

## 🎨 UI/UX Features

- **Dark Theme**: Professional dark interface
- **Responsive Design**: Works on desktop and mobile
- **Modern Components**: Clean, intuitive interface
- **Accessibility**: WCAG compliant design
- **Loading States**: Smooth user experience
- **Error Handling**: Graceful error management

## 🔧 Development

### Code Standards

- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Functional Components**: Modern React patterns
- **Custom Hooks**: Reusable logic

### Security Best Practices

- Environment variable protection
- Input validation
- XSS prevention
- Secure API communication
- Credential obfuscation

---
