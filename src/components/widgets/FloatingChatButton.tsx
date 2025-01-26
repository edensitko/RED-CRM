import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaComments } from 'react-icons/fa';
import ChatModal from '../modals/ChatModal';
import { useChat } from '../../contexts/ChatContext';

const FloatingChatButton: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonPosition, setButtonPosition] = useState<{ x: number; y: number } | null>(null);
  const { 
    hasNewMessages, 
    unreadCount, 
    isModalOpen, 
    setIsModalOpen,
    lastCheckedRef,
    updateLastChecked 
  } = useChat();

  const handleOpenModal = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({ x: rect.left, y: rect.top });
    }
    setIsModalOpen(true);
    updateLastChecked();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="fixed bottom-2 m-1 left-1 z-[9999]">
      <div className="relative">
        <AnimatePresence>
          {!isModalOpen && (
            <motion.button
              ref={buttonRef}
              onClick={handleOpenModal}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors relative"
            >
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-600 rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-lg border-2 border-white"
                >
                  <span className="text-xs font-bold text-white px-1">
                    {unreadCount}
                  </span>
                </motion.div>
              )}
              <FaComments className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isModalOpen && (
            <ChatModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              buttonPosition={buttonPosition}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FloatingChatButton;