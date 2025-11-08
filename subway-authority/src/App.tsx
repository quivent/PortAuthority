import React from 'react';

export const App: React.FC = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0039A6',
      color: '#FCCC02',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px',
      fontWeight: 'bold',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div>🚇 Subway Authority</div>
      <div style={{ fontSize: '24px', color: 'white' }}>Port 7847</div>
    </div>
  );
};

export default App;
