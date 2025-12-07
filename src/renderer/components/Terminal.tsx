// src/renderer/components/Terminal.tsx
// Purpose: PowerShell terminal interface
// Features: Command input, output display, history navigation

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export function Terminal() {
  const {
    currentProject,
    terminalOutput,
    addTerminalOutput,
    clearTerminal
  } = useAppStore();

  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Execute command
  const executeCommand = async () => {
    if (!command.trim() || isExecuting) return;

    const cmd = command.trim();
    setCommand('');
    setHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    // Show command in output
    addTerminalOutput(`PS> ${cmd}`, 'output');

    setIsExecuting(true);

    try {
      const result = await window.electronAPI.ps.execute(cmd);

      if (result.success) {
        if (result.output) {
          addTerminalOutput(result.output, 'output');
        }
        addTerminalOutput(`Completed in ${result.executionTime}ms`, 'success');
      } else {
        addTerminalOutput(`ERROR: ${result.error}`, 'error');
      }
    } catch (err) {
      addTerminalOutput(`ERROR: ${(err as Error).message}`, 'error');
    }

    setIsExecuting(false);
    addTerminalOutput('', 'output'); // Empty line
  };

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCommand(history[history.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[history.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      clearTerminal();
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: 'List Files', command: 'Get-ChildItem' },
    { label: 'Current Path', command: 'Get-Location' },
    { label: 'Node Version', command: 'node --version' },
    { label: 'NPM Version', command: 'npm --version' },
  ];

  return (
    <div className="terminal-panel">
      {/* Header */}
      <div className="terminal-header">
        <div className="terminal-header-info">
          <h2>PowerShell Terminal</h2>
          {currentProject && (
            <span className="terminal-path">{currentProject.rootPath}</span>
          )}
        </div>
        <button
          className="btn btn-secondary btn-small"
          onClick={clearTerminal}
        >
          Clear
        </button>
      </div>

      {/* Quick Actions */}
      <div className="terminal-quick-actions">
        {quickActions.map((action, i) => (
          <button
            key={i}
            className="quick-action-btn"
            onClick={() => {
              setCommand(action.command);
              inputRef.current?.focus();
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Output Area */}
      <div className="terminal-output" ref={outputRef}>
        {terminalOutput.length === 0 ? (
          <div className="terminal-welcome">
            <p>DevFlow AI PowerShell Terminal Ready</p>
            <p className="hint">Type a command or use the quick actions above.</p>
            <p className="hint">Up/Down: History | Ctrl+L: Clear | Enter: Execute</p>
          </div>
        ) : (
          terminalOutput.map((item) => (
            <div
              key={item.id}
              className={`terminal-line ${item.type}`}
            >
              {item.content}
            </div>
          ))
        )}

        {isExecuting && (
          <div className="terminal-line executing">
            [....] Executing...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="terminal-input-container">
        <span className="terminal-prompt">PS&gt;</span>
        <input
          ref={inputRef}
          type="text"
          className="terminal-input"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter PowerShell command..."
          disabled={isExecuting}
        />
        <button
          className="btn btn-primary"
          onClick={executeCommand}
          disabled={!command.trim() || isExecuting}
        >
          {isExecuting ? '...' : 'Run'}
        </button>
      </div>

      {/* Help Footer */}
      <div className="terminal-footer">
        <span>Up/Down: History</span>
        <span>Ctrl+L: Clear</span>
        <span>Enter: Execute</span>
      </div>
    </div>
  );
}
