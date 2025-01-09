import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  IconButton,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Folder as FolderIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Idea {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  type: 'feature' | 'improvement' | 'bug' | 'other';
  category: string;
  backgroundColor: string;
}

const categories = [
  'פיתוח מוצר',
  'שיווק',
  'שירות לקוחות',
  'תשתיות',
  'משאבי אנוש',
  'אחר',
];

const typeColors = {
  feature: '#4caf50',
  improvement: '#2196f3',
  bug: '#f44336',
  other: '#ff9800',
};

const backgroundColors = [
  '#ffffff',
  '#f5f5f5',
  '#fff3e0',
  '#e8f5e9',
  '#e3f2fd',
  '#fce4ec',
  '#f3e5f5',
  '#e8eaf6',
];

const StyledCard = styled(Card)<{ backgroundcolor: string }>(({ backgroundcolor }) => ({
  height: '100%',
  backgroundColor: backgroundcolor,
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    transition: 'transform 0.2s ease-in-out',
    boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
  },
  position: 'relative',
  borderRadius: '12px',
  overflow: 'visible',
}));

const Ideas = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<Idea['type']>('feature');
  const [category, setCategory] = useState(categories[0]);
  const [backgroundColor, setBackgroundColor] = useState(backgroundColors[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'category'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    try {
      const ideasRef = collection(db, 'ideas');
      const q = query(ideasRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedIdeas = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate().toISOString(),
      })) as Idea[];
      setIdeas(fetchedIdeas);
    } catch (error) {
      console.error('Error loading ideas:', error);
      enqueueSnackbar('שגיאה בטעינת הרעיונות', { variant: 'error' });
    }
  };

  const handleAddIdea = () => {
    setCurrentIdea(null);
    setTitle('');
    setContent('');
    setType('feature');
    setCategory(categories[0]);
    setBackgroundColor(backgroundColors[0]);
    setOpenDialog(true);
  };

  const handleEditIdea = (idea: Idea) => {
    setCurrentIdea(idea);
    setTitle(idea.title);
    setContent(idea.content);
    setType(idea.type);
    setCategory(idea.category);
    setBackgroundColor(idea.backgroundColor);
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      const ideaData = {
        title,
        content,
        type,
        category,
        backgroundColor,
        createdAt: Timestamp.now(),
      };

      if (currentIdea) {
        const ideaRef = doc(db, 'ideas', currentIdea.id);
        await updateDoc(ideaRef, ideaData);
        setIdeas(ideas.map(idea => 
          idea.id === currentIdea.id 
            ? { ...idea, ...ideaData, createdAt: new Date().toISOString() }
            : idea
        ));
        enqueueSnackbar('הרעיון עודכן בהצלחה', { variant: 'success' });
      } else {
        const docRef = await addDoc(collection(db, 'ideas'), ideaData);
        const newIdea: Idea = {
          id: docRef.id,
          ...ideaData,
          createdAt: new Date().toISOString(),
        };
        setIdeas([newIdea, ...ideas]);
        enqueueSnackbar('הרעיון נוסף בהצלחה', { variant: 'success' });
      }
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving idea:', error);
      enqueueSnackbar('שגיאה בשמירת הרעיון', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ideas', id));
      setIdeas(ideas.filter(idea => idea.id !== id));
      enqueueSnackbar('הרעיון נמחק בהצלחה', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting idea:', error);
      enqueueSnackbar('שגיאה במחיקת הרעיון', { variant: 'error' });
    }
  };

  const handleSearch = async () => {
    try {
      if (!searchQuery.trim()) {
        await loadIdeas();
        return;
      }

      const ideasRef = collection(db, 'ideas');
      const q = query(
        ideasRef,
        where('title', '>=', searchQuery),
        where('title', '<=', searchQuery + '\uf8ff'),
        orderBy('title'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const searchResults = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate().toISOString(),
      })) as Idea[];
      
      setIdeas(searchResults);
    } catch (error) {
      console.error('Error searching ideas:', error);
      enqueueSnackbar('שגיאה בחיפוש', { variant: 'error' });
    }
  };

  const getTypeLabel = (type: Idea['type']) => {
    const labels = {
      feature: 'פיצ׳ר חדש',
      improvement: 'שיפור',
      bug: 'באג',
      other: 'אחר',
    };
    return labels[type];
  };

  const sortedIdeas = [...ideas].sort((a, b) => {
    const compareValue = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'category') {
      return a.category.localeCompare(b.category) * compareValue;
    }
    return a.title.localeCompare(b.title) * compareValue;
  });

  const handleSort = (field: 'title' | 'category') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      categories.push(newCategory);
      setNewCategory('');
    }
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Group ideas by category
  const groupedIdeas = sortedIdeas
    .filter(idea => 
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .reduce((groups, idea) => {
      const category = idea.category || 'ללא קטגוריה';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(idea);
      return groups;
    }, {} as Record<string, Idea[]>);

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }} dir="rtl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div className="flex items-center gap-4">
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setCurrentIdea(null);
              setTitle('');
              setContent('');
              setType('feature');
              setCategory('');
              setBackgroundColor('#ffffff');
              setOpenDialog(true);
            }}
            startIcon={<AddIcon />}
          >
            רעיון חדש
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleSort('title')}
              className={sortBy === 'title' ? 'text-red-500' : ''}
              endIcon={sortBy === 'title' ? (sortOrder === 'asc' ? '↑' : '↓') : null}
            >
              מיין לפי כותרת
            </Button>
            <Button
              onClick={() => handleSort('category')}
              className={sortBy === 'category' ? 'text-red-500' : ''}
              endIcon={sortBy === 'category' ? (sortOrder === 'asc' ? '↑' : '↓') : null}
            >
              מיין לפי קטגוריה
            </Button>
          </div>
        </div>

        <TextField
          placeholder="חיפוש רעיונות..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />
      </Box>

      {/* Categories and their ideas */}
      {Object.entries(groupedIdeas).map(([category, categoryIdeas]) => (
        <Box key={category} sx={{ mb: 4 }}>
          <Box 
            onClick={() => toggleCategory(category)}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 2,
              backgroundColor: 'white',
              p: 2,
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              '&:hover': {
                backgroundColor: '#f8f8f8'
              }
            }}
          >
            <Typography variant="h6" component="h2" sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <FolderIcon />
              {category}
              <Chip 
                label={categoryIdeas.length}
                size="small"
                color="primary"
                sx={{ mr: 1 }}
              />
            </Typography>
            <IconButton
              size="small"
              sx={{
                transform: collapsedCategories.includes(category) ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.3s'
              }}
            >
              <KeyboardArrowDownIcon />
            </IconButton>
          </Box>

          <Collapse in={!collapsedCategories.includes(category)}>
            <Grid container spacing={3}>
              {categoryIdeas.map((idea) => (
                <Grid item xs={12} sm={6} md={4} key={idea.id}>
                  <StyledCard backgroundcolor={idea.backgroundColor}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h3">
                          {idea.title}
                        </Typography>
                        <Box>
                          <Tooltip title="ערוך">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditIdea(idea)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="מחק">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(idea.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip 
                          label={getTypeLabel(idea.type)}
                          size="small"
                          color="primary"
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {idea.content}
                      </Typography>
                    </CardContent>
                  </StyledCard>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </Box>
      ))}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden"
          >
            <div className="bg-gradient-to-r from-red-600 to-red-400 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <AddIcon className="ml-4" />
                {currentIdea ? 'ערוך רעיון' : 'צור רעיון חדש'}
              </h2>
              <button
                onClick={() => setOpenDialog(false)}
                className="text-white hover:bg-red-500/20 rounded-full p-2 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <TextField
                    autoFocus
                    label="כותרת"
                    fullWidth
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    dir="rtl"
                    variant="outlined"
                    className="bg-white"
                  />
                </div>

                <FormControl fullWidth>
                  <InputLabel id="type-label">סוג</InputLabel>
                  <Select
                    labelId="type-label"
                    value={type}
                    label="סוג"
                    onChange={(e) => setType(e.target.value as Idea['type'])}
                  >
                    <MenuItem value="feature">פיצ׳ר חדש</MenuItem>
                    <MenuItem value="improvement">שיפור</MenuItem>
                    <MenuItem value="bug">באג</MenuItem>
                    <MenuItem value="other">אחר</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="category-label">קטגוריה</InputLabel>
                  <Select
                    labelId="category-label"
                    value={category}
                    label="קטגוריה"
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <div className="col-span-2">
                  <FormControl fullWidth>
                    <InputLabel id="background-label">צבע רקע</InputLabel>
                    <Select
                      labelId="background-label"
                      value={backgroundColor}
                      label="צבע רקע"
                      onChange={(e) => setBackgroundColor(e.target.value)}
                    >
                      {backgroundColors.map((color) => (
                        <MenuItem 
                          key={color} 
                          value={color}
                          sx={{ 
                            backgroundColor: color,
                            '&:hover': { backgroundColor: color },
                          }}
                        >
                          &nbsp;
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <div className="col-span-2">
                  <TextField
                    label="תוכן"
                    fullWidth
                    multiline
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    dir="rtl"
                    variant="outlined"
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <TextField
                  label="קטגוריה חדשה"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  dir="rtl"
                  variant="outlined"
                  className="bg-white flex-1"
                />
                <Button
                  onClick={handleAddCategory}
                  variant="contained"
                  color="primary"
                  disabled={!newCategory || categories.includes(newCategory)}
                  sx={{ minWidth: 'auto', px: 3 }}
                >
                  הוסף
                </Button>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  onClick={() => setOpenDialog(false)}
                  variant="outlined"
                  color="inherit"
                >
                  ביטול
                </Button>
                <Button 
                  onClick={handleSave}
                  variant="contained"
                  color="primary"
                  disabled={!title || !content}
                >
                  {currentIdea ? 'עדכן' : 'צור'} רעיון
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Box>
  );
};

export default Ideas;
