import './polyfills'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './config/pdf'  // Import PDF configuration
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
