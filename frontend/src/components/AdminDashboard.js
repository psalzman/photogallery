import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function ProgressBar({ progress }) {
  return (
    <div style={styles.progressContainer}>
      <div style={{...styles.progressBar, width: `${progress}%`}}></div>
      <span style={styles.progressText}>{progress.toFixed(0)}%</span>
    </div>
  );
}

function AdminDashboard() {
  const [accessCodes, setAccessCodes] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newRole, setNewRole] = useState('viewer');
  const [photos, setPhotos] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedAccessCode, setSelectedAccessCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [printSelections, setPrintSelections] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [assignEmail, setAssignEmail] = useState('');
  const [assignCode, setAssignCode] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [accessCodeSearchQuery, setAccessCodeSearchQuery] = useState('');
  const [accessCodeSearchResults, setAccessCodeSearchResults] = useState([]);
  const [galleryAccessCodeSearchQuery, setGalleryAccessCodeSearchQuery] = useState('');
  const [galleryAccessCodeSearchResults, setGalleryAccessCodeSearchResults] = useState([]);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/');
  }, [navigate]);

  const fetchAccessCodes = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/access-codes', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAccessCodes(response.data.accessCodes);
    } catch (err) {
      setError('Failed to fetch access codes. Please try again.');
      console.error('Error fetching access codes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.role !== 'admin') {
          handleLogout();
        } else {
          fetchAccessCodes();
          fetchPrintSelections();
        }
      } catch (err) {
        console.error('Error decoding token:', err);
        handleLogout();
      }
    } else {
      handleLogout();
    }
  }, [handleLogout, fetchAccessCodes]);

  const fetchPrintSelections = async () => {
    setError('');
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/print-selections', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPrintSelections(response.data.printSelections);
    } catch (err) {
      setError('Failed to fetch print selections. Please try again.');
      console.error('Error fetching print selections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchViewerPhotos = async (accessCode) => {
    setError('');
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/photos/${accessCode}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPhotos(response.data.photos.map(photo => ({
        ...photo,
        thumbnailUrl: `http://localhost:5001/photo-uploads/${accessCode}/${photo.thumbnail_filename}`,
        fullUrl: `http://localhost:5001/photo-uploads/${accessCode}/${photo.filename}`
      })));
    } catch (err) {
      setError('Failed to fetch viewer photos. Please try again.');
      console.error('Error fetching viewer photos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccessCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newEmail || !newFullName || !newCode || !newRole) {
      setError('All fields are required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/api/access-codes', {
        email: newEmail,
        fullName: newFullName,
        code: newCode,
        role: newRole
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setMessage('Access code created successfully.');
      setNewEmail('');
      setNewFullName('');
      setNewCode('');
      setNewRole('viewer');
      fetchAccessCodes();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An unexpected error occurred while creating the access code. Please try again.');
      }
      console.error('Error creating access code:', err);
    }
  };

  const handleAssignAccessCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!assignEmail || !assignCode) {
      setError('Email and new access code are required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/api/access-codes/assign', {
        email: assignEmail,
        newCode: assignCode
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setMessage('Additional access code assigned successfully.');
      setAssignEmail('');
      setAssignCode('');
      setSearchQuery('');
      setSearchResults([]);
      fetchAccessCodes();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An unexpected error occurred while assigning the access code. Please try again.');
      }
      console.error('Error assigning access code:', err);
    }
  };

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/access-codes/search?query=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSearchResults(response.data.results);
    } catch (err) {
      console.error('Error searching for email addresses:', err);
    }
  };

  const handleSelectEmail = (email) => {
    setAssignEmail(email);
    setSearchQuery(email);
    setSearchResults([]);
  };

  const handleAccessCodeSearchChange = async (e) => {
    const query = e.target.value;
    setAccessCodeSearchQuery(query);

    if (query.length < 2) {
      setAccessCodeSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/access-codes/search-codes?query=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAccessCodeSearchResults(response.data.results);
    } catch (err) {
      console.error('Error searching for access codes:', err);
    }
  };

  const handleSelectAccessCode = (code) => {
    setSelectedAccessCode(code);
    setAccessCodeSearchQuery(code);
    setAccessCodeSearchResults([]);
  };

  const handleGalleryAccessCodeSearchChange = async (e) => {
    const query = e.target.value;
    setGalleryAccessCodeSearchQuery(query);

    if (query.length < 2) {
      setGalleryAccessCodeSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/access-codes/search-codes?query=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setGalleryAccessCodeSearchResults(response.data.results);
    } catch (err) {
      console.error('Error searching for access codes:', err);
    }
  };

  const handleSelectGalleryAccessCode = (code) => {
    setSelectedAccessCode(code);
    setGalleryAccessCodeSearchQuery(code);
    setGalleryAccessCodeSearchResults([]);
    fetchViewerPhotos(code);
  };

  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handlePhotoUpload = async () => {
    setError('');
    setMessage('');
    setUploadProgress(0);

    if (selectedFiles.length === 0 || !selectedAccessCode) {
      setError('Please select photos (up to 100) and an access code.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append(`photos`, file);
      });
      formData.append('accessCode', selectedAccessCode);

      console.log('Sending accessCode:', selectedAccessCode);
      console.log('Number of files:', selectedFiles.length);

      const response = await axios.post('http://localhost:5001/api/photos/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      console.log('Upload response:', response.data);

      setMessage('Photos uploaded successfully.');
      setSelectedFiles([]);
      setSelectedAccessCode('');
      setUploadProgress(0);
      if (selectedAccessCode) {
        fetchViewerPhotos(selectedAccessCode);
      }
    } catch (err) {
      console.error('Error uploading photos:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An unexpected error occurred while uploading photos. Please try again.');
      }
      setUploadProgress(0);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/photos/${photoId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMessage('Photo deleted successfully.');
      if (selectedAccessCode) {
        fetchViewerPhotos(selectedAccessCode);
      }
    } catch (err) {
      setError('Failed to delete photo. Please try again.');
      console.error('Error deleting photo:', err);
    }
  };

  const openModal = (photo) => {
    setSelectedPhoto(photo);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
  };

  const handleDownloadPhoto = async (selectionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/print-selections/download/${selectionId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `photo_${selectionId}.jpg`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading photo:', err);
      setError('Failed to download photo. Please try again.');
    }
  };

  const handleDownloadAllPhotos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/print-selections/download-all', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'selected_photos.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading all photos:', err);
      setError('Failed to download all photos. Please try again.');
    }
  };

  if (isLoading) {
    return <div style={styles.container}><p>Loading...</p></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>Admin Dashboard</h2>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </div>
      <div style={styles.content}>
        <h2 style={styles.title}>Manage Access Codes</h2>
        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.message}>{message}</p>}
        <form onSubmit={handleCreateAccessCode} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="text"
            placeholder="Full Name"
            value={newFullName}
            onChange={(e) => setNewFullName(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="text"
            placeholder="New Access Code"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            style={styles.input}
            required
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            style={styles.select}
            required
          >
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" style={styles.button}>Create Access Code</button>
        </form>

        <h2 style={styles.title}>Assign Additional Access Code</h2>
        <form onSubmit={handleAssignAccessCode} style={styles.form}>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search Viewer's Email or Full Name"
              value={searchQuery}
              onChange={handleSearchChange}
              style={{...styles.input, width: '100%'}}
              required
            />
            {searchResults.length > 0 && (
              <ul style={styles.searchResults}>
                {searchResults.map((result) => (
                  <li
                    key={result.email}
                    onClick={() => handleSelectEmail(result.email)}
                    style={styles.searchResultItem}
                  >
                    {result.email} - {result.full_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input
            type="text"
            placeholder="New Access Code"
            value={assignCode}
            onChange={(e) => setAssignCode(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>Assign Access Code</button>
        </form>

        <h2 style={styles.title}>Existing Access Codes</h2>
        <ul style={styles.list}>
          {accessCodes.map(code => (
            <li key={code.email + code.code} style={styles.listItem}>
              <span style={styles.email}>{code.email}</span> - 
              <span style={styles.fullName}>{code.full_name}</span> - 
              <span style={styles.code}>{code.code}</span> - 
              <span style={styles.role}>{code.role}</span>
            </li>
          ))}
        </ul>

        <h2 style={styles.title}>Upload Photos</h2>
        <div style={styles.form}>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search Access Code or Email"
              value={accessCodeSearchQuery}
              onChange={handleAccessCodeSearchChange}
              style={styles.input}
              required
            />
            {accessCodeSearchResults.length > 0 && (
              <ul style={styles.searchResults}>
                {accessCodeSearchResults.map((result) => (
                  <li
                    key={result.code}
                    onClick={() => handleSelectAccessCode(result.code)}
                    style={styles.searchResultItem}
                  >
                    {result.code} - {result.email} ({result.full_name})
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p>Selected Access Code: {selectedAccessCode}</p>
          <label htmlFor="photo-upload" style={styles.fileInputLabel}>
            Select Photos (up to 100)
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={styles.fileInput}
            required
          />
          <button onClick={handlePhotoUpload} style={styles.button}>Upload Photos</button>
          {uploadProgress > 0 && <ProgressBar progress={uploadProgress} />}
        </div>

        <h2 style={styles.title}>View Access Code Gallery</h2>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search Access Code, Email, or Full Name"
            value={galleryAccessCodeSearchQuery}
            onChange={handleGalleryAccessCodeSearchChange}
            style={styles.input}
          />
          {galleryAccessCodeSearchResults.length > 0 && (
            <ul style={styles.searchResults}>
              {galleryAccessCodeSearchResults.map((result) => (
                <li
                  key={result.code}
                  onClick={() => handleSelectGalleryAccessCode(result.code)}
                  style={styles.searchResultItem}
                >
                  {result.code} - {result.email} - {result.full_name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={styles.photoGrid}>
          {photos.map(photo => (
            <div key={photo.id} style={styles.photoContainer}>
              <div style={styles.photoWrapper}>
                <img 
                  src={photo.thumbnailUrl} 
                  alt={photo.filename} 
                  style={styles.photo} 
                  onClick={() => openModal(photo)}
                />
                {photo.selected_for_printing === 1 && (
                  <div style={styles.selectedOverlay}>
                    <span style={styles.checkmark}>✓</span>
                  </div>
                )}
              </div>
              <button onClick={() => handleDeletePhoto(photo.id)} style={styles.deleteButton}>Delete</button>
            </div>
          ))}
        </div>

        <h2 style={styles.title}>Print Selections</h2>
        <button onClick={fetchPrintSelections} style={styles.button}>Refresh Print Selections</button>
        {printSelections.length === 0 ? (
          <p>No print selections available.</p>
        ) : (
          <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeaderCell}>Selection ID</th>
                  <th style={styles.tableHeaderCell}>Photo Filename</th>
                  <th style={styles.tableHeaderCell}>Viewer Email</th>
                  <th style={styles.tableHeaderCell}>Viewer Full Name</th>
                  <th style={styles.tableHeaderCell}>Access Code</th>
                  <th style={styles.tableHeaderCell}>Action</th>
                </tr>
              </thead>
              <tbody>
                {printSelections.map(selection => (
                  <tr key={selection.selectionId}>
                    <td style={styles.tableCell}>{selection.selectionId}</td>
                    <td style={styles.tableCell}>{selection.filename}</td>
                    <td style={styles.tableCell}>{selection.viewerEmail}</td>
                    <td style={styles.tableCell}>{selection.viewerFullName}</td>
                    <td style={styles.tableCell}>{selection.accessCode}</td>
                    <td style={styles.tableCell}>
                      <button onClick={() => handleDownloadPhoto(selection.selectionId)} style={styles.downloadButton}>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={handleDownloadAllPhotos} style={{...styles.button, marginTop: '20px'}}>
              Download All Selected Photos
            </button>
          </>
        )}
      </div>
      {selectedPhoto && (
        <div style={styles.modal} onClick={closeModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto.fullUrl} alt={selectedPhoto.filename} style={styles.modalImage} />
            <button onClick={closeModal} style={styles.closeButton}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#2c2c2c',
    padding: '20px',
    boxSizing: 'border-box',
  },
  sidebarTitle: {
    marginBottom: '20px',
    textAlign: 'center',
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#ff4d4d',
    border: 'none',
    borderRadius: '4px',
    color: '#ffffff',
    cursor: 'pointer',
    width: '100%',
  },
  content: {
    flex: 1,
    padding: '40px',
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
  title: {
    marginBottom: '20px',
    borderBottom: '2px solid #555555',
    paddingBottom: '10px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '40px',
  },
  input: {
    padding: '10px',
    marginBottom: '20px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3c3c3c',
    color: '#ffffff',
    fontSize: '16px',
    width: '100%',
  },
  select: {
    padding: '10px',
    marginBottom: '20px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3c3c3c',
    color: '#ffffff',
  },
  button: {
    padding: '10px',
    backgroundColor: '#555555',
    border: 'none',
    borderRadius: '4px',
    color: '#ffffff',
    cursor: 'pointer',
    marginBottom: '20px',
    width: 'fit-content',
  },
  list: {
    listStyleType: 'none',
    paddingLeft: '0',
  },
  listItem: {
    padding: '10px 0',
    borderBottom: '1px solid #555555',
  },
  code: {
    fontWeight: 'bold',
  },
  fullName: {
    fontStyle: 'italic',
  },
  error: {
    color: '#ff4d4d',
    marginBottom: '15px',
  },
  message: {
    color: '#4caf50',
    marginBottom: '15px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  tableHeaderCell: {
    padding: '10px',
    border: '1px solid #555555',
    backgroundColor: '#333333',
  },
  tableCell: {
    padding: '10px',
    border: '1px solid #555555',
    textAlign: 'center',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  photoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  photoWrapper: {
    position: 'relative',
    width: '100%',
    height: '200px',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '4px',
  },
  checkmark: {
    color: '#4CAF50',
    fontSize: '48px',
    fontWeight: 'bold',
  },
  deleteButton: {
    marginTop: '10px',
    padding: '5px 10px',
    backgroundColor: '#ff4d4d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#2c2c2c',
    padding: '20px',
    borderRadius: '8px',
    position: 'relative',
    maxWidth: '90%',
    maxHeight: '90%',
    overflow: 'auto',
  },
  modalImage: {
    maxWidth: '100%',
    maxHeight: '70vh',
    objectFit: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '5px 10px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  progressContainer: {
    width: '100%',
    height: '20px',
    backgroundColor: '#3c3c3c',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transition: 'width 0.5s ease-in-out',
  },
  progressText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#ffffff',
  },
  fileInputLabel: {
    display: 'inline-block',
    padding: '10px',
    backgroundColor: '#555555',
    color: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  fileInput: {
    display: 'none',
  },
  searchContainer: {
    position: 'relative',
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#3c3c3c',
    border: '1px solid #555555',
    borderRadius: '4px',
    listStyle: 'none',
    padding: 0,
    margin: 0,
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1000,
  },
  searchResultItem: {
    padding: '10px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#555555',
    },
  },
  downloadButton: {
    padding: '5px 10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default AdminDashboard;
