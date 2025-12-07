// src/shared/types.ts
// Purpose: Shared TypeScript type definitions
// Used by both main and renderer processes

// =============================================================================
// PROJECT TYPES
// =============================================================================

export interface Project {
  id: string;
  name: string;
  description: string;
  rootPath: string;
  techStack: string[];  // Simple array of technology names
  keyFacts: KeyFact[];
  decisions: Decision[];
  createdAt: string;
  updatedAt?: string;
}

export interface KeyFact {
  id: string;
  fact: string;
  source: string;
  timestamp: string;
}

export interface Decision {
  id: string;
  decision: string;
  reasoning: string;
  timestamp: string;
}

// =============================================================================
// CHAT TYPES
// =============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  hasScript?: boolean;
  scriptContent?: string;
}

// =============================================================================
// UI TYPES
// =============================================================================

export type ViewType = 'chat' | 'context' | 'terminal' | 'settings';

// =============================================================================
// TERMINAL TYPES
// =============================================================================

export interface TerminalOutput {
  id: string;
  content: string;
  timestamp: string;
  type: 'output' | 'error' | 'success';
}

// =============================================================================
// ELECTRON API TYPES
// =============================================================================

export interface PowerShellResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  filesCreated?: string[];
  foldersCreated?: string[];
}

export interface ElectronAPI {
  // PowerShell
  ps: {
    execute: (command: string) => Promise<PowerShellResult>;
    executeScript: (scriptPath: string) => Promise<PowerShellResult>;
  };

  // AI
  ai: {
    chat: (message: string, context: string, chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>) => Promise<{
      success: boolean;
      response?: string;
      error?: string;
    }>;
    setApiKey: (key: string) => Promise<boolean>;
    hasApiKey: () => Promise<boolean>;
  };

  // File System
  fs: {
    createFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
    createFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
    readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    readDir: (dirPath: string) => Promise<string[]>;
    exists: (path: string) => Promise<boolean>;
    selectFolder: () => Promise<string | null>;
  };

  // Dialog
  dialog: {
    selectFolder: () => Promise<string | null>;
    openExternal: (url: string) => Promise<void>;
  };

  // Projects
  projects: {
    list: () => Promise<Project[]>;
    create: (project: Project) => Promise<Project>;
    update: (project: Project) => Promise<Project>;
    delete: (id: string) => Promise<boolean>;
  };

  // Window
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
