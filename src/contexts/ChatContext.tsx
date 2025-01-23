import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  where,
  doc,
  updateDoc,
  getDoc,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

export interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: Timestamp;
  readBy: string[];
  chatId: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    createdAt: Timestamp;
  };
  unreadBy: { [key: string]: boolean };
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  allMessages: Message[];
  setCurrentChat: (chat: Chat | null) => void;
  sendMessage: (text: string) => Promise<void>;
  createChat: (participantIds: string[]) => Promise<string>;
  markChatAsRead: (chatId: string) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  hasNewMessages: boolean;
  unreadCount: number;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  lastCheckedRef: React.RefObject<Date>;
  selectedMessage: Message | null;
  setSelectedMessage: (message: Message | null) => void;
  updateLastChecked: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const lastCheckedRef = useRef<Date>(new Date());
  const { currentUser } = useAuth();

  // Listen to all chats
  useEffect(() => {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      orderBy('lastMessage.createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedChats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Chat[];
      setChats(updatedChats);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Fetch all messages
  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(
      messagesRef,
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setAllMessages(messages);
      
      // Update messages for current chat if exists
      if (currentChat) {
        const chatMessages = messages
          .filter(msg => msg.chatId === currentChat.id)
          .sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeA - timeB; // Sort ascending (oldest to newest)
          });
        setMessages(chatMessages);
      }
    });

    return () => unsubscribe();
  }, [currentChat]);

  // When current chat changes, filter messages
  useEffect(() => {
    if (!currentChat) {
      setMessages([]);
      return;
    }
    
    const chatMessages = allMessages
      .filter(msg => msg.chatId === currentChat.id)
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeA - timeB; // Sort ascending (oldest to newest)
      });
    setMessages(chatMessages);
  }, [currentChat, allMessages]);

  // Calculate unread count from messages
  useEffect(() => {
    if (!currentUser) return;

    const unreadMessages = allMessages.filter(message => 
      !message.readBy.includes(currentUser.uid)
    );

    setUnreadCount(unreadMessages.length);
    setHasNewMessages(unreadMessages.length > 0);
  }, [allMessages, currentUser]);

  const sendMessage = async (text: string) => {
    if (!currentUser || !currentChat) return;

    const messagesRef = collection(db, 'messages');
    const chatRef = doc(db, 'chats', currentChat.id);

    const messageData = {
      text,
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Anonymous',
      createdAt: serverTimestamp(),
      readBy: [currentUser.uid],
      chatId: currentChat.id,
    };

    try {
      // Add message to root messages collection
      await addDoc(messagesRef, messageData);

      // Update chat's last message
      await updateDoc(chatRef, {
        lastMessage: {
          text,
          createdAt: serverTimestamp(),
        },
        unreadBy: Object.fromEntries(
          chats
            .find(chat => chat.id === currentChat.id)?.participants
            .map(id => [id, id === currentUser.uid ? false : true]) || []
        )
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const createChat = async (participantIds: string[]) => {
    if (!currentUser) throw new Error('No authenticated user');

    const chatData = {
      participants: participantIds,
      lastMessage: {
        text: 'Chat created',
        createdAt: serverTimestamp(),
      },
      unreadBy: { [currentUser.uid]: false }
    };

    try {
      const chatRef = await addDoc(collection(db, 'chats'), chatData);
      return chatRef.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  };

  const markChatAsRead = async (chatId: string) => {
    if (!currentUser) return;

    // Mark all messages in this chat as read
    const chatMessages = allMessages.filter(msg => msg.chatId === chatId);
    const unreadMessages = chatMessages.filter(msg => !msg.readBy.includes(currentUser.uid));

    // Update each unread message
    const updatePromises = unreadMessages.map(message => {
      const messageRef = doc(db, 'messages', message.id);
      return updateDoc(messageRef, {
        readBy: [...message.readBy, currentUser.uid]
      });
    });

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking chat as read:', error);
      throw error;
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    if (!currentUser) return;
    
    const messageRef = doc(db, 'messages', messageId);
    try {
      const messageDoc = await getDoc(messageRef);
      if (messageDoc.exists()) {
        const message = messageDoc.data() as Message;
        if (!message.readBy.includes(currentUser.uid)) {
          await updateDoc(messageRef, {
            readBy: [...message.readBy, currentUser.uid]
          });
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const value = {
    chats,
    currentChat,
    messages,
    setMessages,
    allMessages,
    setCurrentChat,
    sendMessage,
    createChat,
    markChatAsRead,
    markMessageAsRead,
    hasNewMessages,
    unreadCount,
    isModalOpen,
    setIsModalOpen,
    lastCheckedRef,
    selectedMessage,
    setSelectedMessage,
    updateLastChecked: () => {
      if (lastCheckedRef.current) {
        lastCheckedRef.current = new Date();
      }
    },
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;