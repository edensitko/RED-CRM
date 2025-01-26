import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FaPaperPlane, FaTimes, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../contexts/ChatContext';
import type { Message } from '../../contexts/ChatContext';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  buttonPosition: { x: number; y: number } | null;
}

interface ReaderInfo {
  name: string;
  timestamp: Timestamp;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, buttonPosition }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const { 
    messages, 
    setMessages,
    selectedMessage, 
    setSelectedMessage,
    currentChat,
    setCurrentChat,
    sendMessage,
    createChat,
    chats,
    allMessages,
    markChatAsRead,
    markMessageAsRead
  } = useChat();

  // Initialize chat if none exists
  useEffect(() => {
    const initializeChat = async () => {
      if (!user) return;
      
      if (!currentChat && chats.length === 0) {
        try {
          // Create a general chat if none exists
          const chatId = await createChat(['general']); // Using 'general' as the chat identifier
          const newChat = chats.find(chat => chat.id === chatId);
          if (newChat) {
            setCurrentChat(newChat);
          }
        } catch (err) {
          console.error('Failed to create chat:', err);
        }
      } else if (!currentChat && chats.length > 0) {
        // Set the first available chat as current
        setCurrentChat(chats[0]);
      }
    };

    initializeChat();
  }, [user, currentChat, chats, createChat, setCurrentChat]);

  // Filter messages for current chat
  const currentChatMessages = currentChat 
    ? allMessages.filter(msg => msg.chatId === currentChat.id)
    : [];

  useEffect(() => {
    if (!currentChat) return;
    setMessages(currentChatMessages);
  }, [currentChat, allMessages, setMessages]);

  // Mark messages as read
  useEffect(() => {
    if (isOpen && user?.uid && currentChat && messages.length > 0) {
      // Mark chat as read
      markChatAsRead(currentChat.id).catch(console.error);
      
      // Mark individual messages as read
      messages.forEach(message => {
        if (!message.readBy.includes(user.uid)) {
          markMessageAsRead(message.id).catch(console.error);
        }
      });
    }
  }, [isOpen, user?.uid, currentChat, messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSending || !currentChat) return;

    setIsSending(true);
    setError(null);

    try {
      await sendMessage(newMessage);
      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setSelectedMessage(null);
        setPopupPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setSelectedMessage]);

  const renderMessage = (message: Message) => {
    const isCurrentUser = message.userId === user?.uid;
    const readByCount = message.readBy.length;
    const isRead = message.readBy.includes(user?.uid || '');

    return (
      <div
        key={message.id}
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`rounded-lg px-4 py-2 max-w-[70%] ${
            isCurrentUser ? 'bg-red-100 text-black' : 'bg-gray-100'
          }`}
        >
          {!isCurrentUser && (
            <div className="text-xs text-gray-600 mb-1">{message.userName}</div>
          )}
          <div>{message.text}</div>
          <div className="text-xs mt-1 text-right">
            {new Date(message.createdAt?.toDate()).toLocaleTimeString('he-IL', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
            {isCurrentUser && (
              <span className="ml-2">
                {readByCount > 1 ? <FaCheckDouble /> : <FaCheck />}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && buttonPosition && (
        <motion.div
          initial={{
            position: 'fixed',
            width: '44px',
            height: '44px',
            borderRadius: '9999px',
            left: '24px',
            bottom: '8px',
            opacity: 0,
            zIndex: 9999
          }}
          animate={{
            width: '280px',
            height: '600px',
            minHeight: '300px',
            maxHeight: 'calc(100vh - 50px)',
            borderRadius: '12px',
            left: '24px',
            bottom: '60px',
            opacity: 1,
            zIndex: 9999
          }}
          exit={{
            width: '44px',
            height: '44px',
            borderRadius: '9999px',
            left: '24px',
            bottom: '8px',
            opacity: 0,
            zIndex: 9999
          }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 100,
          }}
          className="bg-white shadow-2xl flex flex-col z-50 overflow-hidden"
        >
          <div className="p-2 border-b flex flex-row-reverse justify-between items-center bg-[#ec5252] text-white rounded-t-lg shadow-sm" dir="rtl">
            <button
              onClick={onClose}
              className="p-1 hover:bg-red-600 text-[#ec5252] hover:text-white rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold px-1">צ׳ט כללי</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3" dir="rtl">
            {messages.map((message) => renderMessage(message))}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="p-2 bg-red-100 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="p-2 border-t bg-gray-50" dir="rtl">
            <div className="flex items-center space-x-2 space-x-reverse">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="הקלד הודעה..."
                className="flex-1 p-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 bg-white text-right"
                disabled={isSending}
              />
              <button
                type="submit"
                className={`p-2 bg-[#ec5252] text-white rounded-lg transition-colors ${
                  isSending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
                }`}
                disabled={isSending}
              >
                <FaPaperPlane className="w-4 h-4 transform rotate-180" />
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatModal;