// src/renderer/components/ProjectContext.tsx
// Purpose: Display and edit project context, facts, and decisions
// Features: View/edit description, manage key facts, track decisions

import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';

export function ProjectContext() {
  const { currentProject, updateProject } = useAppStore();
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [newFact, setNewFact] = useState('');
  const [newDecision, setNewDecision] = useState({ decision: '', reasoning: '' });

  if (!currentProject) {
    return (
      <div className="project-context">
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h2>No Project Selected</h2>
          <p>Select or create a project to view its context.</p>
        </div>
      </div>
    );
  }

  // Handle description edit
  const handleEditDescription = () => {
    setEditedDescription(currentProject.description);
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    await updateProject({
      ...currentProject,
      description: editedDescription
    });
    setIsEditingDescription(false);
  };

  // Handle adding a key fact
  const handleAddFact = async () => {
    if (!newFact.trim()) return;

    const fact = {
      id: `fact-${Date.now()}`,
      fact: newFact.trim(),
      source: 'manual',
      timestamp: new Date().toISOString()
    };

    await updateProject({
      ...currentProject,
      keyFacts: [...currentProject.keyFacts, fact]
    });

    setNewFact('');
  };

  // Handle removing a key fact
  const handleRemoveFact = async (factId: string) => {
    await updateProject({
      ...currentProject,
      keyFacts: currentProject.keyFacts.filter(f => f.id !== factId)
    });
  };

  // Handle adding a decision
  const handleAddDecision = async () => {
    if (!newDecision.decision.trim()) return;

    const decision = {
      id: `decision-${Date.now()}`,
      decision: newDecision.decision.trim(),
      reasoning: newDecision.reasoning.trim(),
      timestamp: new Date().toISOString()
    };

    await updateProject({
      ...currentProject,
      decisions: [...currentProject.decisions, decision]
    });

    setNewDecision({ decision: '', reasoning: '' });
  };

  // Handle removing a decision
  const handleRemoveDecision = async (decisionId: string) => {
    await updateProject({
      ...currentProject,
      decisions: currentProject.decisions.filter(d => d.id !== decisionId)
    });
  };

  return (
    <div className="project-context">
      {/* Header */}
      <div className="context-header">
        <h2>🎯 Project Context</h2>
        <p className="context-subtitle">
          Information that helps Claude understand your project
        </p>
      </div>

      {/* Project Info */}
      <div className="context-section">
        <div className="section-header">
          <h3>📋 Project Info</h3>
        </div>
        
        <div className="info-grid">
          <div className="info-item">
            <label>Name</label>
            <span>{currentProject.name}</span>
          </div>
          
          <div className="info-item">
            <label>Path</label>
            <code>{currentProject.rootPath}</code>
          </div>
          
          <div className="info-item">
            <label>Tech Stack</label>
            <div className="tech-badges">
              {currentProject.techStack.map((tech, i) => (
                <span key={i} className="tech-badge">{tech}</span>
              ))}
            </div>
          </div>
          
          <div className="info-item">
            <label>Created</label>
            <span>{new Date(currentProject.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="context-section">
        <div className="section-header">
          <h3>📝 Description</h3>
          {!isEditingDescription && (
            <button 
              className="btn btn-small btn-secondary"
              onClick={handleEditDescription}
            >
              Edit
            </button>
          )}
        </div>
        
        {isEditingDescription ? (
          <div className="description-edit">
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              rows={6}
              placeholder="Describe your project's purpose, target users, and key features..."
            />
            <div className="edit-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setIsEditingDescription(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveDescription}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="description-display">
            {currentProject.description || (
              <span className="placeholder">No description yet. Click Edit to add one.</span>
            )}
          </div>
        )}
      </div>

      {/* Key Facts */}
      <div className="context-section">
        <div className="section-header">
          <h3>💡 Key Facts</h3>
          <span className="count">{currentProject.keyFacts.length}</span>
        </div>
        
        <p className="section-description">
          Important details Claude should remember about your project
        </p>

        {/* Facts List */}
        <div className="facts-list">
          {currentProject.keyFacts.map((fact) => (
            <div key={fact.id} className="fact-item">
              <span className="fact-text">{fact.fact}</span>
              <button 
                className="remove-btn"
                onClick={() => handleRemoveFact(fact.id)}
                title="Remove fact"
              >
                ×
              </button>
            </div>
          ))}
          
          {currentProject.keyFacts.length === 0 && (
            <div className="empty-list">
              No key facts yet. Add important details below.
            </div>
          )}
        </div>

        {/* Add Fact */}
        <div className="add-item">
          <input
            type="text"
            value={newFact}
            onChange={(e) => setNewFact(e.target.value)}
            placeholder="Add a key fact..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddFact()}
          />
          <button 
            className="btn btn-primary"
            onClick={handleAddFact}
            disabled={!newFact.trim()}
          >
            Add
          </button>
        </div>
      </div>

      {/* Decisions */}
      <div className="context-section">
        <div className="section-header">
          <h3>⚖️ Decisions Made</h3>
          <span className="count">{currentProject.decisions.length}</span>
        </div>
        
        <p className="section-description">
          Technical and architectural decisions for this project
        </p>

        {/* Decisions List */}
        <div className="decisions-list">
          {currentProject.decisions.map((decision) => (
            <div key={decision.id} className="decision-item">
              <div className="decision-content">
                <span className="decision-text">{decision.decision}</span>
                {decision.reasoning && (
                  <span className="decision-reasoning">{decision.reasoning}</span>
                )}
              </div>
              <button 
                className="remove-btn"
                onClick={() => handleRemoveDecision(decision.id)}
                title="Remove decision"
              >
                ×
              </button>
            </div>
          ))}
          
          {currentProject.decisions.length === 0 && (
            <div className="empty-list">
              No decisions recorded yet.
            </div>
          )}
        </div>

        {/* Add Decision */}
        <div className="add-decision">
          <input
            type="text"
            value={newDecision.decision}
            onChange={(e) => setNewDecision({ ...newDecision, decision: e.target.value })}
            placeholder="Decision (e.g., Use Supabase for auth)"
          />
          <input
            type="text"
            value={newDecision.reasoning}
            onChange={(e) => setNewDecision({ ...newDecision, reasoning: e.target.value })}
            placeholder="Reasoning (optional)"
          />
          <button 
            className="btn btn-primary"
            onClick={handleAddDecision}
            disabled={!newDecision.decision.trim()}
          >
            Add Decision
          </button>
        </div>
      </div>
    </div>
  );
}
