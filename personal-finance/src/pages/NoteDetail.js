import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Fade
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Alarm as AlarmIcon,
  PushPin as PushPinIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editedNote, setEditedNote] = useState({
    title: '',
    content: '',
    isReminder: false,
    reminderDate: '',
    isPinned: false,
    status: 'active'
  });
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/notes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNote(response.data);
        setEditedNote(response.data);
        setIsModified(false);
        setLoading(false);
      } catch (error) {
        console.error('Note fetch error:', error);
        setError('Not yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };

    if (token && id) {
      fetchNote();
    }
  }, [token, id]);

  useEffect(() => {
    if (note) {
      const isChanged = 
        note.title !== editedNote.title || 
        note.content !== editedNote.content;
      setIsModified(isChanged);
    }
  }, [editedNote, note]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedNote(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/notes/${id}`,
        editedNote,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNote(response.data);
      setEditedNote(response.data);
      setIsModified(false);
      setError(null);
    } catch (error) {
      console.error('Note update error:', error);
      setError('Not güncellenirken bir hata oluştu');
    }
  };

  const handlePin = async () => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/notes/${id}/pin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNote(response.data);
      setEditedNote(response.data);
    } catch (error) {
      setError('Sabitleme işlemi başarısız oldu');
    }
  };

  const handleArchive = async () => {
    try {
      const action = note.status === 'archived' ? 'unarchive' : 'archive';
      const response = await axios.patch(
        `http://localhost:5000/api/notes/${id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNote(response.data);
      setEditedNote(response.data);
    } catch (error) {
      setError('Arşivleme işlemi başarısız oldu');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/notes')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">Not Detayı</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handlePin}>
              <PushPinIcon color={note.isPinned ? "primary" : "inherit"} />
            </IconButton>
            <IconButton onClick={handleArchive}>
              {note.status === 'archived' ? <UnarchiveIcon /> : <ArchiveIcon />}
            </IconButton>
          </Box>
          <Fade in={isModified}>
            <Button
              startIcon={<SaveIcon />}
              variant="contained"
              onClick={handleSave}
              sx={{
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              Kaydet
            </Button>
          </Fade>
        </Box>

        <TextField
          name="title"
          value={editedNote.title}
          onChange={handleChange}
          variant="standard"
          fullWidth
          sx={{ mb: 3 }}
          InputProps={{
            style: { fontSize: '1.5rem', fontWeight: 500 }
          }}
        />

        <TextField
          name="content"
          value={editedNote.content}
          onChange={handleChange}
          multiline
          fullWidth
          variant="standard"
          minRows={10}
          sx={{ mb: 2 }}
        />

        {note.isReminder && note.reminderDate && (
          <Box sx={{ mt: 2 }}>
            <Chip
              icon={<AlarmIcon />}
              label={new Date(note.reminderDate).toLocaleDateString()}
              color="primary"
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default NoteDetail; 