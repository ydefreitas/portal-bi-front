import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Debug environment variables
console.log('[ENV DEBUG]', {
  VITE_AZURE_CLIENT_ID: import.meta.env.VITE_AZURE_CLIENT_ID,
  VITE_AZURE_TENANT_ID: import.meta.env.VITE_AZURE_TENANT_ID,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  NODE_ENV: import.meta.env.MODE,
});

createRoot(document.getElementById("root")!).render(<App />);
