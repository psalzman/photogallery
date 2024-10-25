# Photo Gallery User Documentation

## Overview

This photo gallery system allows photographers to share photos with clients using access codes. It supports different user roles, photo selection for printing, and secure photo downloads including bulk downloads.

## User Roles

### Admin
- Create and manage access codes
- Upload photos
- View all galleries
- Delete photos
- View print selections
- Download selected photos in bulk

### Viewer
- View assigned gallery
- Select photos for printing
- Download individual photos
- Download selected photos in bulk

## Features

### Photo Viewing
- Grid view with thumbnails
- Slideshow view with medium-resolution images
- Full-resolution downloads
- Print selection capability
- Bulk download options

### Access Code Management
- Each gallery is protected by an access code
- Users can have multiple access codes
- Access codes can be assigned to different roles

## Usage Guide

### For Admins

#### Login
1. Navigate to the login page
2. Enter your admin access code
3. You'll be redirected to the admin dashboard

#### Managing Access Codes
1. Go to "Manage Access Codes"
2. To create a new access code:
   - Enter email, full name, and desired access code
   - Select role (viewer or admin)
   - Click "Create Access Code"
3. To assign additional access code:
   - Search for existing user
   - Enter new access code
   - Click "Assign Access Code"

#### Uploading Photos
1. Go to "Upload Photos"
2. Search for the target access code
3. Select photos (up to 100 at a time)
4. Click "Upload Photos"
5. Wait for upload completion

#### Viewing Galleries
1. Go to "View Gallery"
2. Search for access code or email
3. Click on the desired gallery
4. You can:
   - View photos in grid or slideshow
   - Delete photos
   - See print selections
   - Download selected photos

### For Viewers

#### Login
1. Navigate to the login page
2. Enter your access code
3. You'll be redirected to your gallery

#### Viewing Photos
1. Grid View:
   - Thumbnails are displayed in a grid
   - Click any photo to enter slideshow view
2. Slideshow View:
   - Use arrow keys or buttons to navigate
   - Click outside photo to exit

#### Selecting Photos for Printing
1. In grid view, click "Select for Printing"
2. Confirm your selection
3. Selected photo will be marked with a checkmark
4. Selection is final and cannot be changed

#### Downloading Photos
1. Individual Downloads:
   - Click "Download" under any photo
   - Photo will be downloaded in full resolution

2. Bulk Downloads:
   - After selecting photos for printing
   - Click "Download All Selected Photos"
   - Wait for ZIP file preparation
   - ZIP file will automatically download
   - Contains all selected photos in full resolution

## Technical Notes

### Image Sizes
The system provides three image sizes:
1. Thumbnails (500px) - Used in grid view
2. Medium (2000px) - Used in slideshow/modal views
3. Original - Used for downloads

### Download Options
- Individual photo downloads
- Bulk downloads as ZIP files
- All downloads are in original resolution
- ZIP files are automatically cleaned up

### Security
- All access is controlled by access codes
- Photos are stored securely in S3
- Downloads use time-limited secure URLs
- Sessions expire after 1 hour
- ZIP files are temporary and auto-deleted

### Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

### Performance Tips
- Photos are automatically optimized for different views
- Use grid view for browsing
- Slideshow loads medium-resolution images for better performance
- Downloads provide full-resolution files
- Large ZIP downloads may take time to prepare

## Troubleshooting

### Common Issues

#### Login Problems
- Ensure access code is entered correctly
- Check for spaces before or after the code
- Try logging out and back in

#### Photo Display Issues
- Refresh the page
- Clear browser cache
- Check internet connection

#### Download Issues
- For individual downloads:
  - Check browser download settings
  - Ensure stable internet connection
- For bulk downloads:
  - Allow sufficient time for ZIP preparation
  - Check available disk space
  - Try downloading fewer photos if ZIP is too large

#### Upload Issues
- Ensure photos are in supported format (JPEG, PNG)
- Check file size limits
- Ensure stable internet connection

### Getting Help
Contact system administrator if you:
- Can't access your gallery
- Need a new access code
- Experience technical issues
- Need to change photo selections
- Have problems with downloads
