import React, { useEffect, useRef } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface Props {
  onBack?: () => void;
  showBackButton?: boolean;
}

const ChatWindow: React.FC<Props> = ({ onBack, showBackButton = false }) => {
  const { currentChat, messages, sendMessage, markChatAsRead } = useChat();
  const { currentUser } = useAuth();
  const [newMessage, setNewMessage] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentChat) {
      markChatAsRead(currentChat.id);
    }
  }, [currentChat, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessage(newMessage);
    setNewMessage('');
  };

  if (!currentChat) {
    return (
      <Paper sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'background.default' 
      }}>
        <Typography color="text.secondary">בחר צ'אט להצגה</Typography>
      </Paper>
    );
  }

  const formatMessageTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: he });
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        borderBottom: 1,
        borderColor: 'divider',
      }}>
        {showBackButton && (
          <IconButton onClick={onBack}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Avatar>{currentChat.participants[0][0]}</Avatar>
        <Typography variant="h6">
          {currentChat.participants.join(', ')}
        </Typography>
      </Box>

      {/* Messages */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1,
        bgcolor: 'background.default',
      }}>
        {messages.map((message) => {
          const isOwnMessage = message.senderId === currentUser?.uid;

          return (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
              }}
            >
              <Box
                sx={{
                  maxWidth: '70%',
                  bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
                  color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2,
                  p: 1.5,
                  position: 'relative',
                }}
              >
                <Typography variant="body1">{message.text}</Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: isOwnMessage ? 'primary.light' : 'text.secondary',
                    display: 'block',
                    mt: 0.5,
                  }}
                >
                  {formatMessageTime(message.timestamp)}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Box 
        component="form" 
        onSubmit={handleSend}
        sx={{ 
          p: 2, 
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="הקלד הודעה..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            sx={{ bgcolor: 'background.default' }}
          />
          <IconButton 
            type="submit" 
            color="primary" 
            disabled={!newMessage.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChatWindow;
