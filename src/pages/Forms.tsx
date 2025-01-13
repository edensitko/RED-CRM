import React, { useState, useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Select,
  FormControl,
  InputLabel,
  DialogContentText,
  Stack,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  OpenInNew as OpenInNewIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Description as FileIcon,
  Edit as EditIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  DriveFileRenameOutline as DriveFileRenameOutlineIcon,
} from '@mui/icons-material';
import {
  storage, db
} from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, getBlob, getStorage } from 'firebase/storage';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  updateDoc,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { pdfjs } from 'react-pdf';
import { storageService } from '../services/firebase/storageService';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// Add logging for debugging
const logAuthState = (user: any) => {
  console.log('Auth State:', {
    user: user,
    uid: user?.uid,
    email: user?.email,
    isAuthenticated: !!user
  });
};

interface FormDocument {
  id: string;
  name: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  uploadedAt: number;
  size: number;
  uploadedBy: string;
  userEmail: string;
}

const categories = [
  'טפסי מכירות',
  'טפסי משאבי אנוש',
  'טפסי שירות',
  'טפסים משפטיים',
  'אחר',
];

const Forms: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  
  useEffect(() => {
    // Log auth state on component mount and when currentUser changes
    logAuthState(currentUser);
  }, [currentUser]);

  const [documents, setDocuments] = useState<FormDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [fileType, setFileType] = useState<'txt' | 'pdf'>('txt');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<FormDocument | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedFileName, setEditedFileName] = useState('');
  const [viewerInstance, setViewerInstance] = useState(null);
  const viewer = useRef(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewType, setPreviewType] = useState<'pdf' | 'image' | 'video' | 'text' | 'other'>('other');

  useEffect(() => {
    if (!currentUser) {
      enqueueSnackbar('יש להתחבר למערכת כדי לצפות בטפסים', { variant: 'warning' });
      return;
    }
    loadDocuments();
  }, [currentUser]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const formsRef = collection(db, 'forms');
      const q = query(formsRef, orderBy('uploadedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FormDocument[];
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      enqueueSnackbar('שגיאה בטעינת המסמכים', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    
    if (!currentUser) {
      enqueueSnackbar('יש להתחבר למערכת כדי להעלות קבצים', { variant: 'error' });
      return;
    }

    const file = event.target.files[0];
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo'
    ];

    if (!allowedTypes.includes(file.type)) {
      enqueueSnackbar('סוג הקובץ אינו נתמך', { variant: 'error' });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    // Log auth state before upload
    logAuthState(currentUser);
    
    if (!currentUser) {
      enqueueSnackbar('יש להתחבר למערכת כדי להעלות קבצים', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
      return;
    }

    try {
      setLoading(true);
      
      const timestamp = Date.now();
      const storagePath = `forms/${timestamp}_${selectedFile.name}`;
      
      // Log the upload attempt
      console.log('Upload attempt:', {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        path: storagePath,
        userAuth: !!currentUser,
        userEmail: currentUser.email
      });
      
      enqueueSnackbar('מתחיל העלאת קובץ...', { variant: 'info' });
      
      // Use storageService instead of direct Firebase storage calls
      const downloadUrl = await storageService.uploadFile(selectedFile, storagePath);
      
      const formDoc = {
        name: selectedFile.name.split('.')[0],
        fileUrl: storagePath,
        fileName: `${timestamp}_${selectedFile.name}`,
        fileType: selectedFile.type,
        uploadedAt: timestamp,
        size: selectedFile.size,
        uploadedBy: currentUser.uid,
        userEmail: currentUser.email || '',
        category: selectedCategory,
      };

      await addDoc(collection(db, 'forms'), formDoc);
      
      enqueueSnackbar('הקובץ נשמר בהצלחה', { 
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'storage/unauthorized') {
        enqueueSnackbar('אין הרשאה להעלות קבצים. אנא וודא שהינך מחובר למערכת', { 
          variant: 'error',
          autoHideDuration: 5000
        });
      } else {
        enqueueSnackbar(`שגיאה בהעלאת הקובץ: ${error.message}`, { 
          variant: 'error',
          autoHideDuration: 5000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (document: FormDocument) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק מסמך זה?')) return;

    try {
      setLoading(true);
      
      // First delete from Firestore
      await deleteDoc(doc(db, 'forms', document.id));
      
      // Then try to delete from Storage using the fileUrl which contains the storage path
      try {
        const storage = getStorage();
        const fileRef = ref(storage, document.fileUrl); // Using fileUrl which contains the full storage path
        await deleteObject(fileRef);
      } catch (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue even if storage delete fails
      }
      
      enqueueSnackbar('המסמך נמחק בהצלחה', { variant: 'success' });
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      enqueueSnackbar('שגיאה במחיקת המסמך', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (doc: FormDocument) => {
    setPreviewFileName(doc.fileName);
    
    try {
      const storage = getStorage();
      const fileRef = ref(storage, doc.fileUrl);
      const downloadURL = await getDownloadURL(fileRef);
      setPreviewUrl(downloadURL);
      
      // Determine preview type based on file type
      if (doc.fileType.startsWith('image/')) {
        setPreviewType('image');
      } else if (doc.fileType === 'application/pdf') {
        setPreviewType('pdf');
      } else if (doc.fileType.startsWith('video/')) {
        setPreviewType('video');
      } else if (doc.fileType === 'text/plain' || doc.fileType === 'text/csv') {
        setPreviewType('text');
        try {
          // Get the text content directly from storage
          const blob = await getBlob(fileRef);
          const text = await blob.text();
          setEditedContent(text);
        } catch (error) {
          console.error('Error loading text content:', error);
          enqueueSnackbar('שגיאה בטעינת תוכן הקובץ', { variant: 'error' });
        }
      } else {
        setPreviewType('other');
      }
      
      setPreviewOpen(true);
    } catch (error) {
      console.error('Error loading preview:', error);
      enqueueSnackbar('שגיאה בטעינת תצוגה מקדימה', { variant: 'error' });
    }
  };

  const handleOpenFile = async (doc: FormDocument) => {
    try {
      const storage = getStorage();
      const fileRef = ref(storage, doc.fileUrl);
      
      // Get the blob directly instead of using fetch
      const blob = await getBlob(fileRef);
      const url = window.URL.createObjectURL(blob);
      
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening file:', error);
      enqueueSnackbar('שגיאה בפתיחת הקובץ', { variant: 'error' });
    }
  };

  const handleDownload = async (doc: FormDocument) => {
    try {
      const storage = getStorage();
      const fileRef = ref(storage, doc.fileUrl);
      
      // Get the blob directly instead of using fetch
      const blob = await getBlob(fileRef);
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name + (doc.fileType === 'text/plain' ? '.txt' : '.pdf');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      enqueueSnackbar('הקובץ הורד בהצלחה', { 
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      enqueueSnackbar('שגיאה בהורדת הקובץ', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewUrl(undefined);
    setPageNumber(1);
    setNumPages(null);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleEditClick = async (doc: FormDocument) => {
    const fileNameWithoutExtension = doc.fileName.substring(0, doc.fileName.lastIndexOf('.'));
    setSelectedDocument(doc);
    
    // Load text content if it's a text file
    if (doc.fileName.toLowerCase().endsWith('.txt') || doc.fileName.toLowerCase().endsWith('.csv')) {
      try {
        const fileRef = ref(storage, `forms/${doc.fileName}`);
        const blob = await getBlob(fileRef);
        const content = await blob.text();
        setEditedContent(content);
      } catch (error) {
        console.error('Error loading text file content:', error);
        enqueueSnackbar('שגיאה בטעינת תוכן הקובץ', { variant: 'error' });
        setEditedContent('');
      }
    } else {
      setEditedContent('');
    }
    
    setEditedFileName(fileNameWithoutExtension);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDocument) return;

    try {
      // Update filename if changed
      const fileExtension = selectedDocument.fileName.split('.').pop() || '';
      const newFileName = `${editedFileName.trim()}.${fileExtension}`;
      let updates: any = {};

      if (newFileName !== selectedDocument.fileName) {
        updates.fileName = newFileName;
      }

      // Update content if it's a text file
      if (selectedDocument.fileName.toLowerCase().endsWith('.txt') || selectedDocument.fileName.toLowerCase().endsWith('.csv')) {
        try {
          // Create a new Blob with the edited content
          const blob = new Blob([editedContent], { type: 'text/plain' });
          
          // Create reference to the new file location
          const storageRef = ref(storage, `forms/${newFileName}`);
          
          // Delete old file if name changed
          if (newFileName !== selectedDocument.fileName) {
            const oldFileRef = ref(storage, `forms/${selectedDocument.fileName}`);
            try {
              await deleteObject(oldFileRef);
            } catch (error) {
              console.error('Error deleting old file:', error);
            }
          }
          
          // Upload the new content
          await uploadBytes(storageRef, blob);
          
          // Get the new URL
          const newUrl = await getDownloadURL(storageRef);
          updates.fileUrl = newUrl;
        } catch (error) {
          console.error('Error updating file content:', error);
          throw new Error('Failed to update file content');
        }
      }

      // Update document in Firestore if there are any changes
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'forms', selectedDocument.id), updates);
      }

      setEditModalOpen(false);
      setSelectedDocument(null);
      setEditedFileName('');
      setEditedContent('');
      loadDocuments();
      enqueueSnackbar('המסמך עודכן בהצלחה', { variant: 'success' });
    } catch (error) {
      console.error('Error updating document:', error);
      enqueueSnackbar('שגיאה בעדכון המסמך', { variant: 'error' });
    }
  };

  const handleCreateFile = async () => {
    try {
      if (!currentUser) {
        enqueueSnackbar('יש להתחבר כדי ליצור קבצים', { variant: 'error' });
        return;
      }

      if (!newFileName) {
        enqueueSnackbar('נא להזין שם קובץ', { variant: 'error' });
        return;
      }

      setLoading(true);

      // Create file content
      let blob;
      let mimeType;
      
      if (fileType === 'txt') {
        mimeType = 'text/plain';
        blob = new Blob([newFileContent], { type: mimeType });
      } else if (fileType === 'pdf') {
        mimeType = 'application/pdf';
        // For PDF, you might want to use a PDF library like jspdf
        // For now, we'll just create a text-based PDF
        blob = new Blob([newFileContent], { type: mimeType });
      }

      if (!blob) {
        throw new Error('Failed to create file blob');
      }

      const timestamp = Date.now();
      const fileName = `${timestamp}_${newFileName}.${fileType}`;
      const storagePath = `forms/${fileName}`;
      
      // Get storage reference
      const storage = getStorage();
      const storageRef = ref(storage, storagePath);

      // Upload the file to Firebase Storage
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Create the document in Firestore
      const newDoc: FormDocument = {
        id: timestamp.toString(),
        name: newFileName,
        fileName: fileName,
        fileUrl: storagePath, // Store the storage path, not the download URL
        fileType: mimeType,
        uploadedAt: timestamp,
        uploadedBy: currentUser.uid,
        userEmail: currentUser?.email ?? '',
        size: blob.size,
        category: selectedCategory || (fileType === 'txt' ? 'מסמך טקסט' : 'מסמך PDF'),
      };

      // Add to Firestore
      await addDoc(collection(db, 'forms'), newDoc);
      
      // Refresh the documents list
      await loadDocuments();
      
      // Reset form
      setCreateDialogOpen(false);
      setNewFileName('');
      setNewFileContent('');
      setLoading(false);
      
      enqueueSnackbar('הקובץ נוצר בהצלחה', { variant: 'success' });
    } catch (error) {
      console.error('Error creating file:', error);
      enqueueSnackbar('שגיאה ביצירת הקובץ', { variant: 'error' });
      setLoading(false);
    }
  };

  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || doc.category === categoryFilter;
      
      const fileType = doc.fileType.split('/')[0];
      const matchesFileType = fileTypeFilter === 'all' || 
        (fileTypeFilter === 'document' && ['application', 'text'].includes(fileType)) ||
        (fileTypeFilter === 'image' && fileType === 'image') ||
        (fileTypeFilter === 'video' && fileType === 'video');
      
      return matchesSearch && matchesCategory && matchesFileType;
    });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPreviewContent = () => {
    switch (previewType) {
      case 'image':
        return (
          <Box sx={{ maxWidth: '100%', maxHeight: '80vh', overflow: 'auto' }}>
            <img 
              src={previewUrl} 
              alt={previewFileName}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Box>
        );
      case 'pdf':
        return (
          <Box sx={{ height: '80vh', overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Document
              file={previewUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => {
                console.error('Error loading PDF:', error);
                enqueueSnackbar('שגיאה בטעינת ה-PDF', { variant: 'error' });
              }}
              loading={
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              }
              error={
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="error">
                    שגיאה בטעינת הקובץ. אנא נסה שוב.
                  </Typography>
                </Box>
              }
            >
              {numPages && Array.from(new Array(numPages), (el, index) => (
                <Box key={`page_${index + 1}`} sx={{ mb: 2 }}>
                  <Page
                    pageNumber={index + 1}
                    width={Math.min(600, window.innerWidth - 64)}
                    loading={
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress size={20} />
                      </Box>
                    }
                  />
                  <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', display: 'block' }}>
                    עמוד {index + 1} מתוך {numPages}
                  </Typography>
                </Box>
              ))}
            </Document>
          </Box>
        );
      case 'video':
        return (
          <Box sx={{ maxWidth: '100%', maxHeight: '80vh' }}>
            <video 
              controls 
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            >
              <source src={previewUrl ?? undefined} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Box>
        );
      case 'text':
        return (
          <TextField
            multiline
            fullWidth
            rows={20}
            value={editedContent}
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'monospace' }
            }}
          />
        );
      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              לא ניתן להציג תצוגה מקדימה לסוג קובץ זה
            </Typography>
         
          </Box>
        );
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }} dir="rtl">
        <Typography variant="h5" sx={{ textAlign: 'center', mt: 4 }}>
          יש להתחבר למערכת כדי לצפות בטפסים
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }} dir="rtl">
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          צור קובץ חדש
        </Button>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadOpen(true)}
        >
          העלה קובץ
        </Button>
      </Stack>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="חיפוש"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>קטגוריה</InputLabel>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            label="קטגוריה"
          >
            <MenuItem value="">הכל</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>סוג קובץ</InputLabel>
          <Select
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            label="סוג קובץ"
          >
            <MenuItem value="all">הכל</MenuItem>
            <MenuItem value="document">מסמכים</MenuItem>
            <MenuItem value="image">תמונות</MenuItem>
            <MenuItem value="video">וידאו</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>שם קובץ</TableCell>
                    <TableCell>קטגוריה</TableCell>
                    <TableCell>תאריך העלאה</TableCell>
                    <TableCell>גודל</TableCell>
                    <TableCell>פעולות</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow
                      key={doc.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenFile(doc)}
                            color="error"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                          <span>{doc.name}</span>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={doc.category} size="small" />
                      </TableCell>
                      <TableCell>
                        {new Date(doc.uploadedAt).toLocaleDateString('he-IL')}
                      </TableCell>
                      <TableCell>
                        {formatFileSize(doc.size)}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            onClick={() => handlePreview(doc)}
                            size="small"
                            color="primary"
                            title="תצוגה מקדימה"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDownload(doc)}
                            size="small"
                            color="primary"
                            title="הורדה"
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleEditClick(doc)}
                            size="small"
                            color="primary"
                            title="עריכה"
                          >
                            <DriveFileRenameOutlineIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDelete(doc)}
                            size="small"
                            color="error"
                            title="מחיקה"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)}>
        <DialogTitle>העלאת מסמך חדש</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="category-label">קטגוריה</InputLabel>
              <Select
                labelId="category-label"
                value={selectedCategory}
                label="קטגוריה"
                onChange={(e) => setSelectedCategory(e.target.value)}
                dir="rtl"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat} dir="rtl">{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadIcon />}
              sx={{ direction: 'rtl' }}
            >
              בחר קובץ
              <input
                type="file"
                hidden
                onChange={handleFileSelect}
              />
            </Button>
            {selectedFile && (
              <Typography variant="body2" color="textSecondary">
                {selectedFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>ביטול</Button>
          <Button onClick={handleUpload} color="primary" disabled={!selectedFile || !selectedCategory}>
            העלה
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create File Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          צור קובץ חדש
          <IconButton
            onClick={() => setCreateDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="שם הקובץ"
              fullWidth
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
            <TextField
              margin="dense"
              label="תוכן הקובץ"
              fullWidth
              multiline
              rows={4}
              value={newFileContent}
              onChange={(e) => setNewFileContent(e.target.value)}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>סוג קובץ</InputLabel>
              <Select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as 'txt' | 'pdf')}
              >
                <MenuItem value="txt">Text (.txt)</MenuItem>
                <MenuItem value="pdf">PDF (.pdf)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>ביטול</Button>
          <Button
            onClick={handleCreateFile}
            variant="contained"
            disabled={!newFileName || !newFileContent}
            startIcon={<FileIcon />}
          >
            צור קובץ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>עריכת מסמך</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                fullWidth
                label="שם הקובץ"
                value={editedFileName}
                onChange={(e) => setEditedFileName(e.target.value)}
                dir="rtl"
              />
              <Typography variant="body2" color="textSecondary">
                {selectedDocument ? `.${selectedDocument.fileName.split('.').pop()}` : ''}
              </Typography>
            </Box>
            {selectedDocument?.fileName.toLowerCase().endsWith('.txt') || selectedDocument?.fileName.toLowerCase().endsWith('.csv') && (
              <TextField
                fullWidth
                label="תוכן הקובץ"
                multiline
                rows={4}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                dir="rtl"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>ביטול</Button>
          <Button onClick={handleSaveEdit} color="primary">
            שמור
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {previewFileName}
            </Typography>
           
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderPreviewContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>סגור</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Forms;
