// src/renderer/components/AIChat.tsx
// Purpose: AI chat interface with GUIDED quick actions for beginners

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export function AIChat() {
  const { 
    messages, 
    isAiLoading, 
    sendMessage, 
    clearMessages,
    currentProject,
    addTerminalOutput,
    setView
  } = useAppStore();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isAiLoading) return;
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    // Auto-send after a brief moment so user sees what's being asked
    setTimeout(() => {
      sendMessage(prompt);
      setInput('');
    }, 100);
  };

  const runScript = async (script: string) => {
    addTerminalOutput(`\n${'='.repeat(50)}`);
    addTerminalOutput('Running PowerShell script from AI...');
    addTerminalOutput('='.repeat(50));
    
    setView('terminal');
    
    const result = await window.electronAPI.ps.execute(script);
    
    if (result.output) {
      addTerminalOutput(result.output);
    }
    if (result.error) {
      addTerminalOutput(`ERROR: ${result.error}`);
    }
    addTerminalOutput(`\nCompleted in ${result.executionTime}ms`);
    
    if (result.filesCreated && result.filesCreated.length > 0) {
      addTerminalOutput(`\nFiles created:`);
      result.filesCreated.forEach(f => addTerminalOutput(`  ✓ ${f}`));
    }
  };

  const formatMessage = (content: string) => {
    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
        if (match) {
          const language = match[1] || 'code';
          const code = match[2];
          const isPowerShell = language.toLowerCase() === 'powershell' || language.toLowerCase() === 'ps1';
          
          return (
            <div key={index} className="code-block">
              <div className="code-header">
                <span className="code-language">{language}</span>
                <div className="code-actions">
                  <button 
                    className="code-btn"
                    onClick={() => navigator.clipboard.writeText(code)}
                    title="Copy code"
                  >
                    📋 Copy
                  </button>
                  {isPowerShell && (
                    <button 
                      className="code-btn run"
                      onClick={() => runScript(code)}
                      title="Run in terminal"
                    >
                      ▶ Run
                    </button>
                  )}
                </div>
              </div>
              <pre><code>{code}</code></pre>
            </div>
          );
        }
      }
      
      // Format regular text with markdown-like styling
      return (
        <div key={index} className="message-text">
          {part.split('\n').map((line, i) => {
            // Headers
            if (line.startsWith('## ')) {
              return <h3 key={i}>{line.replace('## ', '')}</h3>;
            }
            if (line.startsWith('# ')) {
              return <h2 key={i}>{line.replace('# ', '')}</h2>;
            }
            // Bold
            const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Inline code
            const withCode = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
            
            return (
              <p 
                key={i} 
                dangerouslySetInnerHTML={{ __html: withCode || '&nbsp;' }}
              />
            );
          })}
        </div>
      );
    });
  };

  // Guided quick actions with explanations
  const quickActions = [
    {
      step: '1',
      icon: '🏗️',
      title: 'Create Folder Structure',
      description: 'Set up the directories for your project',
      analogy: 'Like drawing empty rooms in a house plan',
      prompt: `Create the folder structure for ${currentProject?.name || 'my project'}. I'm using ${currentProject?.techStack.frontend.join(', ') || 'Next.js'} for frontend and ${currentProject?.techStack.backend.join(', ') || 'Supabase'} for backend. Generate a PowerShell script that creates all the necessary folders.`
    },
    {
      step: '2',
      icon: '🔧',
      title: 'Scaffold My Project',
      description: 'Generate starter files and configurations',
      analogy: 'Like putting in walls, wiring, and fixtures',
      prompt: `Scaffold my ${currentProject?.name || 'project'} with starter files. Create the essential config files (package.json, tsconfig, etc.) and basic component structure. Generate a PowerShell script to create all files.`
    },
    {
      step: '3',
      icon: '🎯',
      title: 'Build First Feature',
      description: 'Start with your core functionality',
      analogy: 'The main thing that makes your app unique',
      prompt: `Based on my project description: "${currentProject?.description || 'my app'}", what should be the first feature I build? Give me a clear plan and then help me implement it step by step.`
    },
    {
      step: '★',
      icon: '🔐',
      title: 'Set Up Authentication',
      description: 'User login, signup, and sessions',
      analogy: 'Usually needed early for most apps',
      prompt: `Set up authentication for ${currentProject?.name || 'my project'} using ${currentProject?.techStack.backend.includes('Supabase') ? 'Supabase Auth' : currentProject?.techStack.backend.includes('Firebase') ? 'Firebase Auth' : 'my backend'}. Include login, signup, and protected routes. Generate the complete implementation.`
    }
  ];

  return (
    <div className="ai-chat">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h2>🤖 AI Assistant</h2>
          <p className="chat-context-info">
            Context: {currentProject?.name || 'No project'} • 
            {currentProject?.keyFacts.length || 0} facts • 
            {currentProject?.decisions.length || 0} decisions
          </p>
        </div>
        <button 
          className="btn btn-secondary"
          onClick={clearMessages}
          disabled={messages.length === 0}
        >
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <h3>👋 How can I help with {currentProject?.name || 'your project'}?</h3>
            <p>I have your project context loaded. Follow these steps to get started:</p>
            
            <div className="guided-actions">
              {quickActions.map((action, index) => (
                <button 
                  key={index}
                  className="guided-action"
                  onClick={() => handleQuickAction(action.prompt)}
                >
                  <div className="guided-action-header">
                    <span className="guided-step">
                      {action.step === '★' ? action.step : `Step ${action.step}`}
                    </span>
                    <span className="guided-icon">{action.icon}</span>
                    <span className="guided-title">{action.title}</span>
                  </div>
                  <div className="guided-description">{action.description}</div>
                  <div className="guided-analogy">💡 {action.analogy}</div>
                </button>
              ))}
            </div>

            <div className="welcome-tip">
              <strong>💬 Or just ask me anything!</strong>
              <p>Type your question below. I know your tech stack and project details.</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`chat-message ${message.role}`}
            >
              <div className="message-header">
                <span className="message-role">
                  {message.role === 'user' ? '👤 You' : '🤖 Claude'}
                </span>
                <span className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">
                {formatMessage(message.content)}
              </div>
            </div>
          ))
        )}
        
        {isAiLoading && (
          <div className="chat-message assistant loading">
            <div className="message-header">
              <span className="message-role">🤖 Claude</span>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your project... (Shift+Enter for new line)"
          disabled={isAiLoading}
          rows={1}
        />
        <button 
          className="btn btn-primary send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isAiLoading}
        >
          {isAiLoading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
