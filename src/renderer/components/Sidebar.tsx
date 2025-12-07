// src/renderer/components/Sidebar.tsx
// Purpose: Navigation sidebar with project switching and DELETE option

import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import type { ViewType } from '../../shared/types';

interface NavItem {
  id: ViewType;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'chat', icon: '💬', label: 'AI Chat' },
  { id: 'context', icon: '🧠', label: 'Project Context' },
  { id: 'terminal', icon: '⚡', label: 'Terminal' },
  { id: 'settings', icon: '⚙️', label: 'Settings' }
];

export function Sidebar() {
  const { 
    currentView, 
    setView, 
    currentProject, 
    projects,
    setCurrentProject,
    deleteProject
  } = useAppStore();
  
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Handle new project - clear current project to show Welcome Screen
  const handleNewProject = () => {
    setCurrentProject(null);
    setShowProjectMenu(false);
    setView('chat');
  };

  // Handle delete click - show confirmation
  const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // Don't select the project
    setDeleteConfirm(projectId);
  };

  // Confirm delete
  const handleConfirmDelete = async (projectId: string) => {
    await deleteProject(projectId);
    setDeleteConfirm(null);
    
    // If we deleted the current project, clear selection
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
    }
  };

  // Cancel delete
  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(null);
  };

  return (
    <aside className="sidebar">
      {/* Project Selector */}
      <div className="project-selector">
        <button 
          className="project-selector-btn"
          onClick={() => setShowProjectMenu(!showProjectMenu)}
        >
          <div className="project-info">
            <span className="project-name">
              {currentProject?.name || 'Select Project'}
            </span>
            <span className="project-stack">
              {currentProject?.techStack?.frontend?.slice(0, 2).join(', ') || 'No project'}
            </span>
          </div>
          <span className="dropdown-arrow">{showProjectMenu ? '▲' : '▼'}</span>
        </button>
        
        {showProjectMenu && (
          <div className="project-menu">
            {/* Existing Projects */}
            {projects.length > 0 && (
              <>
                <div className="project-menu-header">Your Projects</div>
                {projects.map((project) => (
                  <div key={project.id} className="project-menu-item-wrapper">
                    {deleteConfirm === project.id ? (
                      // Delete confirmation UI
                      <div className="delete-confirm">
                        <span className="delete-confirm-text">
                          Delete "{project.name}"?
                        </span>
                        <div className="delete-confirm-actions">
                          <button 
                            className="delete-confirm-btn cancel"
                            onClick={handleCancelDelete}
                          >
                            Cancel
                          </button>
                          <button 
                            className="delete-confirm-btn confirm"
                            onClick={() => handleConfirmDelete(project.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Normal project item
                      <button
                        className={`project-menu-item ${project.id === currentProject?.id ? 'active' : ''}`}
                        onClick={() => {
                          setCurrentProject(project);
                          setShowProjectMenu(false);
                        }}
                      >
                        <span className="project-menu-name">{project.name}</span>
                        <div className="project-menu-actions">
                          <span className="project-menu-facts">
                            {project.keyFacts?.length || 0} facts
                          </span>
                          <button
                            className="project-delete-btn"
                            onClick={(e) => handleDeleteClick(e, project.id)}
                            title="Delete project"
                          >
                            🗑️
                          </button>
                        </div>
                      </button>
                    )}
                  </div>
                ))}
                <div className="project-menu-divider" />
              </>
            )}
            
            {/* New Project Button */}
            <button
              className="project-menu-item new-project"
              onClick={handleNewProject}
            >
              <span className="new-project-icon">✨</span>
              <span>New Project</span>
              <span className="new-project-hint">Guided setup</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setView(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-text">
          DevFlow AI v2.0
        </div>
      </div>
    </aside>
  );
}
