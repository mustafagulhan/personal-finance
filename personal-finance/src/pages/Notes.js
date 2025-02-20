import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Fab,
  Alert,
  Chip,
  Tooltip,
  Tabs,
  Tab,
  CircularProgress,
  Button
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  PushPin as PushPinIcon,
  PushPinOutlinedIcon,
  Alarm as AlarmIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';
import NoteForm from '../components/NoteForm';
import { useNavigate } from 'react-router-dom';
import PageTitle from '../components/PageTitle';

// Not renkleri için koyu/açık tema renkleri
const noteColors = {
  light: [
    '#ffffff', '#f28b82', '#fbbc04', '#fff475',
    '#ccff90', '#a7ffeb', '#cbf0f8', '#aecbfa',
    '#d7aefb', '#fdcfe8', '#e6c9a8'
  ],
  dark: [
    '#2c2c2c', '#5c2b29', '#614a19', '#635d19',
    '#345920', '#16504b', '#2d555e', '#1a237e',
    '#42275e', '#5c2b29', '#442f19'
  ]
};

function Notes() {
  const { token } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const { mode } = useTheme();
  const [activeTab, setActiveTab] = useState('active');
  const [archivedNotes, setArchivedNotes] = useState([]);
  const navigate = useNavigate();

  const fetchNotes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/notes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(response.data);
      setError(null);
    } catch (error) {
      console.error('Notes fetch error:', error);
      setError('Notlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedNotes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/notes/archived', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArchivedNotes(response.data);
    } catch (error) {
      setError('Arşivlenmiş notlar yüklenirken bir hata oluştu');
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotes();
      fetchArchivedNotes();
    }
  }, [token]);

  const handleNoteAdded = (updatedNote) => {
    if (editingNote) {
      // Düzenleme işlemi
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note._id === updatedNote._id ? updatedNote : note
        )
      );
    } else {
      // Yeni not ekleme işlemi
      setNotes(prevNotes => [updatedNote, ...prevNotes]);
    }
    setOpenForm(false);
    setEditingNote(null);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(notes.filter(note => note._id !== id));
    } catch (error) {
      console.error('Note delete error:', error);
      setError('Not silinirken bir hata oluştu');
    }
  };

  const handlePin = async (id) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/notes/${id}/pin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotes(prev => prev.map(note => 
        note._id === id ? response.data : note
      ));
    } catch (error) {
      console.error('Pin error:', error);
      setError('Sabitleme işlemi başarısız oldu');
    }
  };

  const handleToggleArchive = async (id) => {
    try {
      const currentNote = activeTab === 'active' 
        ? notes.find(n => n._id === id)
        : archivedNotes.find(n => n._id === id);
        
      const action = currentNote.status === 'archived' ? 'unarchive' : 'archive';
      
      const response = await axios.patch(
        `http://localhost:5000/api/notes/${id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (action === 'archive') {
        setNotes(prev => prev.filter(n => n._id !== id));
        setArchivedNotes(prev => [...prev, response.data]);
      } else {
        setArchivedNotes(prev => prev.filter(n => n._id !== id));
        setNotes(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Archive toggle error:', error);
      setError('Arşivleme işlemi başarısız oldu');
    }
  };

  const renderNoteCard = (note) => (
    <Grid item xs={12} sm={6} md={4} lg={3} key={note._id}>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3
          },
          transition: 'all 0.2s ease-in-out'
        }}
        onClick={(e) => {
          // Butonlara tıklandığında kartın tıklama olayını engelle
          if (e.target.closest('button')) {
            e.stopPropagation();
            return;
          }
          navigate(`/notes/${note._id}`);
        }}
      >
        <CardContent sx={{ flex: 1, pb: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 1 
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                wordBreak: 'break-word',
                width: 'calc(100% - 40px)' // Pin butonu için yer bırak
              }}
            >
              {note.title}
            </Typography>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                handlePin(note._id);
              }}
              sx={{ mt: -0.5 }}
            >
              <PushPinIcon color={note.isPinned ? "primary" : "inherit"} />
            </IconButton>
          </Box>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              minHeight: '4.5em'
            }}
          >
            {note.content}
          </Typography>
          {note.isReminder && note.reminderDate && (
            <Chip
              icon={<AlarmIcon />}
              label={new Date(note.reminderDate).toLocaleDateString()}
              size="small"
              color="primary"
              sx={{ mb: 1 }}
            />
          )}
        </CardContent>
        <CardActions sx={{ 
          justifyContent: 'flex-start',
          p: 1,
          pt: 0,
          gap: 0.5
        }}>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(note);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleToggleArchive(note._id);
            }}
          >
            {note.status === 'archived' ? 
              <UnarchiveIcon fontSize="small" /> : 
              <ArchiveIcon fontSize="small" />
            }
          </IconButton>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(note._id);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </CardActions>
      </Card>
    </Grid>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
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
        <PageTitle title="Notlar" />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Not Ekle
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} sx={{ mb: 3 }}>
        <Tab label="Aktif Notlar" value="active" />
        <Tab label="Arşiv" value="archived" />
      </Tabs>

      <Grid container spacing={3}>
        {activeTab === 'active' ? (
          <>
            {notes.filter(note => note.isPinned).map(renderNoteCard)}
            {notes.filter(note => !note.isPinned).map(renderNoteCard)}
          </>
        ) : (
          archivedNotes.map(renderNoteCard)
        )}
      </Grid>

      <NoteForm
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditingNote(null);
        }}
        onNoteSaved={handleNoteAdded}
        note={editingNote}
      />
    </Container>
  );
}

export default Notes; 