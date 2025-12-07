// src/renderer/components/TitleBar.tsx
// Purpose: Custom title bar with working window controls (minimize, maximize, close)

import React, { useState, useEffect } from 'react';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  // Check if window is maximized on mount and after maximize/restore
  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.electronAPI.window.isMaximized();
      setIsMaximized(maximized);
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => {
    window.electronAPI.window.minimize();
  };

  const handleMaximize = async () => {
    await window.electronAPI.window.maximize();
    const maximized = await window.electronAPI.window.isMaximized();
    setIsMaximized(maximized);
  };

  const handleClose = () => {
    window.electronAPI.window.close();
  };

  return (
    <div className="title-bar">
      <div className="title-bar-drag">
        <div className="title-bar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">DevFlow AI</span>
        </div>
      </div>
      
      <div className="title-bar-controls">
        <button 
          className="title-bar-btn minimize"
          onClick={handleMinimize}
          title="Minimize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="2" y="5.5" width="8" height="1" fill="currentColor"/>
          </svg>
        </button>
        
        <button 
          className="title-bar-btn maximize"
          onClick={handleMaximize}
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="3" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1"/>
              <rect x="1" y="3" width="8" height="8" fill="#16161f" stroke="currentColor" strokeWidth="1"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1"/>
            </svg>
          )}
        </button>
        
        <button 
          className="title-bar-btn close"
          onClick={handleClose}
          title="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
