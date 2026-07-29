import React from 'react';
import './App.css';

function App() {
  const BACKEND_URL = "https://jarvis-backend-h38f.onrender.com";

  const handleLogin = () => {
    // Redirect user to Render backend Microsoft OAuth endpoint
    window.location.href = `${BACKEND_URL}/api/auth/login`;
  };

  return (
    <div className="app-container">
      {/* Background glowing blurred circles for futuristic UI */}
      <div className="glow-circle glow-1"></div>
      <div className="glow-circle glow-2"></div>

      <div className="login-card">
        <div className="avatar-wrapper">
          <div className="avatar-icon">🤖</div>
        </div>

        <h1 className="title">
          Jarvis <span className="highlight">AI</span>
        </h1>
        
        <p className="subtitle">
          Next-Gen AI Assistant powered by <strong>LangGraph</strong> & <strong>Microsoft Entra ID</strong>
        </p>

        <button className="login-btn" onClick={handleLogin}>
          {/* Microsoft SVG Icon */}
          <svg className="ms-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23">
            <path fill="#f35325" d="M1 1h10v10H1z"/>
            <path fill="#81bc06" d="M12 1h10v10H12z"/>
            <path fill="#05a6f0" d="M1 12h10v10H1z"/>
            <path fill="#ffba08" d="M12 12h10v10H12z"/>
          </svg>
          Sign in with Microsoft
        </button>

        <div className="footer-tag">
          <span className="dot"></span> Secure Authentication
        </div>
      </div>
    </div>
  );
}

export default App;