// src/renderer/components/ProjectSelector.tsx
// Purpose: Project selection with "Open Folder" option and recent projects
// Features: Dropdown, browse folder, project discovery, recent projects list

import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';

export function ProjectSelector() {
  const { 
    projects, 
    currentProject, 
    setCurrentProject,
    createProject,
    loadProjects
  } = useAppStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [discoveredProject, setDiscoveredProject] = useState<DiscoveredProject | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  interface DiscoveredProject {
    path: string;
    name: string;
    detectedFiles: string[];
    techStack: string[];
    description: string;
  }

  // Handle folder selection
  const handleBrowseFolder = async () => {
    try {
      const folderPath = await window.electronAPI.dialog.selectFolder();
      
      if (folderPath) {
        setIsScanning(true);
        setIsOpen(false);
        
        // Scan the folder for project files
        const discovered = await scanProjectFolder(folderPath);
        setDiscoveredProject(discovered);
        setShowDiscovery(true);
        setIsScanning(false);
      }
    } catch (err) {
      console.error('Failed to browse folder:', err);
      setIsScanning(false);
    }
  };

  // Scan folder for project files and detect tech stack
  const scanProjectFolder = async (folderPath: string): Promise<DiscoveredProject> => {
    const detectedFiles: string[] = [];
    const techStack: string[] = [];
    
    // Get folder name as project name
    const pathParts = folderPath.split(/[/\\]/);
    const name = pathParts[pathParts.length - 1] || 'my-project';

    // Check for common project files
    const filesToCheck = [
      { file: 'package.json', tech: 'Node.js' },
      { file: 'tsconfig.json', tech: 'TypeScript' },
      { file: 'next.config.js', tech: 'Next.js' },
      { file: 'next.config.mjs', tech: 'Next.js' },
      { file: 'tailwind.config.js', tech: 'Tailwind CSS' },
      { file: 'tailwind.config.ts', tech: 'Tailwind CSS' },
      { file: 'vite.config.js', tech: 'Vite' },
      { file: 'vite.config.ts', tech: 'Vite' },
      { file: '.env.local', tech: null },
      { file: '.env', tech: null },
      { file: 'supabase', tech: 'Supabase', isFolder: true },
      { file: 'prisma', tech: 'Prisma', isFolder: true },
      { file: 'firebase.json', tech: 'Firebase' },
      { file: '.firebaserc', tech: 'Firebase' },
      { file: 'Cargo.toml', tech: 'Rust' },
      { file: 'requirements.txt', tech: 'Python' },
      { file: 'pyproject.toml', tech: 'Python' },
      { file: 'go.mod', tech: 'Go' },
      { file: '.git', tech: 'Git', isFolder: true },
    ];

    for (const check of filesToCheck) {
      try {
        const fullPath = `${folderPath}/${check.file}`;
        const exists = await window.electronAPI.fs.exists(fullPath);
        
        if (exists) {
          detectedFiles.push(check.file);
          if (check.tech && !techStack.includes(check.tech)) {
            techStack.push(check.tech);
          }
        }
      } catch (err) {
        // File doesn't exist, continue
      }
    }

    // Try to read package.json for more details
    let description = '';
    try {
      const packageJsonPath = `${folderPath}/package.json`;
      const exists = await window.electronAPI.fs.exists(packageJsonPath);
      
      if (exists) {
        // We can't read file content yet, but we know it exists
        // Future: Read and parse package.json for dependencies
      }
    } catch (err) {
      // Ignore
    }

    // Default tech stack if nothing detected
    if (techStack.length === 0) {
      techStack.push('Unknown');
    }

    return {
      path: folderPath,
      name,
      detectedFiles,
      techStack,
      description
    };
  };

  // Import the discovered project
  const handleImportProject = async () => {
    if (!discoveredProject) return;

    await createProject({
      name: discoveredProject.name,
      description: discoveredProject.description || `Project at ${discoveredProject.path}`,
      techStack: discoveredProject.techStack,
      rootPath: discoveredProject.path
    });

    setShowDiscovery(false);
    setDiscoveredProject(null);
    await loadProjects();
  };

  // Select an existing project
  const handleSelectProject = (project: typeof currentProject) => {
    setCurrentProject(project);
    setIsOpen(false);
  };

  // Sort projects by most recent
  const sortedProjects = [...projects].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      {/* Project Selector Dropdown */}
      <div className="project-selector">
        <button 
          className="project-selector-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="project-selector-content">
            <span className="project-selector-label">
              {currentProject ? currentProject.name : 'Select Project'}
            </span>
            <span className="project-selector-subtitle">
              {currentProject 
                ? (Array.isArray(currentProject?.techStack) ? currentProject.techStack : []).slice(0, 2).join(', ')
                : 'No project'
              }
            </span>
          </div>
          <span className="project-selector-arrow">{isOpen ? 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â²' : 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼'}</span>
        </button>

        {isOpen && (
          <div className="project-dropdown">
            {/* Open Folder Option */}
            <button 
              className="dropdown-item browse-folder"
              onClick={handleBrowseFolder}
            >
              <span className="dropdown-icon">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡</span>
              <div className="dropdown-item-content">
                <span className="dropdown-item-label">Open Existing Project</span>
                <span className="dropdown-item-hint">Browse to your project folder</span>
              </div>
            </button>

            {/* Divider */}
            {sortedProjects.length > 0 && (
              <div className="dropdown-divider">
                <span>Recent Projects</span>
              </div>
            )}

            {/* Recent Projects */}
            {sortedProjects.map((project) => (
              <button
                key={project.id}
                className={`dropdown-item ${currentProject?.id === project.id ? 'active' : ''}`}
                onClick={() => handleSelectProject(project)}
              >
                <span className="dropdown-icon">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â</span>
                <div className="dropdown-item-content">
                  <span className="dropdown-item-label">{project.name}</span>
                  <span className="dropdown-item-hint">
                    {(Array.isArray(project.techStack) ? project.techStack : []).slice(0, 2).join(', ')}
                  </span>
                </div>
                {currentProject?.id === project.id && (
                  <span className="dropdown-check">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“</span>
                )}
              </button>
            ))}

            {/* Create New Option */}
            <div className="dropdown-divider"></div>
            <button 
              className="dropdown-item create-new"
              onClick={() => {
                setCurrentProject(null);
                setIsOpen(false);
              }}
            >
              <span className="dropdown-icon">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨</span>
              <div className="dropdown-item-content">
                <span className="dropdown-item-label">Create New Project</span>
                <span className="dropdown-item-hint">Start fresh with guided setup</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Scanning Overlay */}
      {isScanning && (
        <div className="modal-overlay">
          <div className="modal scanning-modal">
            <div className="scanning-spinner"></div>
            <h3>Scanning Project...</h3>
            <p>Detecting files and tech stack</p>
          </div>
        </div>
      )}

      {/* Project Discovery Modal */}
      {showDiscovery && discoveredProject && (
        <div className="modal-overlay">
          <div className="modal discovery-modal">
            <div className="modal-header">
              <h2>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ Project Discovered!</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowDiscovery(false);
                  setDiscoveredProject(null);
                }}
              >
                ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â
              </button>
            </div>

            <div className="modal-body">
              {/* Path */}
              <div className="discovery-section">
                <label>Path</label>
                <code className="discovery-path">{discoveredProject.path}</code>
              </div>

              {/* Detected Files */}
              {discoveredProject.detectedFiles.length > 0 && (
                <div className="discovery-section">
                  <label>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Found</label>
                  <div className="discovery-files">
                    {discoveredProject.detectedFiles.map((file, i) => (
                      <span key={i} className="discovery-file">{file}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tech Stack */}
              <div className="discovery-section">
                <label>Detected Tech Stack</label>
                <div className="discovery-tech-stack">
                  {discovered(Array.isArray(project?.techStack) ? project.techStack : []).map((tech, i) => (
                    <span key={i} className="tech-badge">{tech}</span>
                  ))}
                </div>
              </div>

              {/* Project Name */}
              <div className="discovery-section">
                <label>Project Name</label>
                <input
                  type="text"
                  className="discovery-input"
                  value={discoveredProject.name}
                  onChange={(e) => setDiscoveredProject({
                    ...discoveredProject,
                    name: e.target.value
                  })}
                />
              </div>

              {/* Description */}
              <div className="discovery-section">
                <label>Description (optional)</label>
                <textarea
                  className="discovery-textarea"
                  placeholder="Describe your project's purpose and goals..."
                  value={discoveredProject.description}
                  onChange={(e) => setDiscoveredProject({
                    ...discoveredProject,
                    description: e.target.value
                  })}
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowDiscovery(false);
                  setDiscoveredProject(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleImportProject}
              >
                Import Project
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
