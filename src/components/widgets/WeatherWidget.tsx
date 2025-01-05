import React from 'react';
import { Paper, Typography, Box, Icon } from '@mui/material';
import { WbSunny as SunIcon, Cloud as CloudIcon, Opacity as RainIcon } from '@mui/icons-material';

const weatherData = {
  current: {
    temp: 18,
    condition: 'sunny',
    humidity: 45,
    wind: 12,
  },
  forecast: [
    { day: 'מחר', temp: 20, condition: 'sunny' },
    { day: 'יום ה׳', temp: 19, condition: 'cloudy' },
    { day: 'יום ו׳', temp: 16, condition: 'rainy' },
  ],
};

const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case 'sunny':
      return <SunIcon sx={{ color: '#FFB300' }} />;
    case 'cloudy':
      return <CloudIcon sx={{ color: '#78909C' }} />;
    case 'rainy':
      return <RainIcon sx={{ color: '#42A5F5' }} />;
    default:
      return <SunIcon />;
  }
};

const WeatherWidget: React.FC = () => {
  return (
    <Paper sx={{ height: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        מזג אוויר - תל אביב
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ mr: 2, transform: 'scale(1.5)' }}>
            {getWeatherIcon(weatherData.current.condition)}
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {weatherData.current.temp}°C
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, color: 'text.secondary' }}>
              <Typography variant="caption">
                לחות: {weatherData.current.humidity}%
              </Typography>
              <Typography variant="caption">
                רוח: {weatherData.current.wind} קמ"ש
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {weatherData.forecast.map((day) => (
            <Box
              key={day.day}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 1,
                borderRadius: 1,
                bgcolor: 'background.default',
              }}
            >
              <Typography variant="caption" sx={{ mb: 1 }}>
                {day.day}
              </Typography>
              {getWeatherIcon(day.condition)}
              <Typography variant="body2" sx={{ mt: 1 }}>
                {day.temp}°C
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default WeatherWidget;
