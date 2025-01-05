import React from 'react';
import { Paper, Typography, Box, Chip, Avatar, AvatarGroup } from '@mui/material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const meetings = [
  {
    id: 1,
    title: 'פגישת לקוח - אלפא טכנולוגיות',
    time: '2025-01-02T10:00:00',
    attendees: ['דן', 'רון', 'מאיה'],
    type: 'פגישת מכירות',
  },
  {
    id: 2,
    title: 'סקירת התקדמות - ביתא בע"מ',
    time: '2025-01-02T14:30:00',
    attendees: ['גיל', 'שירה'],
    type: 'פגישת מעקב',
  },
  {
    id: 3,
    title: 'הדגמת מוצר - גמא תעשיות',
    time: '2025-01-03T11:00:00',
    attendees: ['טל', 'יעל', 'עומר', 'ליאת'],
    type: 'הדגמה',
  },
];

const UpcomingMeetingsWidget: React.FC = () => {
  return (
    <Paper sx={{ height: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        פגישות קרובות
      </Typography>
      <Box sx={{ mt: 2 }}>
        {meetings.map((meeting) => (
          <Box
            key={meeting.id}
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {meeting.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(meeting.time), 'EEEE, d בMMMM, HH:mm', { locale: he })}
              </Typography>
              <Chip
                label={meeting.type}
                size="small"
                sx={{ ml: 'auto' }}
                color={
                  meeting.type === 'פגישת מכירות'
                    ? 'primary'
                    : meeting.type === 'פגישת מעקב'
                    ? 'success'
                    : 'info'
                }
              />
            </Box>
            <AvatarGroup max={4} sx={{ justifyContent: 'flex-end' }}>
              {meeting.attendees.map((attendee) => (
                <Avatar
                  key={attendee}
                  sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                >
                  {attendee[0]}
                </Avatar>
              ))}
            </AvatarGroup>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default UpcomingMeetingsWidget;
