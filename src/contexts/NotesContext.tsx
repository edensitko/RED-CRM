import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

// Define Note interface
export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  isTagged: boolean;
}

// Define context type
interface NotesContextType {
  notes: Note[];
  addNote: (content: string) => void;
  updateNote: (id: string, updatedContent: string) => void;
  deleteNote: (id: string) => void;
  tagNote: (id: string) => void;
  untagNote: (id: string) => void;
  handleOpenNoteDialog: (note: Note) => void;
}

// Create context
const NotesContext = createContext<NotesContextType | undefined>(undefined);

// Provider component
export const NotesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [openNoteDialog, setOpenNoteDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const fetchNotes = async () => {
      const notesCollection = collection(db, `users/${currentUser.uid}/notes`);
      const notesSnapshot = await getDocs(notesCollection);
      const notesList = notesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((note): note is Note => 
          note.id !== undefined && 
          note.content !== undefined && 
          (note.createdAt instanceof Date || note.createdAt instanceof Timestamp) && 
          note.isTagged !== undefined
        )
        .map(note => ({
          ...note,
          createdAt: note.createdAt instanceof Timestamp 
            ? note.createdAt.toDate() 
            : note.createdAt
        }));
      setNotes(notesList);
    };
    fetchNotes();
  }, [currentUser]);

  const addNote = async (content: string) => {
    if (!currentUser) return;
    const newNote = {
      content,
      createdAt: new Date(),
      isTagged: false
    };
    const docRef = await addDoc(collection(db, `users/${currentUser.uid}/notes`), newNote);
    setNotes(prevNotes => [...prevNotes, { id: docRef.id, ...newNote }]);
  };

  const updateNote = async (id: string, updatedContent: string) => {
    if (!currentUser) return;
    const noteDoc = doc(db, `users/${currentUser.uid}/notes`, id);
    await updateDoc(noteDoc, { content: updatedContent });
    setNotes(prevNotes => prevNotes.map(note => note.id === id ? { ...note, content: updatedContent } : note));
  };

  const deleteNote = async (id: string) => {
    if (!currentUser) return;
    const noteDoc = doc(db, `users/${currentUser.uid}/notes`, id);
    await deleteDoc(noteDoc);
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
  };

  const tagNote = (id: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id ? { ...note, isTagged: true } : note
      )
    );
  };

  const untagNote = (id: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id ? { ...note, isTagged: false } : note
      )
    );
  };

  const handleOpenNoteDialog = (note: Note) => {
    setSelectedNote(note);
    setOpenNoteDialog(true);
  };

  const handleCloseNoteDialog = () => {
    setOpenNoteDialog(false);
    setSelectedNote(null);
  };

  return (
    <NotesContext.Provider 
      value={{ 
        notes, 
        addNote, 
        updateNote, 
        deleteNote, 
        tagNote, 
        untagNote, 
        handleOpenNoteDialog 
      }}
    >
      {children}

      <Dialog open={openNoteDialog} onClose={handleCloseNoteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Note Details</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="textSecondary">
            {selectedNote?.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNoteDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </NotesContext.Provider>
  );
};

// Custom hook to use the notes context
export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};
