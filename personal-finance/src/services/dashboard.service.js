import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getDashboardData = async () => {
  try {
    const response = await axios.get(`${API_URL}/dashboard`);
    return response.data;
  } catch (error) {
    console.error('Dashboard data error:', error);
    throw error;
  }
}; 