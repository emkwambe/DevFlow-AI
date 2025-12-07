// src/renderer/components/ChatPanel.tsx
// Purpose: AI chat interface with ALWAYS-VISIBLE guided actions
// Features: Message display, code blocks, script execution, quick action buttons

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { WelcomeScreen, GuidedActions } from './WelcomeScreen';

export function ChatPanel() {
  const {
    currentProject,
    messages,
    sendMessage,
    clearMessages,
    isAiLoading,
    hasApiKey
  } = useAppStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentProject]);

  const handleSend = async () => {
    if (!input.trim() || isAiLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle guided action click
  const handleGuidedAction = (prompt: string) => {
    setInput(prompt);
  };

  // Handle script execution from message
  const handleRunScript = async (scriptContent: string) => {
    const { addTerminalOutput, sendExecutionResult } = useAppStore.getState();

    addTerminalOutput('='.repeat(50));
    addTerminalOutput('Running PowerShell script from AI...');
    addTerminalOutput('='.repeat(50));

    let outputText = '';
    let success = false;
    let executionTime = 0;

    try {
      const result = await window.electronAPI.ps.execute(scriptContent);
      executionTime = result.executionTime || 0;

      if (result.success) {
        success = true;
        outputText = result.output || '';

        addTerminalOutput(result.output);
        addTerminalOutput('');
        addTerminalOutput(`[OK] Completed in ${result.executionTime}ms`);

        if (result.filesCreated && result.filesCreated.length > 0) {
          addTerminalOutput('');
          addTerminalOutput('Files created:');
          result.filesCreated.forEach(f => {
            addTerminalOutput(`   ${f}`);
            outputText += `\nCreated: ${f}`;
          });
        }
      } else {
        success = false;
        outputText = result.error || 'Unknown error';
        addTerminalOutput(`ERROR: ${result.error}`);
      }
    } catch (err) {
      success = false;
      outputText = (err as Error).message;
      addTerminalOutput(`ERROR: ${(err as Error).message}`);
    }

    addTerminalOutput('');

    // Send execution result back to AI for evaluation
    await sendExecutionResult(scriptContent, outputText, success, executionTime);
  };

  // Show welcome screen if no project selected
  if (!currentProject) {
    return <WelcomeScreen />;
  }

  // Show API key warning if not configured
  if (!hasApiKey) {
    return (
      <div className="chat-panel">
        <div className="api-key-warning">
          <div className="warning-icon">[!]</div>
          <h2>API Key Required</h2>
          <p>Please configure your Anthropic API key in Settings to start chatting with Claude.</p>
          <button
            className="btn btn-primary"
            onClick={() => useAppStore.getState().setView('settings')}
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h2>AI Assistant</h2>
          <span className="chat-context-info">
            Context: {currentProject.name} | {currentProject?.keyFacts?.length || 0} facts | {currentProject?.decisions?.length || 0} decisions
          </span>
        </div>
        <button
          className="btn btn-secondary btn-small"
          onClick={clearMessages}
        >
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="empty-icon">[&gt;]</div>
            <h3>Ready to Build!</h3>
            <p>Use the quick actions below or type your request.</p>
            <div className="empty-suggestions">
              <p>Try asking:</p>
              <ul>
                <li>"Create the folder structure for my project"</li>
                <li>"Scaffold with Next.js, Supabase, and Tailwind"</li>
                <li>"What should we build first?"</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`chat-message ${message.role} ${message.isExecutionResult ? 'execution-result' : ''}`}>
              <div className="message-header">
                <span className="message-role">
                  {message.role === 'user' ? '[You]' : message.role === 'system' ? '[Execution]' : '[Claude]'}
                </span>
                <span className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">
                <MessageContent
                  content={message.content}
                  hasScript={message.hasScript}
                  scriptContent={message.scriptContent}
                  onRunScript={handleRunScript}
                />
              </div>
            </div>
          ))
        )}

        {isAiLoading && (
          <div className="chat-message assistant loading">
            <div className="message-header">
              <span className="message-role">[Claude]</span>
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

      {/* Guided Actions - ALWAYS VISIBLE */}
      <GuidedActions onAction={handleGuidedAction} />

      {/* Input */}
      <div className="chat-input-container">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Claude anything about your project..."
          rows={3}
          disabled={isAiLoading}
        />
        <button
          className="btn btn-primary chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isAiLoading}
        >
          {isAiLoading ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// MESSAGE CONTENT RENDERER
// =============================================================================

interface MessageContentProps {
  content: string;
  hasScript?: boolean;
  scriptContent?: string;
  onRunScript: (script: string) => void;
}

function MessageContent({ content, hasScript, scriptContent, onRunScript }: MessageContentProps) {
  // Parse content for code blocks
  const parts = parseMessageContent(content);

  return (
    <div className="message-body">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <div key={index} className="code-block">
              <div className="code-header">
                <span className="code-language">{part.language?.toUpperCase() || 'CODE'}</span>
                <div className="code-actions">
                  <button
                    className="code-action-btn"
                    onClick={() => navigator.clipboard.writeText(part.content)}
                  >
                    Copy
                  </button>
                  {part.language === 'powershell' && (
                    <button
                      className="code-action-btn run-btn"
                      onClick={() => onRunScript(part.content)}
                    >
                      Run
                    </button>
                  )}
                </div>
              </div>
              <pre className="code-content">
                <code>{part.content}</code>
              </pre>
            </div>
          );
        } else {
          return (
            <div key={index} className="text-content">
              {formatTextContent(part.content)}
            </div>
          );
        }
      })}
    </div>
  );
}

// =============================================================================
// CONTENT PARSING UTILITIES
// =============================================================================

interface ContentPart {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

function parseMessageContent(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) {
        parts.push({ type: 'text', content: text });
      }
    }

    // Add code block
    parts.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trim()
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) {
      parts.push({ type: 'text', content: text });
    }
  }

  return parts.length > 0 ? parts : [{ type: 'text', content }];
}

function formatTextContent(text: string): React.ReactNode {
  // Convert markdown-like formatting to JSX
  const lines = text.split('\n');

  return lines.map((line, i) => {
    // Headers
    if (line.startsWith('### ')) {
      return <h4 key={i}>{line.slice(4)}</h4>;
    }
    if (line.startsWith('## ')) {
      return <h3 key={i}>{line.slice(3)}</h3>;
    }
    if (line.startsWith('# ')) {
      return <h2 key={i}>{line.slice(2)}</h2>;
    }

    // Bold
    const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // List items
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <li key={i} dangerouslySetInnerHTML={{ __html: boldFormatted.slice(2) }} />
      );
    }

    // Numbered items
    if (/^\d+\.\s/.test(line)) {
      return (
        <li key={i} dangerouslySetInnerHTML={{ __html: boldFormatted.replace(/^\d+\.\s/, '') }} />
      );
    }

    // Regular paragraph
    if (line.trim()) {
      return (
        <p key={i} dangerouslySetInnerHTML={{ __html: boldFormatted }} />
      );
    }

    return <br key={i} />;
  });
}
