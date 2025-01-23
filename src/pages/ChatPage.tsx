import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FaPaperPlane, FaSmile } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: Timestamp;
  readBy: string[];
  chatId: string;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messageData);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        userId: 'currentUserId', // Replace with actual user ID
        userName: 'Current User', // Replace with actual user name
        createdAt: serverTimestamp(),
        readBy: [],
        chatId: 'currentChatId' // Replace with actual chat ID
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.userId === 'currentUserId' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                message.userId === 'currentUserId'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800'
              }`}
            >
              <p className="text-sm font-semibold">{message.userName}</p>
              <p className="mt-1">{message.text}</p>
              <p className="text-xs mt-1 opacity-75">
                {message.createdAt?.toDate().toLocaleTimeString()}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaSmile className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FaPaperPlane className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPage;