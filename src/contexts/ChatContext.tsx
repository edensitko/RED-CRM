import React, { createContext, useContext, useState, useEffect } from 'react';
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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp;
  chatId: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
  };
  unreadCount: number;
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  setCurrentChat: (chat: Chat | null) => void;
  sendMessage: (text: string) => Promise<void>;
  createChat: (participantIds: string[]) => Promise<string>;
  markChatAsRead: (chatId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { currentUser } = useAuth();

  // Listen to user's chats
  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      setCurrentChat(null);
      setMessages([]);
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessage.timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedChats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Chat[];
      setChats(updatedChats);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen to current chat messages
  useEffect(() => {
    if (!currentChat) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, `chats/${currentChat.id}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(updatedMessages);
    });

    return () => unsubscribe();
  }, [currentChat]);

  const sendMessage = async (text: string) => {
    if (!currentUser || !currentChat) return;

    const messagesRef = collection(db, `chats/${currentChat.id}/messages`);
    const chatRef = doc(db, 'chats', currentChat.id);

    const messageData = {
      text,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Anonymous',
      timestamp: serverTimestamp(),
      chatId: currentChat.id,
    };

    await addDoc(messagesRef, messageData);
    await updateDoc(chatRef, {
      'lastMessage.text': text,
      'lastMessage.timestamp': serverTimestamp(),
      [`unreadBy.${currentUser.uid}`]: false,
    });
  };

  const createChat = async (participantIds: string[]) => {
    if (!currentUser) throw new Error('No authenticated user');

    // Add current user to participants if not already included
    const allParticipants = Array.from(new Set([...participantIds, currentUser.uid]));

    const chatData = {
      participants: allParticipants,
      createdAt: serverTimestamp(),
      unreadBy: Object.fromEntries(allParticipants.map(id => [id, false])),
    };

    const chatRef = await addDoc(collection(db, 'chats'), chatData);
    return chatRef.id;
  };

  const markChatAsRead = async (chatId: string) => {
    if (!currentUser) return;

    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`unreadBy.${currentUser.uid}`]: false,
    });
  };

  const value = {
    chats,
    currentChat,
    messages,
    setCurrentChat,
    sendMessage,
    createChat,
    markChatAsRead,
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
