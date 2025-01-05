import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  Tabs,
  Tab,
  IconButton,
  TextField,
  Paper,
  Tooltip,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useNotes } from '../contexts/NotesContext';

// Define the props interface
interface SidebarProps {
  notes?: any[];
  onAddNote?: (content: string) => void;
  onDeleteNote?: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = () => {
  const theme = useTheme();
  const { notes, addNote, deleteNote, tagNote, untagNote } = useNotes();
  const [activeTab, setActiveTab] = useState(0);
  const [newNote, setNewNote] = useState('');
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeTab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAddNote = () => {
    const trimmedNote = newNote.trim();
    if (trimmedNote) {
      addNote(trimmedNote);
      setNewNote('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleAddNote();
      event.preventDefault();
    }
  };

  const handleEditNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setEditingNoteId(noteId);
      setEditNoteContent(note.content);
    }
  };

  const handleSaveEditedNote = () => {
    if (editingNoteId) {
      // Replace the note content 
      const updatedNotes = notes.map(note => 
        note.id === editingNoteId 
          ? { ...note, content: editNoteContent } 
          : note
      );
      // Update notes in context (you'll need to modify NotesContext to support this)
      setEditingNoteId(null);
    }
  };

  const handleNoteToggle = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      note.isTagged ? untagNote(noteId) : tagNote(noteId);
    }
  };

  const displayNotes = activeTab === 0 
    ? notes.filter(note => !note.isTagged)
    : notes.filter(note => note.isTagged);

  return (
    <Box
      component="aside"
      aria-label="Notes Sidebar"
      sx={{
        width: '100%', 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', 
        direction: 'rtl',
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          width: '100%', 
          height: '50px', 
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center', 
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            color: theme.palette.text.primary,
            fontSize: '1rem', 
            textAlign: 'center', 
            width: '100%', 
          }}
        >
          הערות
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: '40px', 
          direction: 'ltr', // Ensure tabs are left-to-right for proper tab selection
        }}
      >
        <Tab 
          label="כל ההערות" 
          sx={{ 
            fontWeight: activeTab === 0 ? 600 : 400,
            fontSize: '0.75rem', 
          }} 
        />
        <Tab 
          label="מסומנות" 
          sx={{ 
            fontWeight: activeTab === 1 ? 600 : 400,
            fontSize: '0.75rem', 
          }} 
        />
      </Tabs>

      {/* Add Note Input */}
      <Box 
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleAddNote();
        }}
        sx={{ 
          p: 1, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          height: '50px', 
          flexDirection: 'row-reverse', // Reverse input layout for RTL
        }}
      >
        <Tooltip title="הוסף">
          <span>
            <IconButton 
              color="primary" 
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              aria-label="Add note"
              sx={{
                width: '35px',
                height: '35px',
                ml: 1, // Change margin for RTL
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <TextField
          inputRef={inputRef}
          fullWidth
          variant="outlined"
          size="small"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="הוסף הערה"
          aria-label="New note input"
          sx={{ 
            '& .MuiOutlinedInput-root': {
              height: '35px', 
            },
            '& input': {
              textAlign: 'right', 
              fontSize: '0.8rem',
            }
          }}
        />
      </Box>

      {/* Notes List */}
      <List 
        aria-label="רשימת הערות"
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          p: 0,
          height: 'calc(100% - 140px)', 
          direction: 'ltr', // Ensure list scrolls correctly
        }}
      >
        {displayNotes.length === 0 ? (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              opacity: 0.5,
            }}
          >
            <Typography 
              variant="body2"
              sx={{
                textAlign: 'right', 
                fontSize: '0.75rem',
              }}
            >
              אין הערות
            </Typography>
          </Box>
        ) : (
          displayNotes.map((note) => (
            <ListItem 
              key={note.id} 
              disableGutters
              sx={{ 
                mb: 0.5,
                p: 0.5,
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
                direction: 'ltr', // Ensure list items are left-to-right
              }}
              role="article"
              aria-labelledby={`note-${note.id}`}
            >
              <Paper
                elevation={hoveredNoteId === note.id ? 4 : 1}
                sx={{
                  p: 1,
                  width: '100%',
                  backgroundColor: note.isTagged ? '#E8F5E9' : '#FFF9C4',
                  position: 'relative',
                  borderRadius: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  '&:hover': {
                    backgroundColor: note.isTagged ? '#C8E6C9' : '#FFF176',
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={note.isTagged}
                onClick={() => handleNoteToggle(note.id)}
                onMouseEnter={() => setHoveredNoteId(note.id)}
                onMouseLeave={() => setHoveredNoteId(null)}
              >
                <Typography 
                  id={`note-${note.id}`}
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.75rem',
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                    mb: 0.5,
                    flexGrow: 1,
                    textAlign: 'right', 
                  }}
                >
                  {note.content}
                </Typography>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    width: '100%',
                    flexDirection: 'row-reverse', // Reverse layout for RTL
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'row-reverse' }}>
                    <Tooltip title="מחק">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        sx={{ 
                          ml: 0.5, 
                          opacity: 0.6,
                          width: '24px',
                          height: '24px',
                        }}
                        aria-label="Delete note"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="סמן/בטל סימון">
                      <IconButton
                        size="small"
                        color={note.isTagged ? "primary" : "default"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNoteToggle(note.id);
                        }}
                        aria-label={note.isTagged ? "Unmark note" : "Mark note"}
                        sx={{
                          width: '24px',
                          height: '24px',
                          mr: 0.5, // Change margin for RTL
                        }}
                      >
                        {note.isTagged ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography 
                    variant="caption" 
                    color="textSecondary"
                    sx={{
                      textAlign: 'left', 
                      fontSize: '0.6rem',
                    }}
                  >
                    {new Date(note.createdAt).toLocaleDateString('he-IL')}
                  </Typography>
                </Box>
              </Paper>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
};

export default Sidebar;
