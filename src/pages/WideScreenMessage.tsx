import React from 'react';
import logo from '../assets/logo.jpg'; // Adjust the path as needed
import './WideScreenMessage.css';
import { Box, Typography, Container } from '@mui/material';

const WideScreenMessage = () => {
  return (
    <Container className="wide-screen-message">
      <Box display="flex" flexDirection="column" alignItems="center">
        <img src={logo} alt="Logo" className="logo" style={{ maxWidth: '200px', borderRadius: '50%', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }} />
        <Typography variant="h4" component="h1" gutterBottom style={{ marginTop: '20px', fontWeight: 'bold' }}>
        :( אופס אין לי פה מספיק מקום להציג הכל 
        </Typography>
        <Typography variant="body1" style={{ marginTop: '10px', fontStyle: 'italic' }}>
      אנא שנו את גודל הדפדפן שלכם כדי להשתמש באתר
        </Typography>
      </Box>
    </Container>
  );
};

export default WideScreenMessage;
