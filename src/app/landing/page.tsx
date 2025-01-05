'use client';
import React from 'react';

const LandingPage: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        textAlign: 'center',
      }}
    >
      <h1>Welcome to Restaurant Week Bingo!</h1>
      <p style={{ marginBottom: '20px' }}>
        Log in to start collecting squares and entering the raffle!
      </p>
      <a
        href="/api/auth/login"
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          marginTop: '10px',
          backgroundColor: '#0070f3',
          color: 'white',
          fontSize: '16px',
          textDecoration: 'none',
          borderRadius: '5px',
        }}
      >
        Log In
      </a>
    </div>
  );
};

export default LandingPage;
