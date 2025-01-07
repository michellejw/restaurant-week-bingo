// src/app/NavBar.tsx
'use client';

import React from 'react';
import './NavBar.css';

interface NavbarProps {
  isAuthenticated: boolean;
}

const NavBar: React.FC<NavbarProps> = ({ isAuthenticated }) => {
  return (
    <nav className="navbar">
      {isAuthenticated && (
        <button
          onClick={() => {
            // Redirect to Auth0 logout endpoint
            window.location.href = '/api/auth/logout';
          }}
        >
          <h2>Logout</h2>
        </button>
      )}
    </nav>
  );
};

export default NavBar;
