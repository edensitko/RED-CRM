import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  read: boolean;
}

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTimestamp?: Date;
  unreadCount: number;
}

const CHATS_COLLECTION = 'chats';
const MESSAGES_COLLECTION = 'messages';

const convertTimestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

const convertChatFromFirestore = (doc: DocumentData): Chat => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    lastMessageTimestamp: data.lastMessageTimestamp ? convertTimestampToDate(data.lastMessageTimestamp) : new Date(),
  };
};

const convertMessageFromFirestore = (doc: DocumentData): Message => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    timestamp: data.timestamp ? convertTimestampToDate(data.timestamp) : new Date(),
  };
};

export const chatService = {
  async createChat(chat: Chat): Promise<void> {
    const chatRef = doc(db, CHATS_COLLECTION, chat.id);
    await setDoc(chatRef, {
      ...chat,
      lastMessageTimestamp: chat.lastMessageTimestamp ? Timestamp.fromDate(chat.lastMessageTimestamp) : null,
    });
  },

  async updateChat(id: string, updates: Partial<Chat>): Promise<void> {
    const chatRef = doc(db, CHATS_COLLECTION, id);
    const updateData = {
      ...updates,
      lastMessageTimestamp: updates.lastMessageTimestamp ? Timestamp.fromDate(updates.lastMessageTimestamp) : undefined,
    };
    await updateDoc(chatRef, updateData);
  },

  async getChat(id: string): Promise<Chat | null> {
    const chatRef = doc(db, CHATS_COLLECTION, id);
    const chatDoc = await getDoc(chatRef);
    if (!chatDoc.exists()) return null;
    return convertChatFromFirestore(chatDoc);
  },

  async getUserChats(userId: string, maxResults?: number): Promise<Chat[]> {
    const baseQuery = query(
      collection(db, CHATS_COLLECTION),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTimestamp', 'desc')
    );
    
    const finalQuery = maxResults ? query(baseQuery, limit(maxResults)) : baseQuery;
    const querySnapshot = await getDocs(finalQuery);
    return querySnapshot.docs.map(convertChatFromFirestore);
  },

  async addMessage(chatId: string, message: Message): Promise<void> {
    const messageRef = doc(collection(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION));
    const messageData = {
      ...message,
      id: messageRef.id,
      timestamp: Timestamp.fromDate(message.timestamp),
    };
    
    await setDoc(messageRef, messageData);
    
    // Update the chat's last message
    await this.updateChat(chatId, {
      lastMessage: message.content,
      lastMessageTimestamp: message.timestamp,
    });
  },

  async getChatMessages(chatId: string, maxResults?: number): Promise<Message[]> {
    const baseQuery = query(
      collection(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION),
      orderBy('timestamp', 'desc')
    );
    
    const finalQuery = maxResults ? query(baseQuery, limit(maxResults)) : baseQuery;
    const querySnapshot = await getDocs(finalQuery);
    return querySnapshot.docs.map(convertMessageFromFirestore);
  },

  async deleteChat(id: string, deletedBy: string): Promise<void> {
    const chatRef = doc(db, CHATS_COLLECTION, id);
    await updateDoc(chatRef, {
      isDeleted: true,
      deletedAt: Timestamp.fromDate(new Date()),
      deletedBy,
    });
  },
};
