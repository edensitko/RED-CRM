import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import {
  FaTimes,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaComments,
  FaEdit,
  FaTrash,
  FaFileAlt,
  FaTasks,
  FaClock,
  FaCheckCircle,
  FaDownload,
  FaProjectDiagram,
  FaFile,
  FaCalendarAlt,
  FaTag,
  FaLink,
  FaSave,
  FaUpload
} from 'react-icons/fa';
import { CustomerClass } from '../../types/schemas'
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, storage, auth } from '../../config/firebase';
import { Task } from '../../types/schemas';
import { Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

interface CustomerDetailsProps {
  customer?: CustomerClass;
  onClose: () => void;
  onSubmit: (customer: CustomerClass) => void;
  isNew?: boolean;
  users: any[];
}

const comeFromOptions = ['-', 'פייסבוק', 'אתר', 'אינסטגרם', 'מודעה', 'ממליץ', 'אחר'];

const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customer,
  onClose,
  onSubmit,
  isNew = false,
  users
}) => {
  const [formData, setFormData] = useState<Partial<CustomerClass>>(
    customer || {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assignedTo: [],
      Balance: 0,
      ComeFrom: '',
      Comments: [],
      companyName: '',
      CreatedBy: '',
      createdAt: new Date().toISOString(),
      Email: '',
      IsDeleted: false,
      lastName: '',
      Links: [],
      name: '',
      Phone: 0,
      Projects: [],
      Status: 'פעיל',
      Tags: [],
      Tasks: [],
      Files: []
    }
  );

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [newLink, setNewLink] = useState<{ url: string; description: string }>({
    url: '',
    description: ''
  });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // When creating new, start in editing mode
    if (isNew) {
      setIsEditing(true);
      setActiveTab('info');
    }
  }, [isNew]);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customer) return;

      setIsLoading(true);
      try {
        // Fetch files
        const filesQuery = query(
          collection(db, 'files'),
          where('customerId', '==', customer.id)
        );
        const filesSnapshot = await getDocs(filesQuery);
        const filesData = filesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFiles(filesData);

        // Fetch comments
        const commentsQuery = query(
          collection(db, 'Comments'),
          where('customerId', '==', customer.id),
          orderBy('createdAt', 'desc')
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        const commentsData = commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(commentsData);
      } catch (error) {
        console.error('Error fetching customer data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerData();
  }, [customer]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch all users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(usersData);

      // Fetch all projects
      const projectsQuery = query(collection(db, 'projects'));
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllProjects(projectsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as CustomerClass);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '-' ? '' : value
    }));
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !customer) return;

    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('No user logged in');
      return;
    }

    try {
      const commentRef = doc(collection(db, 'Comments'));
      const timestamp = Timestamp.now();
      
      const newCommentData = {
        id: commentRef.id,
        customerId: customer.id,
        content: newComment,
        createdAt: timestamp,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || currentUser.email || 'Unknown User',
        isEdited: false
      };

      await setDoc(commentRef, newCommentData);

      // Update local state
      setComments(prevComments => [newCommentData, ...prevComments]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleAddLink = () => {
    if (newLink.url && newLink.description) {
      const updatedLinks = [...(formData.Links || []), { ...newLink }];
      setFormData(prev => ({
        ...prev,
        Links: updatedLinks
      }));
      setNewLink({ url: '', description: '' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const auth = getAuth();

    if (!file) {
      console.error('No file selected');
      return;
    }

    if (!auth.currentUser) {
      console.error('User not authenticated');
      alert('Please log in to upload files');
      return;
    }

    try {
      setIsUploading(true);

      // Create a timestamp-based unique filename
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;

      // Get the current user's ID token
      const idToken = await auth.currentUser.getIdToken();

      // Create the storage path
      const storagePath = `customers/${formData.id}/files/${fileName}`;
      const storageRef = ref(storage, storagePath);

      // Upload with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: auth.currentUser.uid,
          originalName: file.name,
          size: file.size.toString(),
          timestamp: timestamp.toString()
        }
      };

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file, metadata);
      
      // Get the download URL with the ID token
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Create file record
      const newFile = {
        name: file.name,
        url: downloadURL,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: auth.currentUser.uid,
        path: storagePath
      };

      // Update form data with new file
      setFormData(prev => ({
        ...prev,
        Files: [...(prev.Files || []), newFile]
      }));

      setIsUploading(false);
      
      // Clear the file input
      if (e.target) {
        e.target.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setIsUploading(false);
      
      // Show specific error message
      let errorMessage = 'Failed to upload file. ';
      if (error.code === 'storage/unauthorized') {
        errorMessage += 'You do not have permission to upload files.';
      } else if (error.code === 'storage/canceled') {
        errorMessage += 'Upload was cancelled.';
      } else if (error.code === 'storage/retry-limit-exceeded') {
        errorMessage += 'Network error. Please try again.';
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
      
      // Clear the file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileIndex: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const fileToDelete = formData.Files?.[fileIndex];
      if (!fileToDelete) return;

      // Call API to delete the file
      await fetch(`/api/files/${customer?.id}/${fileToDelete.name}`, {
        method: 'DELETE',
      });

      // Update state
      setFormData(prev => ({
        ...prev,
        Files: prev.Files?.filter((_, index) => index !== fileIndex) || [],
      }));

      // Update customer
      onSubmit({
        ...formData,
        Files: formData.Files?.filter((_, index) => index !== fileIndex) || [],
      } as CustomerClass);
    } catch (error) {
      console.error('Error deleting file:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      if (!customer) {
        console.error('Cannot delete comment: customer is undefined');
        return;
      }
      const customerRef = doc(db, 'Customers', customer.id);
      const commentsRef = collection(customerRef, 'comments');
      await deleteDoc(doc(commentsRef, commentId));
      
      // Update local state
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const menuItems = useMemo(() => {
    const allTabs = [
      { id: 'info', label: 'מידע', icon: <FaFileAlt size={20} /> },
      { id: 'files', label: 'קבצים', icon: <FaDownload size={20} /> },
      { id: 'comments', label: 'הערות', icon: <FaComments size={20} /> },
      { id: 'links', label: 'קישורים', icon: <FaLink size={20} /> }
    ];

    if (!isNew) {
      return [
        { id: 'overview', label: 'סקירה', icon: <FaUser size={20} /> },
        ...allTabs
      ];
    }

    return allTabs;
  }, [isNew]);

  const renderEditForm = () => (
    <div className="space-y-6">
      <div className="bg-[#252525] rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">פרטי לקוח</h3>

        </div>

        <form id="customerForm" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6">
            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">שם</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  placeholder="הכנס שם..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">שם משפחה</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  placeholder="הכנס שם משפחה..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">שם חברה</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  placeholder="הכנס שם חברה..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">טלפון</label>
                <input
                  type="tel"
                  value={formData.Phone?.toString() || ''}
                  onChange={(e) => setFormData({ ...formData, Phone: Number(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  placeholder="הכנס מספר טלפון..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">אימייל</label>
                <input
                  type="email"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  placeholder="הכנס אימייל..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">תקציב</label>
                <input
                  type="number"
                  value={formData.Balance}
                  onChange={(e) => setFormData({ ...formData, Balance: Number(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  placeholder="הכנס תקציב..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">הגיע מ</label>
                <select
                  value={formData.ComeFrom || '-'}
                  name="ComeFrom"
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                >
                  {comeFromOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">סטטוס</label>
                <select
                  value={formData.Status}
                  onChange={(e) => setFormData({ ...formData, Status: e.target.value as "פעיל" | "לא פעיל" | "בטיפול" })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                >
                  <option value="פעיל">פעיל</option>
                  <option value="לא פעיל">לא פעיל</option>
                  <option value="בטיפול">בטיפול</option>
                </select>
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">מחוק?</label>
                <select
                  value={formData.IsDeleted ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, IsDeleted: e.target.value === "true" })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                >
                  <option value="false">לא</option>
                  <option value="true">כן</option>
                </select>
              </div> */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">משתמשים מוקצים</label>
                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {allUsers.map((user) => (
                    <label
                      key={user.id}
                      className={`relative flex items-center p-3 rounded-lg cursor-pointer w-full ${
                        formData.assignedTo?.includes(user.id)
                          ? ' border-2 border-gray-500'
                          : 'bg-[#1a1a1a] border-2 border-transparent'
                      } hover:bg-[#2a2a2a] transition-all group`}
                    >
                      <input
                        type="checkbox"
                        name="assignedTo"
                        value={user.id}
                        checked={formData.assignedTo?.includes(user.id)}
                        onChange={(e) => {
                          const userId = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            assignedTo: e.target.checked
                              ? [...(prev.assignedTo || []), userId]
                              : (prev.assignedTo || []).filter(id => id !== userId)
                          }));
                        }}
                        className="hidden"
                      />
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold">
                            {user.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <p className="font-medium text-white whitespace-nowrap">{user.name}</p>
                          <span className="text-gray-400 mx-1">•</span>
                          <p className="text-sm text-gray-400 truncate" title={user.email}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 ${
                        formData.assignedTo?.includes(user.id)
                          ? 'bg-red-500 border-red-500'
                          : 'border-gray-400 group-hover:border-red-500'
                      }`}>
                        {formData.assignedTo?.includes(user.id) && (
                          <FaCheckCircle className="text-white text-xs absolute -top-0.5 -right-0.5" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">פרויקטים</label>
                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {allProjects.map((project) => (
                    <label
                      key={project.id}
                      className={`relative flex items-center p-3 rounded-lg cursor-pointer w-full ${
                        formData.Projects?.includes(project.id)
                          ? ' border-2 border-gray-500'
                          : 'bg-[#1a1a1a] border-2 border-transparent'
                      } hover:bg-[#2a2a2a] transition-all group`}
                    >
                      <input
                        type="checkbox"
                        name="Projects"
                        value={project.id}
                        checked={formData.Projects?.includes(project.id)}
                        onChange={(e) => {
                          const projectId = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            Projects: e.target.checked
                              ? [...(prev.Projects || []), projectId]
                              : (prev.Projects || []).filter(id => id !== projectId)
                          }));
                        }}
                        className="hidden"
                      />
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                          <FaProjectDiagram className="text-blue-500" size={14} />
                        </div>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <p className="font-medium text-white whitespace-nowrap">{project.name}</p>
                          <span className="text-gray-400 mx-1">•</span>
                          <p className="text-sm text-gray-400 truncate">
                            {project.status}
                          </p>
                        </div>
                      </div>
                      <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 ${
                        formData.Projects?.includes(project.id)
                          ? 'bg-red-500 border-red-500'
                          : 'border-gray-400 group-hover:border-red-500'
                      }`}>
                        {formData.Projects?.includes(project.id) && (
                          <FaCheckCircle className="text-white text-xs absolute -top-0.5 -right-0.5" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return renderEditForm();
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="mt-10 bg-[#252525] rounded-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    {customer?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{customer?.name}</h2>
                    <div className="flex items-center gap-4 text-gray-400">
                      <div className="flex items-center gap-2">
                        <FaPhone size={14} />
                        <span>{customer?.Phone || 'אין מספר טלפון'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaEnvelope size={14} />
                        <span>{customer?.Email || 'אין אימייל'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-full text-sm ${
                    customer?.Status === 'פעיל' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {customer?.Status || 'לא ידוע'}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-[#252525] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">פרוייקטים</h3>
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <FaProjectDiagram className="text-blue-500" size={20} />
                  </div>
                </div>
                <div className="text-3xl font-bold">0</div>
                <p className="text-sm text-gray-400 mt-1">פרוייקטים פעילים</p>
              </div>
              <div className="bg-[#252525] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">משימות</h3>
                  <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <FaTasks className="text-purple-500" size={20} />
                  </div>
                </div>
                <div className="text-3xl font-bold">0</div>
                <p className="text-sm text-gray-400 mt-1">משימות פתוחות</p>
              </div>
              <div className="bg-[#252525] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">קבצים</h3>
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                    <FaFile className="text-green-500" size={20} />
                  </div>
                </div>
                <div className="text-3xl font-bold">0</div>
                <p className="text-sm text-gray-400 mt-1">קבצים מצורפים</p>
              </div>
            </div>

            {/* Details and Recent Activity */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#252525] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">פרטי לקוח</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-300">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <span>{customer?.ComeFrom || 'לא צוינה כתובת'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <FaCalendarAlt className="text-gray-400" />
                    <span>הצטרף ב: {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString('he-IL') : 'לא ידוע'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#252525] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">פעילות אחרונה</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center mt-1">
                      <FaUser className="text-blue-500" size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">לקוח נוצר במערכת</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {customer?.createdAt ? new Date(customer.createdAt).toLocaleString('he-IL') : 'תאריך לא ידוע'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
     
      case 'files':
        return (
          <div className="bg-[#252525] rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">קבצים</h3>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="fileUpload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="fileUpload"
                  className={`inline-flex mt-8 items-center px-8 py-2 bg-[#ec5252] text-white rounded-lg hover:bg-red-700 cursor-pointer transition-colors ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FaUpload className="ml-10" />
                  {isUploading ? 'מעלה...' : 'הוסף קובץ'}
                </label>
              </div>
            </div>

            <div className="space-y-4">
              {formData.Files?.map((file, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between p-3 bg-red-600/10 rounded-lg cursor-pointer hover:bg-red-600/20 transition-all"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <FaFile className="text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{file.name}</h4>
                      <div className="text-sm text-gray-400">
                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition-all"
                      title="Open file"
                    >
                      <FaDownload size={14} />
                    </a>
                    <button
                      onClick={() => handleDeleteFile(index)}
                      className="p-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                      title="Delete"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {(!formData.Files || formData.Files.length === 0) && (
                <div className="text-center py-6 text-gray-400">
                  No files uploaded yet
                </div>
              )}
            </div>
          </div>
        );
      case 'comments':
        return (
          <div className="space-y-6">
            <div className="bg-[#252525] rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-6">תגובות</h3>
              
              {/* Add Comment Form */}
              <div className="mb-8">
                <div className="relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="הוסף תגובה..."
                    className="w-full bg-[#1a1a1a] text-white rounded-lg p-4 min-h-[100px] focus:ring-2 focus:ring-red-500 focus:outline-none"
                    dir="rtl"
                  />
                  <button
                    onClick={handleAddComment}
                    className="absolute bottom-4 left-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                  >
                    <FaComments className="text-xl" />
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment, index) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between bg-[#1a1a1a] p-4 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <p className="text-xl text-white">{comment.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">{comment.createdByName}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.createdAt.toDate()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center py-8 text-gray-400 ">
                    אין תגובות עדיין
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'links':
        return (
          <div className="bg-[#252525] rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">קישורים</h3>
              <div className="flex gap-4">
                <div className="flex-1 space-y-4">
                  <input
                    type="url"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    placeholder="הכנס קישור..."
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                  />
                  <input
                    type="text"
                    value={newLink.description}
                    onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                    placeholder="תיאור הקישור..."
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                  />
                </div>
                <button
                  onClick={handleAddLink}
                  disabled={!newLink.url || !newLink.description}
                  className="px-4 py-2 mt-8  bg-[#ec5252] text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed h-fit"
                >
                  הוסף קישור
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {formData.Links && formData.Links.length > 0 ? (
                formData.Links.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-[#1a1a1a] p-4 rounded-lg group cursor-pointer hover:bg-[#151515] transition-all"
                    onClick={() => window.open(typeof link === 'string' ? link : link.url, '_blank')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                        <FaLink className="text-blue-500" size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">
                          {typeof link === 'string' ? link : link.description}
                        </h4>
                        <p className="text-sm text-gray-400 truncate">
                          {typeof link === 'string' ? link : link.url}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedLinks = formData.Links?.filter((_, i) => i !== index) || [];
                        setFormData(prev => ({
                          ...prev,
                          Links: updatedLinks
                        }));
                      }}
                      className="p-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">אין קישורים עדיין</p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-[#1e1e1e] rounded-lg w-[90vw] max-w-7xl h-[85vh] overflow-hidden relative text-white" dir="rtl">
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 bg-[#141414] border-l border-[#2a2a2a] p-4 flex flex-col justify-between">
              {/* Customer Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  {isNew ? 'לקוח חדש' : customer?.name}
                </h2>
                {!isNew && (
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    customer?.Status === 'פעיל' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {customer?.Status}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-5 px-2 py-3 rounded-lg transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-gray-600 text-white font-medium shadow-lg shadow-red-900/20'
                        : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white bg-black'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Action Buttons */}
              <div className="bg-[#141414] pt-4 border-t border-[#2a2a2a] space-y-2">
                <button 
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#ec5252] text-white hover:bg-red-700 transition-all duration-200"
                >
                  <FaEdit />
                  <span>{isNew ? 'צור לקוח' : ' שמור שינויים'}</span>
                </button>
                {!isNew && (
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-all duration-200 bg-black">
                    <FaTrash />
                    <span>מחק לקוח</span>
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#1e1e1e]">
              <div className="p-6">
                <button
                  onClick={onClose}
                  className="absolute top-4 left-4 rounded-full bg-[#ec5252] p-2 text-white hover:bg-red-700 hover:text-white transition-all"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
                <div className="max-w-4xl mx-auto">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default CustomerDetails;
