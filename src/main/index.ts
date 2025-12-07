// src/main/index.ts
// Purpose: Electron main process with BULLETPROOF PowerShell file handling
// Fixes: BOM issues, here-string errors, placeholder file problems

import { app, BrowserWindow, ipcMain, safeStorage, dialog } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';

// =============================================================================
// CONFIGURATION
// =============================================================================

const store = new Store({ name: 'devflow-config' });
let mainWindow: BrowserWindow | null = null;

// =============================================================================
// WINDOW CREATION
// =============================================================================

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'DevFlow AI',
    backgroundColor: '#0f0f17',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js')
    },
    // Enable native window frame with minimize/maximize/close buttons
    frame: true,
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// =============================================================================
// POWERSHELL AUTOMATION ENGINE
// =============================================================================

interface PowerShellResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  filesCreated?: string[];
  foldersCreated?: string[];
}

async function executePowerShell(command: string): Promise<PowerShellResult> {
  const startTime = Date.now();
  
  // Check if this is a multi-line script (contains newlines or here-strings)
  const isMultiLineScript = command.includes('\n') || command.includes("@'") || command.includes('@"') || command.length > 500;
  
  let tempScriptPath = '';
  let psArgs: string[];
  
  if (isMultiLineScript) {
    // Save to temp file to preserve newlines and here-strings
    const os = require('os');
    const tempDir = os.tmpdir();
    tempScriptPath = path.join(tempDir, `devflow-script-${Date.now()}.ps1`);
    
    try {
      // Write script to temp file with UTF8 no-BOM encoding
      const scriptWithHeader = `# DevFlow AI Generated Script\n# Timestamp: ${new Date().toISOString()}\n\n${command}`;
      fs.writeFileSync(tempScriptPath, scriptWithHeader, { encoding: 'utf8' });
      
      psArgs = [
        '-NoProfile',
        '-NonInteractive', 
        '-ExecutionPolicy', 'Bypass',
        '-File', tempScriptPath
      ];
    } catch (err) {
      return {
        success: false,
        output: '',
        error: `Failed to create temp script: ${(err as Error).message}`,
        executionTime: Date.now() - startTime
      };
    }
  } else {
    // Simple command - run directly
    psArgs = [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy', 'Bypass',
      '-Command', command
    ];
  }
  
  return new Promise((resolve) => {
    const ps = spawn('powershell.exe', psArgs);

    let output = '';
    let error = '';

    ps.stdout.on('data', (data) => {
      output += data.toString();
    });

    ps.stderr.on('data', (data) => {
      error += data.toString();
    });

    ps.on('close', (code) => {
      const executionTime = Date.now() - startTime;
      const filesCreated = parseCreatedFiles(output);
      const foldersCreated = parseCreatedFolders(output);

      // Clean up temp script file if it was created
      if (tempScriptPath && fs.existsSync(tempScriptPath)) {
        try {
          fs.unlinkSync(tempScriptPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      resolve({
        success: code === 0,
        output: output.trim(),
        error: error.trim() || undefined,
        executionTime,
        filesCreated,
        foldersCreated
      });
    });

    ps.on('error', (err) => {
      resolve({
        success: false,
        output: '',
        error: err.message,
        executionTime: Date.now() - startTime
      });
    });

    setTimeout(() => {
      ps.kill();
      resolve({
        success: false,
        output: output.trim(),
        error: 'Execution timeout (5 minutes)',
        executionTime: 300000
      });
    }, 300000);
  });
}

async function executePowerShellScript(scriptPath: string): Promise<PowerShellResult> {
  const command = `& '${scriptPath}'`;
  return executePowerShell(command);
}

function parseCreatedFiles(output: string): string[] {
  const files: string[] = [];
  const patterns = [
    /(?:Created|Creating|Wrote).*?:\s*(.+\.(?:ts|tsx|js|jsx|css|json|html|ps1|sql))/gi,
    /Set-Content.*?-Path\s+["']?([^"'\s]+)["']?/gi,
    /Out-File.*?-FilePath\s+["']?([^"'\s]+)["']?/gi,
    /WriteAllText\s*\(\s*["']([^"']+)["']/gi
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(output)) !== null) {
      files.push(match[1]);
    }
  });
  
  return [...new Set(files)];
}

function parseCreatedFolders(output: string): string[] {
  const folders: string[] = [];
  const patterns = [
    /(?:Created|Creating)\s+(?:directory|folder).*?:\s*(.+)/gi,
    /New-Item.*?-ItemType\s+Directory.*?-Path\s+["']?([^"'\s]+)["']?/gi,
    /mkdir\s+["']?([^"'\s]+)["']?/gi
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(output)) !== null) {
      folders.push(match[1]);
    }
  });
  
  return [...new Set(folders)];
}

