import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import { PrimeReactProvider } from 'primereact/api'

// Handle dynamic theme based on system preference
const updateTheme = () => {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const themeLink = document.getElementById('theme-link') as HTMLLinkElement;
  if (themeLink) {
    const theme = isDark ? 'md-dark-indigo' : 'md-light-indigo';
    themeLink.href = `https://unpkg.com/primereact/resources/themes/${theme}/theme.css`;
  }
};

// Initial theme setup
updateTheme();

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrimeReactProvider>
      <App />
    </PrimeReactProvider>
  </React.StrictMode>,
)
