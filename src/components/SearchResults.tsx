import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Assignment as TaskIcon,
  Event as EventIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export interface SearchResult {
  id: string;
  type: 'lead' | 'customer' | 'task' | 'meeting' | 'widget';
  title: string;
  subtitle?: string;
  path: string;
  tags?: string[];
}

interface Props {
  results: SearchResult[];
  onResultClick?: (result: SearchResult) => void;
}

const SearchResults: React.FC<Props> = ({ results, onResultClick }) => {
  const navigate = useNavigate();

  const getIconForType = (type: string) => {
    switch (type) {
      case 'lead':
        return <PersonIcon />;
      case 'customer':
        return <BusinessIcon />;
      case 'task':
        return <TaskIcon />;
      case 'meeting':
        return <EventIcon />;
      case 'widget':
        return <DashboardIcon />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'lead':
        return 'ליד';
      case 'customer':
        return 'לקוח';
      case 'task':
        return 'משימה';
      case 'meeting':
        return 'פגישה';
      case 'widget':
        return 'וידג\'ט';
      default:
        return type;
    }
  };

  const handleClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      navigate(result.path);
    }
  };

  if (results.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">לא נמצאו תוצאות</Typography>
      </Box>
    );
  }

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Paper sx={{ width: '100%', maxHeight: 500, overflow: 'auto' }}>
      {Object.entries(groupedResults).map(([type, typeResults], groupIndex) => (
        <React.Fragment key={type}>
          {groupIndex > 0 && <Divider />}
          <Box sx={{ px: 2, py: 1, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" color="text.secondary">
              {getTypeLabel(type)}
            </Typography>
          </Box>
          <List disablePadding>
            {typeResults.map((result, index) => (
              <React.Fragment key={result.id}>
                <ListItem 
                  component="li"
                  onClick={() => handleClick(result)}
                >
                  <ListItemIcon>{getIconForType(result.type)}</ListItemIcon>
                  <ListItemText
                    primary={result.title}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {result.subtitle && (
                          <Typography variant="body2" component="span">
                            {result.subtitle}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < typeResults.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </React.Fragment>
      ))}
    </Paper>
  );
};

export default SearchResults;
