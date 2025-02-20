import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import PageTitle from '../components/PageTitle';

function Documents() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
      setError(null);
    } catch (error) {
      console.error('Documents fetch error:', error);
      setError('Belgeler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [token]);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Dosya boyutu 5MB\'dan küçük olmalıdır');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        // Aynı isimli dosya var mı kontrol et
        const existingDoc = documents.find(doc => doc.title === file.name);
        if (existingDoc) {
          // Kullanıcıya sor
          if (!window.confirm(`"${file.name}" dosyası zaten mevcut. Üzerine yazmak istiyor musunuz?`)) {
            continue; // Kullanıcı hayır derse sonraki dosyaya geç
          }
          // Eski dosyayı listeden kaldır
          setDocuments(prev => prev.filter(doc => doc.title !== file.name));
        }

        const response = await axios.post(
          'http://localhost:5000/api/documents/upload',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        setDocuments(prev => [...prev, response.data]);
        setError(null);
      } catch (error) {
        console.error('File upload error:', error);
        setError(error.response?.data?.message || 'Dosya yüklenirken bir hata oluştu');
      }
    }
    
    // Input'u temizle
    event.target.value = '';
  };

  const handleView = async (document) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/documents/${document._id}/view`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (document.fileType === 'application/pdf') {
        const pdfWindow = window.open('', '_blank');
        pdfWindow.document.write(`
          <html>
            <head>
              <title>${response.data.title}</title>
            </head>
            <body style="margin:0;padding:0;">
              <embed width="100%" height="100%" src="${response.data.data}" type="application/pdf">
            </body>
          </html>
        `);
      } else if (document.fileType.startsWith('image/')) {
        const imgWindow = window.open('', '_blank');
        imgWindow.document.write(`
          <html>
            <head>
              <title>${response.data.title}</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #1a1a1a; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${response.data.data}" alt="${response.data.title}">
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('View error:', error);
      setError('Dosya görüntülenirken bir hata oluştu');
    }
  };

  const handleDownload = async (document) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/documents/${document._id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      setError('Dosya indirilirken bir hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(documents.filter(doc => doc._id !== id));
      setError(null);
    } catch (error) {
      console.error('Delete error:', error);
      setError('Dosya silinirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        mb: 4
      }}>
        <PageTitle title="Belgeler" />
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={handleFileUpload}
        >
          Belge Ekle
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Başlık</TableCell>
              <TableCell>Açıklama</TableCell>
              <TableCell>Dosya Türü</TableCell>
              <TableCell>Boyut</TableCell>
              <TableCell>Tarih</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc._id}>
                <TableCell>{doc.title}</TableCell>
                <TableCell>{doc.description || '-'}</TableCell>
                <TableCell>{doc.fileType}</TableCell>
                <TableCell>{(doc.fileSize / 1024).toFixed(2)} KB</TableCell>
                <TableCell>{new Date(doc.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleView(doc)} title="Görüntüle">
                    <ViewIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDownload(doc)} title="İndir">
                    <DownloadIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(doc._id)} title="Sil">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default Documents; 