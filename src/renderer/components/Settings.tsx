// src/renderer/components/Settings.tsx
// Purpose: Application settings including API key management
// Features: API key input, project management, preferences

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export function Settings() {
  const {
    hasApiKey,
    setApiKey,
    checkApiKey,
    projects,
    deleteProject,
    currentProject
  } = useAppStore();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Clear save message after 3 seconds
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // Handle API key save
  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const success = await setApiKey(apiKeyInput.trim());

      if (success) {
        setSaveMessage({ type: 'success', text: 'API key saved successfully!' });
        setApiKeyInput('');
        await checkApiKey();
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save API key.' });
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Error saving API key.' });
    }

    setIsSaving(false);
  };

  // Handle project deletion
  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
    setConfirmDelete(null);
  };

  return (
    <div className="settings-panel">
      {/* Header */}
      <div className="settings-header">
        <h2>Settings</h2>
      </div>

      {/* API Key Section */}
      <div className="settings-section">
        <div className="section-header">
          <h3>Anthropic API Key</h3>
          {hasApiKey && (
            <span className="status-badge success">Configured</span>
          )}
        </div>

        <p className="section-description">
          Your API key is stored securely and encrypted on your device.
          Get your key from{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.electronAPI.dialog.openExternal('https://console.anthropic.com/');
            }}
          >
            console.anthropic.com
          </a>
        </p>

        <div className="api-key-input-group">
          <div className="input-wrapper">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={hasApiKey ? '****************' : 'sk-ant-api...'}
              className="settings-input"
            />
            <button
              className="toggle-visibility"
              onClick={() => setShowApiKey(!showApiKey)}
              type="button"
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSaveApiKey}
            disabled={!apiKeyInput.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : hasApiKey ? 'Update Key' : 'Save Key'}
          </button>
        </div>

        {saveMessage && (
          <div className={`save-message ${saveMessage.type}`}>
            {saveMessage.text}
          </div>
        )}
      </div>

      {/* Projects Section */}
      <div className="settings-section">
        <div className="section-header">
          <h3>Manage Projects</h3>
          <span className="count">{projects.length} projects</span>
        </div>

        <div className="projects-list">
          {projects.length === 0 ? (
            <div className="empty-projects">
              <p>No projects yet. Create one from the AI Chat!</p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={`project-item ${currentProject?.id === project.id ? 'current' : ''}`}
              >
                <div className="project-item-info">
                  <span className="project-item-name">
                    {project.name}
                    {currentProject?.id === project.id && (
                      <span className="current-badge">Current</span>
                    )}
                  </span>
                  <span className="project-item-path">{project.rootPath}</span>
                  <div className="project-item-tech">
                    {(Array.isArray(project.techStack) ? project.techStack : []).map((tech, i) => (
                      <span key={i} className="tech-badge-small">{tech}</span>
                    ))}
                  </div>
                </div>

                <div className="project-item-actions">
                  {confirmDelete === project.id ? (
                    <>
                      <span className="confirm-text">Delete?</span>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        Yes
                      </button>
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => setConfirmDelete(null)}
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => setConfirmDelete(project.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* About Section */}
      <div className="settings-section">
        <div className="section-header">
          <h3>About DevFlow AI</h3>
        </div>

        <div className="about-info">
          <p><strong>Version:</strong> 2.0.0</p>
          <p><strong>Purpose:</strong> AI-powered development assistant with PowerShell integration</p>
          <p><strong>Philosophy:</strong> You bring domain expertise, Claude brings technical implementation</p>
        </div>
      </div>
    </div>
  );
}
