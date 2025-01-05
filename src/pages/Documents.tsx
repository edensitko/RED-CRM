import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  MenuItem,
  Chip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  owner: string;
  shared: string[];
  tags: string[];
}

const mockDocuments: Document[] = [
  {
    id: 'doc1',
    name: 'הצעת מחיר - לקוח א',
    type: 'pdf',
    size: '2.5 MB',
    lastModified: '2024-12-28',
    owner: 'דניאל כהן',
    shared: ['שרה לוי', 'יוסי מזרחי'],
    tags: ['הצעות מחיר', '2024'],
  },
  {
    id: 'doc2',
    name: 'חוזה התקשרות',
    type: 'docx',
    size: '1.8 MB',
    lastModified: '2024-12-25',
    owner: 'רחל אברהם',
    shared: ['משה כהן'],
    tags: ['חוזים', 'משפטי'],
  },
  {
    id: 'doc3',
    name: 'מצגת חברה',
    type: 'pptx',
    size: '5.2 MB',
    lastModified: '2024-12-20',
    owner: 'דניאל כהן',
    shared: [],
    tags: ['שיווק', 'מצגות'],
  },
  {
    id: 'doc4',
    name: 'דוח מכירות Q4',
    type: 'xlsx',
    size: '3.1 MB',
    lastModified: '2024-12-15',
    owner: 'שרה לוי',
    shared: ['דניאל כהן', 'רחל אברהם'],
    tags: ['דוחות', 'מכירות', '2024'],
  },
  {
    id: 'doc5',
    name: 'תכנית עסקית 2025',
    type: 'pdf',
    size: '4.7 MB',
    lastModified: '2024-12-10',
    owner: 'יוסי מזרחי',
    shared: ['דניאל כהן'],
    tags: ['תכניות', '2025'],
  },
];

const Documents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = Array.from(
    new Set(mockDocuments.flatMap((doc) => doc.tags))
  ).sort();

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => doc.tags.includes(tag));
    return matchesSearch && matchesType && matchesTags;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📝';
      case 'xlsx':
        return '📊';
      case 'pptx':
        return '📑';
      default:
        return '📄';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">מסמכים</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CloudUploadIcon />}
        >
          העלאת מסמך
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="חיפוש מסמכים"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            select
            label="סוג קובץ"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <MenuItem value="all">הכל</MenuItem>
            <MenuItem value="pdf">PDF</MenuItem>
            <MenuItem value="docx">Word</MenuItem>
            <MenuItem value="xlsx">Excel</MenuItem>
            <MenuItem value="pptx">PowerPoint</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          תגיות:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {allTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onClick={() => {
                if (selectedTags.includes(tag)) {
                  setSelectedTags(selectedTags.filter((t) => t !== tag));
                } else {
                  setSelectedTags([...selectedTags, tag]);
                }
              }}
              color={selectedTags.includes(tag) ? 'primary' : 'default'}
            />
          ))}
        </Box>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>שם המסמך</TableCell>
                <TableCell>גודל</TableCell>
                <TableCell>תאריך עדכון</TableCell>
                <TableCell>בעלים</TableCell>
                <TableCell>שיתוף</TableCell>
                <TableCell>תגיות</TableCell>
                <TableCell>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getFileIcon(doc.type)}
                      {doc.name}
                    </Box>
                  </TableCell>
                  <TableCell>{doc.size}</TableCell>
                  <TableCell>{doc.lastModified}</TableCell>
                  <TableCell>{doc.owner}</TableCell>
                  <TableCell>
                    {doc.shared.length > 0 ? (
                      <Chip
                        label={`${doc.shared.length} משתמשים`}
                        size="small"
                      />
                    ) : (
                      'לא משותף'
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {doc.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="primary">
                      <DownloadIcon />
                    </IconButton>
                    <IconButton size="small" color="primary">
                      <ShareIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default Documents;
