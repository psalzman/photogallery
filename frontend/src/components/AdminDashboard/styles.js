const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
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
    boxSizing: 'border-box',
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
    marginTop: '10px',
    padding: '10px 20px',
    backgroundColor: '#333333',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    width: '180px',
    fontSize: '14px',
    '&:hover': {
      backgroundColor: '#555555',
    },
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#333333',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    fontSize: '14px',
    width: '100%',
    marginTop: '20px',
    '&:hover': {
      backgroundColor: '#555555',
    },
  },
  error: {
    color: '#ff4d4d',
    marginBottom: '15px',
  },
  message: {
    color: '#4caf50',
    marginBottom: '15px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '40px',
  },
  column: {
    width: '48%',
  },
};

export default styles;
