# Photo Gallery Application

A web application for managing and sharing photo galleries with access code control, featuring comprehensive EXIF data storage and S3 integration.

## Features

- Photo upload and management
- Access code-based authentication
- Admin and viewer roles
- S3/Local storage options
- Responsive photo gallery
- Print selection system
- Multiple image sizes for optimal performance
- Complete EXIF data capture
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
- EXIF data extraction
- Image processing

## Components

### Backend Services

#### StorageService
Abstract interface for storage operations:
- uploadFile
- uploadBuffer
- deleteFile
- getFileUrl

#### LocalStorageService
Local filesystem implementation:
- Stores files in configured directories
- Maintains original, medium, and thumbnail versions
- Handles file cleanup

#### S3StorageService
Amazon S3 implementation:
- Secure file storage
- Signed URLs for time-limited access
- Bucket organization by access code
- Automatic file versioning

### Backend Routes

#### Photos (/api/photos)
- POST /upload - Upload photos with EXIF extraction
- GET /:accessCode - Get photos for access code
- DELETE /:id - Delete photo
- POST /:id/select-print - Select photo for printing

#### Access Codes (/api/access-codes)
- POST / - Create new access code
- GET / - List access codes
- POST /assign - Assign additional access code
- GET /search - Search access codes
- GET /search-codes - Search codes for upload

#### Print Selections (/api/print-selections)
- GET / - Get print selections
- GET /download-all - Download selected photos as ZIP
- DELETE /:id - Remove print selection

### Frontend Components

#### PhotoGallery
Main gallery view:
- Grid layout with thumbnails
- Slideshow view
- Print selection
- Download options
- EXIF data display

#### AdminDashboard
Admin control panel:
- ManageAccessCodes: Create/manage access codes
- UploadPhotos: Photo upload with progress
- ViewGallery: Browse all galleries
- PrintSelections: View/manage selections
- ExistingAccessCodes: List all codes
- AssignAccessCode: Add codes to users

## Setup

### Prerequisites
- Node.js (v14 or higher)
- npm
- AWS S3 bucket (for S3 storage)
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
STORAGE_TYPE=s3  # or 'local'

# S3 Configuration (if using S3)
S3_BUCKET=your_bucket_name
AWS_REGION=your_region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Local Storage Configuration (if using local)
LOCAL_UPLOAD_DIR=photo-uploads
LOCAL_TEMP_DIR=temp_uploads
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

## Image Processing

The system processes images in three sizes:
1. Original: Full resolution with EXIF data
2. Medium: 2000px wide for slideshow
3. Thumbnail: 500px for grid view

### EXIF Data Handling

The system captures and stores:
1. Camera Information:
   - Make and model
   - Lens details
   - Software version

2. Technical Settings:
   - Exposure settings
   - Aperture
   - ISO
   - Focal length
   - Flash settings

3. Image Details:
   - Dimensions
   - Color space
   - GPS data (if available)
   - Date/time
   - Copyright info

4. Raw Data:
   - Complete EXIF structure
   - Manufacturer-specific tags
   - Base64 encoded original data

## Security Features

- JWT-based authentication
- Secure file storage
- CORS protection
- Security headers
- Request logging
- Error handling
- Signed URLs for S3

## Dependencies

### Key Backend Packages
- express - Web framework
- @aws-sdk/* - AWS S3 integration
- sharp - Image processing
- exif-reader - EXIF extraction
- archiver - ZIP creation
- jsonwebtoken - Authentication
- multer - File upload
- sqlite3 - Database
- helmet - Security
- compression - Performance
- morgan - Logging

### Key Frontend Packages
- react - UI framework
- axios - HTTP client
- jwt-decode - Token handling
