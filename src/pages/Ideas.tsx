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
import { 
  FaLightbulb, 
  FaPlus, 
  FaSearch, 
  FaSortAmountDown, 
  FaSortAmountUp, 
  FaChevronLeft, 
  FaChevronDown, 
  FaEdit, 
  FaTrash,
  FaFolder,
  FaClipboardList,
  FaTag,
  FaList,
  FaTimes,
  FaCheck
} from 'react-icons/fa';

interface Idea {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  type: 'feature' | 'improvement' | 'bug' | 'other';
  category: string;
  backgroundColor: string;
}

interface IdeaPoint {
  id: string;
  content: string;
  createdAt: string;
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
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>(categories);
  const [detailViewIdea, setDetailViewIdea] = useState<Idea | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [points, setPoints] = useState<IdeaPoint[]>([]);
  const [newPoint, setNewPoint] = useState('');
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
    setCategory('');
    setBackgroundColor('#ffffff');
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

  const truncateContent = (content: string, wordLimit: number = 50) => {
    const words = content.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return content;
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

  const tabs = [
    { id: 'details', label: 'פרטים בסיסיים', icon: <FaFolder /> },
    { id: 'additional', label: 'פרטים נוספים', icon: <FaClipboardList /> },
  ];

  const handleAddPoint = async () => {
    if (!newPoint.trim()) return;

    const pointData = {
      content: newPoint,
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, 'ideas', currentIdea?.id || '', 'points'), pointData);
      setPoints([...points, { id: docRef.id, ...pointData }]);
      setNewPoint('');
      enqueueSnackbar('הנקודה נוספה בהצלחה', { variant: 'success' });
    } catch (error) {
      console.error('Error adding point:', error);
      enqueueSnackbar('שגיאה בהוספת הנקודה', { variant: 'error' });
    }
  };

  // Load points when idea is opened
  useEffect(() => {
    if (currentIdea) {
      const loadPoints = async () => {
        try {
          const pointsRef = collection(db, 'ideas', currentIdea.id, 'points');
          const querySnapshot = await getDocs(pointsRef);
          const fetchedPoints = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as IdeaPoint[];
          setPoints(fetchedPoints);
        } catch (error) {
          console.error('Error loading points:', error);
        }
      };
      loadPoints();
    }
  }, [currentIdea]);

  return (
    <Box sx={{ p: 3, backgroundColor: '#252525', minHeight: '100vh', borderRadius: '20px' }} dir="rtl">
      {/* Header Section */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
          borderRadius: '15px',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FaLightbulb size={24} style={{ color: '#ec5252' }} />
          <Typography variant="h5" sx={{ 
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.5rem'
          }}>
            רעיונות
          </Typography>
        </Box>

        <IconButton
          onClick={handleAddIdea}
          sx={{
            backgroundColor: '#ec5252',
            color: 'white',
            width: '40px',
            height: '40px',
            '&:hover': {
              backgroundColor: '#d64444'
            },
            transition: 'all 0.2s ease-in-out',
           
          }}
        >
          <FaPlus />
        </IconButton>
      </Box>

      {/* Search and Filter Section */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש רעיונות..."
          variant="outlined"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaSearch style={{ color: '#666' }} />
              </InputAdornment>
            ),
            sx: {
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              '& fieldset': {
                borderColor: '#333',
              },
              '&:hover fieldset': {
                borderColor: '#ec5252 !important',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#ec5252 !important',
              },
              color: 'white'
            }
          }}
        />
        
        <IconButton 
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          sx={{ 
            color: 'white',
            backgroundColor: '#1a1a1a',
            '&:hover': {
              backgroundColor: '#333'
            }
          }}
        >
          {sortOrder === 'asc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
        </IconButton>
      </Box>

      {/* Ideas Grid */}
      {Object.entries(groupedIdeas).map(([category, ideas]) => (
        <Box key={category} sx={{ mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 }
            }}
            onClick={() => toggleCategory(category)}
          >
            <Typography variant="h6" sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
              {collapsedCategories.includes(category) ? <FaChevronLeft /> : <FaChevronDown />}
              {category}
              <Typography component="span" sx={{ color: '#666', ml: 1 }}>
                ({ideas.length})
              </Typography>
            </Typography>
          </Box>

          <Collapse in={!collapsedCategories.includes(category)}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 3,
                mt: 2
              }}
            >
              {ideas.map((idea) => (
                <Box
                  key={idea.id}
                  sx={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    border: '1px solid #333',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                      borderColor: '#ec5252'
                    }
                  }}
                >
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                        {idea.title}
                      </Typography>
                      <IconButton
                        onClick={() => handleEditIdea(idea)}
                        sx={{ 
                          color: '#666',
                          '&:hover': { color: '#ec5252' }
                        }}
                      >
                        <FaEdit />
                      </IconButton>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        sx={{
                          color: '#999',
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minHeight: '4.5em'
                        }}
                      >
                        {truncateContent(idea.content)}
                      </Typography>
                      {idea.content.length > 500 && (
                        <Button
                          onClick={() => setDetailViewIdea(idea)}
                          sx={{
                            color: '#ec5252',
                            padding: 0,
                            minWidth: 'auto',
                            textTransform: 'none',
                            '&:hover': {
                              backgroundColor: 'transparent',
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          קרא עוד...
                        </Button>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={idea.type}
                        sx={{
                          backgroundColor: typeColors[idea.type],
                          color: 'white',
                          borderRadius: '6px',
                          height: '24px'
                        }}
                      />
                      <Typography sx={{ color: '#666', fontSize: '0.875rem' }}>
                        {new Date(idea.createdAt).toLocaleDateString('he-IL')}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>
      ))}
      {detailViewIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#2a2a2a] rounded-lg w-[900px] h-[600px] flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-white">{detailViewIdea.title}</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleEditIdea(detailViewIdea)}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <EditIcon />
                    ערוך
                  </button>
                  <button
                    onClick={() => setDetailViewIdea(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span 
                  className="px-2 py-1 rounded text-sm"
                  style={{ backgroundColor: typeColors[detailViewIdea.type], color: 'white' }}
                >
                  {detailViewIdea.type}
                </span>
                <span className="bg-[#3a3a3a] px-2 py-1 rounded text-gray-400">{detailViewIdea.category}</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-[#1f1f1f] rounded-lg p-4 text-gray-300">
                {detailViewIdea.content}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-700">
              <div className="text-sm text-gray-500 text-right">
                נוצר ב: {new Date(detailViewIdea.createdAt).toLocaleDateString('he-IL')}
              </div>
            </div>
          </div>
        </div>
      )}
      {openDialog && (
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: '#1a1a1a',
              color: 'white',
              height: '90vh',
              margin: 0,
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          <DialogTitle sx={{ p: 0, backgroundColor: '#252525' }}>
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <IconButton
                onClick={() => setOpenDialog(false)}
                sx={{
                  backgroundColor: '#ec5252',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  '&:hover': {
                    backgroundColor: '#d64444'
                  }
                }}
              >
                <FaTimes size={14} />
              </IconButton>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                {currentIdea ? 'עריכת רעיון' : 'רעיון חדש'}
              </Typography>
            </div>
          </DialogTitle>

          <DialogContent sx={{ p: 0, display: 'flex', flex: 1, overflow: 'hidden' }}>
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className="w-48 bg-[#252525] border-l border-gray-800">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 text-right w-full transition-colors ${
                      activeTab === tab.id ? 'bg-[#2a2a2a] border-l-2 border-[#ec5252]' : 'hover:bg-[#2a2a2a]'
                    }`}
                  >
                    <span className={`text-gray-400`}>{tab.icon}</span>
                    <span className={`flex-1 ${activeTab === tab.id ? 'text-[#ec5252]' : 'text-gray-400'}`}>
                      {tab.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 flex flex-col bg-[#1a1a1a] overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  {activeTab === 'details' && (
                    <div className="p-6" dir="rtl">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">כותרת</label>
                          <div className="relative">
                            <FaFolder className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              className="w-full bg-[#252525] text-white pl-10 pr-3 py-2.5 rounded-lg border border-gray-700 outline-none focus:border-[#ec5252] text-right"
                              placeholder="הכנס כותרת רעיון"
                              dir="rtl"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">תוכן</label>
                          <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="תוכן הרעיון"
                            rows={6}
                            className="w-full bg-[#252525] text-white py-2.5 px-3 rounded-lg border border-gray-700 outline-none focus:border-[#ec5252] text-right resize-none"
                            dir="rtl"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'additional' && (
                    <div className="p-6" dir="rtl">
                      <div className="space-y-6">
                        {/* Type and Category Section */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">סוג</label>
                            <div className="relative">
                              <FaTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <select
                                value={type}
                                onChange={(e) => setType(e.target.value as Idea['type'])}
                                className="w-full bg-[#252525] text-white pl-10 pr-3 py-2.5 rounded-lg border border-gray-700 outline-none focus:border-[#ec5252] text-right appearance-none"
                                dir="rtl"
                              >
                                <option value="feature">תכונה חדשה</option>
                                <option value="improvement">שיפור</option>
                                <option value="bug">באג</option>
                                <option value="other">אחר</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">קטגוריה</label>
                            <div className="relative">
                              <FaList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-[#252525] text-white pl-10 pr-3 py-2.5 rounded-lg border border-gray-700 outline-none focus:border-[#ec5252] text-right appearance-none"
                                dir="rtl"
                              >
                                {categories.map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Points Section */}
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-400">נקודות</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newPoint}
                              onChange={(e) => setNewPoint(e.target.value)}
                              placeholder="הוסף נקודה חדשה..."
                              className="flex-1 bg-[#252525] text-white py-2.5 px-3 rounded-lg border border-gray-700 outline-none focus:border-[#ec5252] text-right"
                              dir="rtl"
                            />
                            <button
                              onClick={handleAddPoint}
                              className="bg-[#ec5252] text-white w-10 h-10 rounded-full hover:bg-[#d64444] transition-all flex items-center justify-center"
                            >
                              <FaPlus className="text-white" />
                            </button>
                          </div>

                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {points.map((point) => (
                              <div
                                key={point.id}
                                className="bg-[#252525] p-3 rounded-lg border border-gray-700 flex justify-between items-start group hover:border-[#ec5252] transition-colors"
                              >
                                <p className="text-gray-300 flex-1 text-right">{point.content}</p>
                                <button
                                  onClick={() => {
                                    deleteDoc(doc(db, 'ideas', currentIdea?.id || '', 'points', point.id));
                                    setPoints(points.filter(p => p.id !== point.id));
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>

          <DialogActions sx={{ p: 2, backgroundColor: '#252525', borderTop: '1px solid', borderColor: 'rgba(75, 75, 75, 0.3)' }}>
            <Button
              onClick={() => setOpenDialog(false)}
              variant="outlined"
              sx={{
                color: 'gray',
                borderColor: 'gray',
                '&:hover': {
                  borderColor: 'white',
                  color: 'white',
                },
              }}
              startIcon={<FaTimes />}
            >
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              sx={{
                bgcolor: '#ec5252',
                '&:hover': {
                  bgcolor: '#d64444',
                },
              }}
              startIcon={<FaCheck />}
            >
              {currentIdea ? 'עדכן' : 'צור'} רעיון
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default Ideas;
