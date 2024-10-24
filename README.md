# Photo Gallery Application

This is a React-based web application for managing and viewing photo galleries with access code protection. It includes an admin dashboard for managing access codes and uploading photos, and a viewer interface for users to view and select photos for printing.

## Features

- Admin Dashboard:
  - Manage access codes
  - Upload photos
  - View existing access codes
  - View and manage photo galleries
  - See print selections
- Viewer Interface:
  - Access photo galleries using access codes
  - View photos in a gallery
  - Select photos for printing
- Secure authentication system
- Responsive design
- Flexible storage options:
  - Local disk storage
  - Amazon S3 storage

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- SQLite
- (Optional) Amazon S3 bucket and credentials for S3 storage

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/photo-gallery-app.git
   cd photo-gallery-app
   ```

2. Install dependencies for both frontend and backend:
   ```
   cd frontend
   npm install
   cd ../backend
   npm install
   ```

3. Configure the environment:
   ```
   cd backend
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration:
   - For local storage (default):
     ```
     STORAGE_TYPE=local
     ```
   - For S3 storage:
     ```
     STORAGE_TYPE=s3
     S3_BUCKET=your-bucket-name
     AWS_REGION=your-region
     AWS_ACCESS_KEY_ID=your-access-key
     AWS_SECRET_ACCESS_KEY=your-secret-key
     ```

4. Set up the database and create an admin account:
   ```
   node setupAdminAccount.js
   ```

5. Start the backend server:
   ```
   npm start
   ```

6. In a new terminal, start the frontend development server:
   ```
   cd ../frontend
   npm start
   ```

7. Open your browser and navigate to `http://localhost:3000` to access the application.

## Storage Configuration

The application supports two storage options for photos:

### Local Storage
- Default option
- Stores files on the local disk
- Configure through environment variables:
  ```
  STORAGE_TYPE=local
  LOCAL_UPLOAD_DIR=photo-uploads
  LOCAL_TEMP_DIR=temp_uploads
  ```

### Amazon S3 Storage
- Stores files in Amazon S3
- Requires an S3 bucket and AWS credentials
- Configure through environment variables:
  ```
  STORAGE_TYPE=s3
  S3_BUCKET=your-bucket-name
  AWS_REGION=your-region
  AWS_ACCESS_KEY_ID=your-access-key
  AWS_SECRET_ACCESS_KEY=your-secret-key
  ```

## Usage

For detailed usage instructions, please refer to the [User Documentation](USER_DOCUMENTATION.md).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Developed by Salz Studio & DevStack.One
- Built with React, Node.js, and SQLite
