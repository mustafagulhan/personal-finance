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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import PageTitle from '../components/PageTitle';
import UploadDialog from '../components/UploadDialog';

function Documents() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

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

  const handleFileSelect = (event) => {
    try {
      if (!event.target || !event.target.files) {
        console.error('No files selected');
        return;
      }

      const files = Array.from(event.target.files);
      
      const validFiles = files.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          setError('Bazı dosyalar 5MB\'dan büyük olduğu için eklenmedi');
          return false;
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          setError('Sadece JPEG, PNG ve PDF dosyaları yüklenebilir');
          return false;
        }
        
        return true;
      });

      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
        setUploadDialogOpen(true);
      }

      event.target.value = '';
    } catch (error) {
      console.error('File selection error:', error);
      setError('Dosya seçiminde bir hata oluştu');
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1) {
      setUploadDialogOpen(false);
    }
  };

  const handleUpload = async (description) => {
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // Açıklamayı ekle
      formData.append('description', description);

      const response = await axios.post(
        'http://localhost:5000/api/documents/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      setDocuments(prev => [...response.data, ...prev]);
      setError(null);
      setSelectedFiles([]);
      setUploadDialogOpen(false);
    } catch (error) {
      console.error('File upload error:', error);
      setError('Dosyalar yüklenirken bir hata oluştu');
    }
  };

  const handleView = (doc) => {
    if (doc.fileType.startsWith('image/')) {
      setViewingImage({
        url: `http://localhost:5000/uploads/${doc.path}`,
        title: doc.title
      });
      setImageDialogOpen(true);
    } else {
      window.open(`http://localhost:5000/uploads/${doc.path}`, '_blank');
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/documents/download/${doc._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('Dosya indirme hatası');
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
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button
            component="span"
            variant="contained"
            startIcon={<UploadIcon />}
          >
            Belge Yükle
          </Button>
        </label>
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

      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography>{viewingImage?.title}</Typography>
            <IconButton onClick={() => setImageDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <img
            src={viewingImage?.url}
            alt={viewingImage?.title}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
          />
        </DialogContent>
      </Dialog>

      <UploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        files={selectedFiles}
        onUpload={handleUpload}
        onRemoveFile={handleRemoveFile}
      />
    </Container>
  );
}

export default Documents; 