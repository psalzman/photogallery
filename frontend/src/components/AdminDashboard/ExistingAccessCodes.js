import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './styles';
import API_BASE_URL from '../../config/api';

function ExistingAccessCodes({ refreshTrigger }) {
  const [accessCodes, setAccessCodes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAccessCodes = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/access-codes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAccessCodes(response.data.accessCodes);
    } catch (err) {
      console.error('Error fetching access codes:', err);
    }
  }, []);

  useEffect(() => {
    fetchAccessCodes();
  }, [fetchAccessCodes, refreshTrigger]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAccessCodes = accessCodes.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <h2 style={styles.title}>Existing Access Codes</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.tableHeaderCell}>Email</th>
            <th style={styles.tableHeaderCell}>Full Name</th>
            <th style={styles.tableHeaderCell}>Access Code</th>
            <th style={styles.tableHeaderCell}>Role</th>
          </tr>
        </thead>
        <tbody>
          {currentAccessCodes.map(code => (
            <tr key={code.email + code.code}>
              <td style={styles.tableCell}>{code.email}</td>
              <td style={styles.tableCell}>{code.full_name}</td>
              <td style={styles.tableCell}>{code.code}</td>
              <td style={styles.tableCell}>{code.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={styles.pagination}>
        {Array.from({ length: Math.ceil(accessCodes.length / itemsPerPage) }, (_, i) => (
          <button key={i} onClick={() => paginate(i + 1)} style={styles.paginationButton}>
            {i + 1}
          </button>
        ))}
      </div>
    </>
  );
}

export default ExistingAccessCodes;