import api from './api';

export const documentService = {
  getAll: async () => {
    const response = await api.get('/documents');
    return response.data;
  },

  upload: async (formData) => {
    const response = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  linkToTransaction: async (documentId, transactionId) => {
    const response = await api.put(`/documents/${documentId}/transaction/${transactionId}`);
    return response.data;
  }
}; 