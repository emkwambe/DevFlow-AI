// src/renderer/components/WelcomeScreen.tsx
// Purpose: Onboarding flow for new projects with VALUE-DRIVEN philosophy
// Shows guided steps for project setup

import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';

type OnboardingStep = 'welcome' | 'vision' | 'path' | 'done';

export function WelcomeScreen() {
  const { createProject } = useAppStore();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  
  // Vision form state
  const [projectName, setProjectName] = useState('');
  const [targetUsers, setTargetUsers] = useState('');
  const [problemSolved, setProblemSolved] = useState('');
  const [wishedFeatures, setWishedFeatures] = useState('');
  
  // Path state
  const [selectedPath, setSelectedPath] = useState('');

  const handleSelectFolder = async () => {
    const path = await window.electronAPI.dialog.selectFolder();
    if (path) {
      setSelectedPath(path);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    // Build rich description from vision answers
    const description = [
      targetUsers && `**Target Users:** ${targetUsers}`,
      problemSolved && `**Problem Solved:** ${problemSolved}`,
      wishedFeatures && `**Key Features:** ${wishedFeatures}`
    ].filter(Boolean).join('\n\n');

    await createProject({
      name: projectName.trim(),
      description: description || 'New project',
      rootPath: selectedPath,
      techStack: [] // Will be populated later during scaffolding
    });

    setStep('done');
  };

  // ==========================================================================
  // STEP: WELCOME
  // ==========================================================================
  if (step === 'welcome') {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="welcome-header">
            <h1>DevFlow AI</h1>
            <p className="tagline">Build software that matters.</p>
          </div>

          <div className="philosophy-section">
            <h2>How This Works</h2>
            <div className="philosophy-cards">
              <div className="philosophy-card user-card">
                <div className="card-icon">[You]</div>
                <h3>You Bring</h3>
                <ul>
                  <li>Who has the problem</li>
                  <li>What the problem is</li>
                  <li>What you wish existed</li>
                </ul>
              </div>

              <div className="philosophy-plus">+</div>

              <div className="philosophy-card claude-card">
                <div className="card-icon">[AI]</div>
                <h3>Claude Brings</h3>
                <ul>
                  <li>Best architecture</li>
                  <li>Security & performance</li>
                  <li>Production-ready code</li>
                </ul>
              </div>

              <div className="philosophy-equals">=</div>

              <div className="philosophy-card result-card">
                <div className="card-icon">[Ship]</div>
                <h3>Together</h3>
                <ul>
                  <li>Real value for users</li>
                  <li>Scalable solution</li>
                  <li>Ship faster</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-large"
            onClick={() => setStep('vision')}
          >
            Start New Project
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // STEP: VISION
  // ==========================================================================
  if (step === 'vision') {
    return (
      <div className="welcome-screen">
        <div className="welcome-content welcome-content-wide">
          <div className="step-header">
            <span className="step-badge">Step 1 of 3</span>
            <h1>Tell Me Your Vision</h1>
            <p>Don't worry about technical details - Claude handles that.</p>
          </div>

          <div className="vision-form">
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input
                type="text"
                className="form-input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., NumeralHealth, ParentBridge, TaskFlow"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="question-number">1.</span>
                WHO has this problem?
              </label>
              <textarea
                className="form-textarea"
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
                placeholder="e.g., Divorced parents with shared custody who struggle to coordinate schedules..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="question-number">2.</span>
                WHAT problem do they face?
              </label>
              <textarea
                className="form-textarea"
                value={problemSolved}
                onChange={(e) => setProblemSolved(e.target.value)}
                placeholder="e.g., They can't easily see shared calendars, split expenses fairly, or track who paid what..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="question-number">3.</span>
                WHAT do you wish existed?
              </label>
              <textarea
                className="form-textarea"
                value={wishedFeatures}
                onChange={(e) => setWishedFeatures(e.target.value)}
                placeholder="e.g., One app where both parents see the calendar, can request swaps, and automatically split costs..."
                rows={3}
              />
            </div>

            <p className="vision-note">
              The more detail you provide, the more tailored Claude's suggestions will be.
            </p>
          </div>

          <div className="step-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setStep('welcome')}
            >
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setStep('path')}
              disabled={!projectName.trim()}
            >
              Next: Choose Location
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // STEP: PATH SELECTION
  // ==========================================================================
  if (step === 'path') {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="step-header">
            <span className="step-badge">Step 2 of 3</span>
            <h1>Where Should I Build?</h1>
            <p>Choose where your project files will be created.</p>
          </div>

          <div className="path-selection">
            {selectedPath ? (
              <div className="path-selected">
                <div className="path-display">
                  <code>{selectedPath}</code>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={handleSelectFolder}
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="path-empty">
                <p>No folder selected yet</p>
                <button
                  className="btn btn-primary"
                  onClick={handleSelectFolder}
                >
                  Select Project Folder
                </button>
              </div>
            )}

            <div className="path-tip">
              <strong>Tip:</strong> Create a new empty folder for your project, like:
              <code>C:\Users\YourName\Documents\{projectName || 'my-project'}</code>
            </div>
          </div>

          <div className="step-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setStep('vision')}
            >
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateProject}
              disabled={!selectedPath}
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // STEP: DONE
  // ==========================================================================
  if (step === 'done') {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="step-header">
            <span className="step-badge success">Complete</span>
            <h1>{projectName} Created!</h1>
            <p>Your project is ready. Here's what to do next:</p>
          </div>

          <div className="next-steps">
            <div className="next-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Create Folder Structure</h3>
                <p>Set up the project folders (no files yet, just organization)</p>
                <code>Click "Step 1: Folders" in chat</code>
              </div>
            </div>

            <div className="next-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Scaffold the Project</h3>
                <p>Generate config files, dependencies, and starter code</p>
                <code>Click "Step 2: Scaffold" in chat</code>
              </div>
            </div>

            <div className="next-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Build Your First Feature</h3>
                <p>Start building real functionality with Claude's help</p>
                <code>Click "Step 3: Feature" in chat</code>
              </div>
            </div>
          </div>

          <p className="done-note">
            These steps will appear as buttons in the chat. You can also just type what you need!
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// =============================================================================
// GUIDED ACTIONS COMPONENT (Always visible in chat)
// =============================================================================

export function GuidedActions({ onAction }: { onAction: (prompt: string) => void }) {
  const { currentProject } = useAppStore();
  
  if (!currentProject) return null;
  
  const actions = [
    {
      id: 'step1',
      label: 'Step 1: Folders',
      icon: '[Dir]',
      description: 'Create folder structure',
      prompt: `Create the folder structure for ${currentProject.name}.

IMPORTANT: Create FOLDERS ONLY, no files. Use New-Item -ItemType Directory.

Based on the project description:
${currentProject.description}

Generate a PowerShell script that creates an organized folder structure appropriate for this project.`
    },
    {
      id: 'step2',
      label: 'Step 2: Scaffold',
      icon: '[Cfg]',
      description: 'Config files & starter code',
      prompt: `Scaffold ${currentProject.name} with all starter files.

The project is at: ${currentProject.rootPath}

Create a PowerShell script that generates:
- package.json with appropriate dependencies
- tsconfig.json
- tailwind.config.js
- next.config.js
- .env.example
- app/layout.tsx
- app/page.tsx
- app/globals.css

Use the Write-FileNoBom helper function for ALL file creation. Do NOT use here-strings or Set-Content with UTF8 encoding.

Project context:
${currentProject.description}`
    },
    {
      id: 'step3',
      label: 'Step 3: Feature',
      icon: '[Go]',
      description: 'Build first feature',
      prompt: `Let's build the first feature for ${currentProject.name}.

Based on the project vision:
${currentProject.description}

What would be the most valuable first feature to implement? Suggest 2-3 options and let me choose, then we'll build it together.`
    },
    {
      id: 'auth',
      label: 'Add Auth',
      icon: '[Key]',
      description: 'Supabase authentication',
      prompt: `Add Supabase authentication to ${currentProject.name}.

Project path: ${currentProject.rootPath}

Create:
1. Supabase client setup (lib/supabase/client.ts, server.ts)
2. Auth context provider
3. Login/Signup pages
4. Protected route middleware
5. User profile component

Use the Write-FileNoBom helper for all file creation.`
    },
    {
      id: 'database',
      label: 'Add Database',
      icon: '[DB]',
      description: 'Supabase schema',
      prompt: `Design and create the database schema for ${currentProject.name}.

Based on the project:
${currentProject.description}

Create:
1. SQL migration file with tables, RLS policies, and indexes
2. TypeScript types matching the schema
3. Database utility functions

Ask me clarifying questions if you need more details about the data model.`
    }
  ];

  return (
    <div className="guided-actions">
      <div className="guided-actions-label">Quick Actions:</div>
      <div className="guided-actions-buttons">
        {actions.map((action) => (
          <button
            key={action.id}
            className="guided-action-btn"
            onClick={() => onAction(action.prompt)}
            title={action.description}
          >
            <span className="action-icon">{action.icon}</span>
            <span className="action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
