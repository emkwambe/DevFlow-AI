// src/preload/index.ts
// Purpose: Bridge between renderer and main process
// Updated: Includes chat history in AI calls

import { contextBridge, ipcRenderer } from 'electron';

// Type for chat messages
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Expose protected APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // PowerShell execution
  ps: {
    execute: (command: string) => ipcRenderer.invoke('ps:execute', command),
    executeScript: (scriptPath: string) => ipcRenderer.invoke('ps:executeScript', scriptPath),
  },
  
  // AI chat - NOW INCLUDES CHAT HISTORY
  ai: {
    chat: (message: string, context: string, chatHistory: ChatMessage[] = []) => 
      ipcRenderer.invoke('ai:chat', message, context, chatHistory),
    setApiKey: (key: string) => ipcRenderer.invoke('ai:setApiKey', key),
    hasApiKey: () => ipcRenderer.invoke('ai:hasApiKey'),
  },
  
  // Project management
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    create: (project: unknown) => ipcRenderer.invoke('projects:create', project),
    update: (project: unknown) => ipcRenderer.invoke('projects:update', project),
    delete: (id: string) => ipcRenderer.invoke('projects:delete', id),
  },
  
  // Dialog
  dialog: {
    selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
    openExternal: (url: string) => ipcRenderer.invoke('dialog:openExternal', url),
  },
  
  // File system
  fs: {
    readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
    exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
    selectFolder: () => ipcRenderer.invoke('fs:selectFolder'),
    createFile: (path: string, content: string) => ipcRenderer.invoke('fs:createFile', path, content),
    createFolder: (path: string) => ipcRenderer.invoke('fs:createFolder', path),
    readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  }
});

// Type declarations for TypeScript
declare global {
  interface Window {
    electronAPI: {
      ps: {
        execute: (command: string) => Promise<{
          success: boolean;
          output: string;
          error?: string;
          executionTime: number;
          filesCreated?: string[];
          foldersCreated?: string[];
        }>;
        executeScript: (scriptPath: string) => Promise<{
          success: boolean;
          output: string;
          error?: string;
          executionTime: number;
        }>;
      };
      ai: {
        chat: (message: string, context: string, chatHistory?: ChatMessage[]) => Promise<{
          success: boolean;
          response?: string;
          error?: string;
        }>;
        setApiKey: (key: string) => Promise<boolean>;
        hasApiKey: () => Promise<boolean>;
      };
      projects: {
        list: () => Promise<unknown[]>;
        create: (project: unknown) => Promise<unknown>;
        update: (project: unknown) => Promise<unknown>;
        delete: (id: string) => Promise<boolean>;
      };
      dialog: {
        selectFolder: () => Promise<string | null>;
        openExternal: (url: string) => Promise<void>;
      };
      fs: {
        readDir: (dirPath: string) => Promise<string[]>;
        exists: (filePath: string) => Promise<boolean>;
        selectFolder: () => Promise<string | null>;
        createFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
        createFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
        readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      };
    };
  }
}
