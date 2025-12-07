// src/renderer/App.tsx
// Purpose: Main application component with navigation
// Features: Working sidebar navigation, view switching, project selection

import React, { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { ChatPanel } from './components/ChatPanel';
import { ProjectContext } from './components/ProjectContext';
import { Terminal } from './components/Terminal';
import { Settings } from './components/Settings';
import { ProjectSelector } from './components/ProjectSelector';

export function App() {
  const { 
    currentView, 
    setView, 
    currentProject, 
    projects,
    loadProjects,
    checkApiKey 
  } = useAppStore();

  // Load projects and check API key on mount
  useEffect(() => {
    loadProjects();
    checkApiKey();
  }, []);

  // Render the current view
  const renderView = () => {
    switch (currentView) {
      case 'chat':
        return <ChatPanel />;
      case 'context':
        return <ProjectContext />;
      case 'terminal':
        return <Terminal />;
      case 'settings':
        return <Settings />;
      default:
        return <ChatPanel />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Project Selector */}
        <ProjectSelector />

        {/* Navigation */}
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentView === 'chat' ? 'active' : ''}`}
            onClick={() => setView('chat')}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-label">AI Chat</span>
          </button>

          <button
            className={`nav-item ${currentView === 'context' ? 'active' : ''}`}
            onClick={() => setView('context')}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-label">Project Context</span>
          </button>

          <button
            className={`nav-item ${currentView === 'terminal' ? 'active' : ''}`}
            onClick={() => setView('terminal')}
          >
            <span className="nav-icon">⚡</span>
            <span className="nav-label">Terminal</span>
          </button>

          <button
            className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => setView('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <span className="version">DevFlow AI v2.0</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
