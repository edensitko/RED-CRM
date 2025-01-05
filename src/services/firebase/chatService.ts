import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  arrayContains,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Chat, Message } from '../../types/schemas';

const CHATS_COLLECTION = 'chats';
const MESSAGES_COLLECTION = 'messages';

const convertChatFromFirestore = (doc: DocumentData): Chat => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    lastMessage: data.lastMessage ? {
      ...data.lastMessage,
      timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
    } : null,
  };
};

const convertMessageFromFirestore = (doc: DocumentData): Message => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    timestamp: data.timestamp?.toDate() || new Date(),
  };
};

export const chatService = {
  async createChat(chat: Chat): Promise<void> {
    const chatRef = doc(db, CHATS_COLLECTION, chat.id);
    await setDoc(chatRef, {
      ...chat,
      createdAt: Timestamp.fromDate(chat.createdAt),
      updatedAt: Timestamp.fromDate(chat.updatedAt),
      lastMessage: chat.lastMessage ? {
        ...chat.lastMessage,
        timestamp: Timestamp.fromDate(chat.lastMessage.timestamp),
      } : null,
      isDeleted: false,
    });
  },

  async updateChat(id: string, updates: Partial<Chat>): Promise<void> {
    const chatRef = doc(db, CHATS_COLLECTION, id);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
      lastMessage: updates.lastMessage ? {
        ...updates.lastMessage,
        timestamp: Timestamp.fromDate(updates.lastMessage.timestamp),
      } : undefined,
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
      where('isDeleted', '==', false),
      orderBy('lastMessage.timestamp', 'desc')
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
      lastMessage: {
        text: message.text,
        senderId: message.senderId,
        timestamp: message.timestamp,
      },
      updatedAt: new Date(),
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