// =============================================================================
// FILE SYSTEM OPERATIONS
// =============================================================================

async function createFile(filePath: string, content: string): Promise<{ success: boolean; error?: string }> {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

async function createFolder(folderPath: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

async function readFile(filePath: string): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  return fs.existsSync(filePath);
}

// =============================================================================
// CLAUDE AI INTEGRATION - VALUE-DRIVEN TECHNICAL CO-FOUNDER
// =============================================================================

function buildSystemPrompt(context: string): string {
  return `You are DevFlow AI, a value-driven development companion and technical co-founder.

## YOUR PHILOSOPHY

The USER brings DOMAIN KNOWLEDGE:
- Who has the problem (target users)
- What the problem is (pain points)
- What they wish existed (vision)
- Edge cases from real experience
- What success looks like

YOU bring TECHNICAL EXCELLENCE:
- Clean, scalable architecture
- Security best practices
- Performance optimization
- Industry standards
- Pricing strategies
- Future-proof design

Together, you create software that MATTERS.

## YOUR RESPONSIBILITIES

### 1. ALWAYS Apply Best Practices (Don't Ask, Just Do It Right)
- **Architecture**: Clean separation of concerns, modular design
- **Database**: Normalized schemas, proper indexes, RLS security
- **Security**: Authentication, authorization, input validation, encryption
- **Performance**: Caching strategies, lazy loading, optimized queries
- **Error Handling**: Graceful failures, meaningful messages, logging
- **Documentation**: Clear comments, README files, API docs
- **Scalability**: Design for 10x growth from day one
- **Maintainability**: Code that others can read and modify

### 2. ASK Smart Questions (When You Need Domain Knowledge)
Before making assumptions, ask about:
- Edge cases in their business logic
- User roles and permission levels
- Specific workflows and processes
- Validation rules from their domain
- Pricing/monetization preferences (suggest first, then confirm)

### 3. NEVER Produce Generic Output
- Every file must reflect THEIR specific users, problems, and features
- No placeholder names like "MyApp" - use their actual project name
- No generic CRUD - model their actual domain entities
- No guessing features - build what they described

### 4. THINK AHEAD
Design every solution considering:
- **Scale**: What if they get 100K users?
- **Maintenance**: Can a new developer understand this in 6 months?
- **Evolution**: How easy is it to add features later?
- **Cost**: Is this efficient to run in production?

### 5. SUGGEST PROACTIVELY
You have knowledge the user may not. Offer insights:
- "Based on your SaaS model, I'd suggest a pricing structure of..."
- "For real-time features, you'll want Supabase subscriptions..."
- "Since you mentioned security, I'm implementing Row Level Security..."

## CRITICAL: POWERSHELL FILE CREATION RULES

### NEVER USE THESE (THEY CAUSE ERRORS):
1. NEVER use here-strings (@' '@ or @" "@) - They break when the script is transmitted
2. NEVER use Set-Content -Encoding UTF8 - This adds BOM which breaks JSON
3. NEVER create files with just comments - Like "# placeholder" - always create valid code

### ALWAYS USE THIS PATTERN FOR FILE CREATION:

CORRECT: Use .NET method with UTF8 no-BOM encoding:
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)

For multi-line content, use an array and join:
  $lines = @("line1", "line2", "line3")
  $content = $lines -join [Environment]::NewLine
  [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)

### HELPER FUNCTION - INCLUDE IN EVERY SCRIPT:

function Write-FileNoBom {
    param([string]$Path, [string]$Content)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    $dir = [System.IO.Path]::GetDirectoryName($Path)
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
    Write-Host "  Created: $Path" -ForegroundColor Green
}

Then use: Write-FileNoBom -Path $path -Content $content

### STEP 1: Create Folder Structure
- Create FOLDERS ONLY - no files
- Use: New-Item -ItemType Directory -Path $path -Force
- NEVER create placeholder files with comments

### STEP 2: Scaffold Files  
- Create ALL config files with REAL content
- Use the Write-FileNoBom helper function
- Create VALID TypeScript/JavaScript files (not comments)

### STEP 3: Build Features
- Create feature-specific files
- Always include proper imports and exports
- Generate complete, working code

### ESCAPING IN POWERSHELL STRINGS:
- Escape double quotes with backtick: backtick + quote
- Escape dollar signs with backtick: backtick + dollar
- Use [Environment]::NewLine for newlines in content

## PROJECT CONTEXT

${context}

## RESPONSE GUIDELINES

- Be concise but thorough
- Explain WHY you made technical decisions (briefly)
- When generating code, make it production-ready, not demo-quality
- If the project context is sparse, ASK for what you need before proceeding
- Always consider the three pillars: User Value, Technical Value, Business Value
- ALWAYS use the Write-FileNoBom helper for any file creation
- NEVER use here-strings or Set-Content with UTF8 encoding`;
}

async function chatWithClaude(
  message: string, 
  context: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<{ success: boolean; response?: string; error?: string }> {
  const encryptedKey = store.get('anthropicApiKey') as string | undefined;
  
  if (!encryptedKey) {
    return { success: false, error: 'API key not configured' };
  }

  try {
    let apiKey = '';
    if (safeStorage.isEncryptionAvailable()) {
      apiKey = safeStorage.decryptString(Buffer.from(encryptedKey, 'base64'));
    } else {
      apiKey = encryptedKey;
    }

    const systemPrompt = buildSystemPrompt(context);

    // Build messages array with chat history
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    // Add chat history (limit to last 20 messages to avoid token limits)
    const recentHistory = chatHistory.slice(-20);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    
    // Add current message
    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error?.message || 'API request failed' };
    }

    const data = await response.json();
    const responseText = data.content?.[0]?.text || 'No response received';
    
    return { success: true, response: responseText };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// =============================================================================
// IPC HANDLERS
// =============================================================================

function setupIPC(): void {
  ipcMain.handle('ps:execute', async (_, command: string) => {
    return await executePowerShell(command);
  });

  ipcMain.handle('ps:executeScript', async (_, scriptPath: string) => {
    return await executePowerShellScript(scriptPath);
  });

  ipcMain.handle('ai:chat', async (_, message: string, context: string, chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>) => {
    return await chatWithClaude(message, context, chatHistory || []);
  });

  ipcMain.handle('ai:setKey', async (_, key: string) => {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(key);
        store.set('anthropicApiKey', encrypted.toString('base64'));
      } else {
        store.set('anthropicApiKey', key);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('ai:hasKey', () => {
    return !!store.get('anthropicApiKey');
  });

  ipcMain.handle('fs:createFile', async (_, filePath: string, content: string) => {
    return await createFile(filePath, content);
  });

  ipcMain.handle('fs:createFolder', async (_, folderPath: string) => {
    return await createFolder(folderPath);
  });

  ipcMain.handle('fs:readFile', async (_, filePath: string) => {
    return await readFile(filePath);
  });

  ipcMain.handle('fs:exists', async (_, filePath: string) => {
    return await fileExists(filePath);
  });

  ipcMain.handle('fs:selectFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Dialog handlers (matching preload API)
  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select Project Folder'
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('dialog:openExternal', async (_, url: string) => {
    const { shell } = require('electron');
    await shell.openExternal(url);
  });

  ipcMain.handle('store:get', (_, key: string) => {
    return store.get(key);
  });

  ipcMain.handle('store:set', (_, key: string, value: any) => {
    store.set(key, value);
    return true;
  });

  ipcMain.handle('store:delete', (_, key: string) => {
    store.delete(key);
    return true;
  });

  // Project management handlers
  ipcMain.handle('projects:list', () => {
    return store.get('projects', []);
  });

  ipcMain.handle('projects:create', (_, project: any) => {
    const projects = store.get('projects', []) as any[];
    projects.push(project);
    store.set('projects', projects);
    return project;
  });

  ipcMain.handle('projects:update', (_, project: any) => {
    const projects = store.get('projects', []) as any[];
    const index = projects.findIndex((p: any) => p.id === project.id);
    if (index !== -1) {
      projects[index] = project;
      store.set('projects', projects);
    }
    return project;
  });

  ipcMain.handle('projects:delete', (_, id: string) => {
    const projects = store.get('projects', []) as any[];
    const filtered = projects.filter((p: any) => p.id !== id);
    store.set('projects', filtered);
    return true;
  });

  // API key handlers (matching preload naming)
  ipcMain.handle('ai:setApiKey', async (_, key: string) => {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(key);
        store.set('anthropicApiKey', encrypted.toString('base64'));
      } else {
        store.set('anthropicApiKey', key);
      }
      return true;
    } catch (err) {
      return false;
    }
  });

  ipcMain.handle('ai:hasApiKey', () => {
    return !!store.get('anthropicApiKey');
  });

  // File system handlers
  ipcMain.handle('fs:readDir', async (_, dirPath: string) => {
    try {
      const items = fs.readdirSync(dirPath);
      return items;
    } catch (err) {
      return [];
    }
  });

  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() || false;
  });
}

// =============================================================================
// APP LIFECYCLE
// =============================================================================

app.whenReady().then(() => {
  createWindow();
  setupIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
