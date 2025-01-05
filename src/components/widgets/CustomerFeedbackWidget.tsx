import React from 'react';
import { Paper, Typography, Box, Avatar, Rating } from '@mui/material';

const feedback = [
  {
    id: 1,
    customer: 'יעל כהן',
    company: 'אלפא טכנולוגיות',
    avatar: 'YC',
    rating: 5,
    comment: 'שירות מעולה! המערכת שיפרה משמעותית את היעילות שלנו.',
    date: '2025-01-01',
  },
  {
    id: 2,
    customer: 'דוד לוי',
    company: 'ביתא פתרונות',
    avatar: 'DL',
    rating: 4,
    comment: 'מערכת אינטואיטיבית וקלה לשימוש. תמיכה טכנית מצוינת.',
    date: '2024-12-31',
  },
  {
    id: 3,
    customer: 'מיכל רון',
    company: 'גמא תעשיות',
    avatar: 'MR',
    rating: 5,
    comment: 'שדרוג משמעותי לעומת המערכת הקודמת שלנו.',
    date: '2024-12-30',
  },
];

const CustomerFeedbackWidget: React.FC = () => {
  return (
    <Paper sx={{ height: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        משוב לקוחות אחרון
      </Typography>
      <Box sx={{ mt: 2 }}>
        {feedback.map((item) => (
          <Box
            key={item.id}
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.default',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ mr: 1 }}>{item.avatar}</Avatar>
              <Box>
                <Typography variant="subtitle2">{item.customer}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.company}
                </Typography>
              </Box>
              <Rating
                value={item.rating}
                readOnly
                size="small"
                sx={{ ml: 'auto' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {item.comment}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {new Date(item.date).toLocaleDateString('he-IL')}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default CustomerFeedbackWidget;
