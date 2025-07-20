// src/index.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Change this line to import the UserPage
import UserPage from './UserPage.jsx'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Change this line to render the UserPage */}
    <UserPage />
  </React.StrictMode>
);