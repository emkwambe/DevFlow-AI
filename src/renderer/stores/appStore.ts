// src/renderer/stores/appStore.ts
// Purpose: Global state management with Zustand
// Updated: Sends chat history to AI API

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  rootPath: string;
  createdAt: string;
  keyFacts: KeyFact[];
  decisions: Decision[];
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  hasScript?: boolean;
  scriptContent?: string;
}

export interface TerminalOutput {
  id: string;
  content: string;
  timestamp: string;
  type: 'output' | 'error' | 'success';
}

type ViewType = 'chat' | 'context' | 'terminal' | 'settings';

interface AppState {
  // View state
  currentView: ViewType;
  setView: (view: ViewType) => void;
  
  // Projects
  projects: Project[];
  currentProject: Project | null;
  loadProjects: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'keyFacts' | 'decisions'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Chat
  messages: ChatMessage[];
  isAiLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  
  // Terminal
  terminalOutput: TerminalOutput[];
  addTerminalOutput: (content: string, type?: 'output' | 'error' | 'success') => void;
  clearTerminal: () => void;
  
  // API Key
  hasApiKey: boolean;
  checkApiKey: () => Promise<void>;
  setApiKey: (key: string) => Promise<boolean>;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function buildContext(project: Project): string {
  let context = `PROJECT: ${project.name}\n`;
  context += `TECH STACK: ${project.techStack.join(', ')}\n`;
  context += `PATH: ${project.rootPath}\n`;
  context += `DESCRIPTION: ${project.description}\n`;
  
  if (project.keyFacts.length > 0) {
    context += '\nKEY FACTS:\n';
    project.keyFacts.forEach(f => {
      context += `- ${f.fact}\n`;
    });
  }
  
  if (project.decisions.length > 0) {
    context += '\nDECISIONS MADE:\n';
    project.decisions.forEach(d => {
      context += `- ${d.decision}: ${d.reasoning}\n`;
    });
  }
  
  return context;
}

// Convert ChatMessage[] to API format
function formatChatHistory(messages: ChatMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map(m => ({
    role: m.role,
    content: m.content
  }));
}

// =============================================================================
// STORE
// =============================================================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // View state
      currentView: 'chat',
      setView: (view) => set({ currentView: view }),
      
      // Projects
      projects: [],
      currentProject: null,
      
      loadProjects: async () => {
        try {
          const projects = await window.electronAPI.projects.list();
          set({ projects: projects as Project[] });
          
          // Restore last selected project if available
          const state = get();
          if (state.currentProject) {
            const found = (projects as Project[]).find(p => p.id === state.currentProject?.id);
            if (found) {
              set({ currentProject: found });
            }
          }
        } catch (err) {
          console.error('Failed to load projects:', err);
        }
      },
      
      setCurrentProject: (project) => {
        set({ 
          currentProject: project,
          messages: [] // Clear messages when switching projects
        });
      },
      
      createProject: async (projectData) => {
        const project: Project = {
          ...projectData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          keyFacts: [],
          decisions: []
        };
        
        await window.electronAPI.projects.create(project);
        await get().loadProjects();
        set({ currentProject: project });
      },
      
      updateProject: async (project) => {
        await window.electronAPI.projects.update(project);
        await get().loadProjects();
        
        // Update current project if it's the one being updated
        if (get().currentProject?.id === project.id) {
          set({ currentProject: project });
        }
      },
      
      deleteProject: async (id) => {
        await window.electronAPI.projects.delete(id);
        await get().loadProjects();
        
        // Clear current project if it was deleted
        if (get().currentProject?.id === id) {
          set({ currentProject: null, messages: [] });
        }
      },
      
      // Chat
      messages: [],
      isAiLoading: false,
      
      sendMessage: async (content) => {
        const { currentProject, messages } = get();
        
        if (!currentProject) {
          console.error('No project selected');
          return;
        }
        
        // Add user message
        const userMessage: ChatMessage = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: new Date().toISOString()
        };
        
        set({ 
          messages: [...messages, userMessage],
          isAiLoading: true 
        });
        
        try {
          const context = buildContext(currentProject);
          
          // Get current messages (including the new user message)
          const currentMessages = get().messages;
          
          // Format chat history for API (exclude the message we just added - it will be the "current" message)
          const historyForApi = formatChatHistory(currentMessages.slice(0, -1));
          
          // Call AI with chat history
          const result = await window.electronAPI.ai.chat(content, context, historyForApi);
          
          if (result.success && result.response) {
            // Check if response contains a PowerShell script
            const hasScript = result.response.includes('```powershell');
            let scriptContent: string | undefined;
            
            if (hasScript) {
              const match = result.response.match(/```powershell\n([\s\S]*?)```/);
              scriptContent = match?.[1];
            }
            
            const assistantMessage: ChatMessage = {
              id: generateId(),
              role: 'assistant',
              content: result.response,
              timestamp: new Date().toISOString(),
              hasScript,
              scriptContent
            };
            
            set({ 
              messages: [...get().messages, assistantMessage],
              isAiLoading: false 
            });
          } else {
            // Add error message
            const errorMessage: ChatMessage = {
              id: generateId(),
              role: 'assistant',
              content: `Error: ${result.error || 'Unknown error occurred'}`,
              timestamp: new Date().toISOString()
            };
            
            set({ 
              messages: [...get().messages, errorMessage],
              isAiLoading: false 
            });
          }
        } catch (err) {
          const errorMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: `Error: ${(err as Error).message}`,
            timestamp: new Date().toISOString()
          };
          
          set({ 
            messages: [...get().messages, errorMessage],
            isAiLoading: false 
          });
        }
      },
      
      clearMessages: () => set({ messages: [] }),
      
      // Terminal
      terminalOutput: [],
      
      addTerminalOutput: (content, type = 'output') => {
        const output: TerminalOutput = {
          id: generateId(),
          content,
          timestamp: new Date().toISOString(),
          type
        };
        
        set({ terminalOutput: [...get().terminalOutput, output] });
      },
      
      clearTerminal: () => set({ terminalOutput: [] }),
      
      // API Key
      hasApiKey: false,
      
      checkApiKey: async () => {
        try {
          const hasKey = await window.electronAPI.ai.hasApiKey();
          set({ hasApiKey: hasKey });
        } catch (err) {
          set({ hasApiKey: false });
        }
      },
      
      setApiKey: async (key) => {
        try {
          const success = await window.electronAPI.ai.setApiKey(key);
          if (success) {
            set({ hasApiKey: true });
          }
          return success;
        } catch (err) {
          return false;
        }
      }
    }),
    {
      name: 'devflow-storage',
      partialize: (state) => ({
        currentProject: state.currentProject,
        messages: state.messages, // Persist chat history!
        projects: state.projects
      })
    }
  )
);
