import React from 'react';

function SelectedPhotos() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Selected Photos</h1>
      {/* List of selected photos for printing will go here */}
    </div>
  );
}

const styles = {
  container: {
    padding: '40px',
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
    minHeight: '100vh',
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
  },
};

export default SelectedPhotos;
