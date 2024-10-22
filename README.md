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

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- SQLite

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

3. Set up the database and create an admin account:
   ```
   node setupAdminAccount.js
   ```

4. Start the backend server:
   ```
   npm start
   ```

5. In a new terminal, start the frontend development server:
   ```
   cd ../frontend
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000` to access the application.

## Usage

For detailed usage instructions, please refer to the [User Documentation](USER_DOCUMENTATION.md).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Developed by Salz Studio & DevStack.One
- Built with React, Node.js, and SQLite
