# Photo Gallery Application

A web application for managing and sharing photo galleries with access code control.

## Features

- Photo upload and management
- Access code-based authentication
- Admin and viewer roles
- S3 storage integration
- Responsive photo gallery
- Print selection system
- Multiple image sizes for optimal performance
- Bulk photo downloads with ZIP compression

## Technical Stack

### Frontend
- React
- Axios for API calls
- JWT for authentication
- Responsive design

### Backend
- Node.js with Express
- SQLite database
- AWS S3 for photo storage
- JWT authentication
- Security middleware (helmet, cors)
- Performance optimizations (compression)
- Archiver for ZIP downloads

## Setup

### Prerequisites
- Node.js (v14 or higher)
- npm
- AWS S3 bucket
- Apache web server (for production)

### Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create .env file with the following variables:
```
# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Storage Configuration
STORAGE_TYPE=s3

# S3 Configuration
S3_BUCKET=your_bucket_name
AWS_REGION=your_region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

3. Start the server:
```bash
npm start
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

### Production Deployment

1. Apache Configuration:
```apache
<VirtualHost *:80>
    ServerName your-domain.com

    # First, handle /api requests
    ProxyPass        /api        http://localhost:5001/api nocanon
    ProxyPassReverse /api        http://localhost:5001/api

    # Then handle all other requests
    ProxyPass        /           http://localhost:8080/
    ProxyPassReverse /           http://localhost:8080/

    ErrorLog "logs/error.log"
    CustomLog "logs/access.log" combined
</VirtualHost>
```

2. Build frontend:
```bash
cd frontend
npm run build
```

3. Start backend:
```bash
cd backend
npm start
```

## Security Features

- JWT-based authentication
- Secure file storage with S3 signed URLs
- CORS protection
- Security headers with helmet
- Request logging
- Error handling middleware

## Image Processing

The system handles three image sizes:
1. Original: Full resolution (for downloads)
2. Medium: 2000px wide (for slideshow/modal views)
3. Thumbnail: 500px (for grid views)

## Download Features

- Individual photo downloads
- Bulk downloads with ZIP compression (using archiver)
- Automatic cleanup of temporary files
- Progress tracking for large downloads

## API Endpoints

### Authentication
- POST /api/auth/login - Login with access code

### Access Codes
- POST /api/access-codes - Create new access code
- GET /api/access-codes - List access codes
- POST /api/access-codes/assign - Assign additional access code

### Photos
- POST /api/photos/upload - Upload photos
- GET /api/photos/:accessCode - Get photos for access code
- DELETE /api/photos/:id - Delete photo
- POST /api/photos/:id/select-print - Select photo for printing

### Print Selections
- GET /api/print-selections - Get print selections
- GET /api/print-selections/download-all - Download all selected photos as ZIP
- DELETE /api/print-selections/:id - Remove print selection

## Dependencies

### Key Backend Packages
- express - Web framework
- @aws-sdk/* - AWS S3 integration
- sharp - Image processing
- archiver - ZIP file creation
- jsonwebtoken - Authentication
- multer - File upload handling
- sqlite3 - Database
- helmet - Security headers
- compression - Response compression
- morgan - Request logging
- body-parser - Request parsing
