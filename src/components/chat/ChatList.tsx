import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Typography,
  Paper,
  Box,
  IconButton,
  InputBase,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useChat, Chat } from '../../contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface Props {
  onNewChat?: () => void;
}

const ChatList: React.FC<Props> = ({ onNewChat }) => {
  const { chats, currentChat, setCurrentChat } = useChat();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredChats = chats.filter(chat =>
    chat.participants.some(participant =>
      participant.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const formatTimestamp = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: he });
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Paper
          component="form"
          sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', flexGrow: 1 }}
        >
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="חיפוש צ'אטים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
            <SearchIcon />
          </IconButton>
        </Paper>
        {onNewChat && (
          <IconButton onClick={onNewChat} color="primary">
            <AddIcon />
          </IconButton>
        )}
      </Box>
      
      <Divider />
      
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {filteredChats.map((chat) => (
          <ListItem
            key={chat.id}
            button
            selected={currentChat?.id === chat.id}
            onClick={() => setCurrentChat(chat)}
          >
            <ListItemAvatar>
              <Badge
                color="error"
                badgeContent={chat.unreadCount}
                invisible={chat.unreadCount === 0}
              >
                <Avatar>{chat.participants[0][0]}</Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={chat.participants.join(', ')}
              secondary={
                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '70%',
                    }}
                  >
                    {chat.lastMessage?.text || 'אין הודעות'}
                  </Typography>
                  {chat.lastMessage?.timestamp && (
                    <Typography component="span" variant="caption" color="text.secondary">
                      {formatTimestamp(chat.lastMessage.timestamp)}
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default ChatList;
