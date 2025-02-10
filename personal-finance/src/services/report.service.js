import api from './api';

export const reportService = {
  getReport: async (startDate, endDate) => {
    const response = await api.get('/reports', {
      params: { startDate, endDate }
    });
    return response.data;
  }
}; 