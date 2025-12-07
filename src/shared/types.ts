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
  rootPath: string;  // Where project files are created
  techStack: TechStack;
  keyFacts: KeyFact[];
  decisions: Decision[];
  sessionNotes: SessionNote[];
  chatHistory: ChatMessage[];  // NEW: Persistent chat history
  files: ProjectFile[];
  createdAt: string;
  updatedAt: string;
}

export interface TechStack {
  frontend: string[];
  backend: string[];
  database: string[];
  hosting: string[];
  other: string[];
}

export interface KeyFact {
  id: string;
  content: string;
  category: 'architecture' | 'database' | 'api' | 'auth' | 'backend' | 'frontend' | 'other';
  createdAt: string;
}

export interface Decision {
  id: string;
  title: string;
  choice: string;
  reasoning: string;
  alternatives: string[];
  createdAt: string;
}

export interface SessionNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface ProjectFile {
  path: string;
  purpose: string;
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
    execute: (command: string, workingDir?: string) => Promise<PowerShellResult>;
    executeScript: (scriptPath: string) => Promise<PowerShellResult>;
  };
  
  // AI
  ai: {
    chat: (message: string, context: string) => Promise<{
      success: boolean;
      response?: string;
      error?: string;
    }>;
    setKey: (key: string) => Promise<{ success: boolean; error?: string }>;
    hasKey: () => Promise<boolean>;
  };
  
  // File System
  fs: {
    createFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
    createFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
    readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    exists: (path: string) => Promise<boolean>;
    selectFolder: () => Promise<string | null>;
  };
  
  // Store
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
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
