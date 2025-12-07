# =============================================================================
# DevFlow AI v2.0 - Setup Script
# =============================================================================
# Purpose: Automated project setup following the Eddy Protocol
# - Atomic Replacement: Complete file content, no snippets
# - Here-String Injection: Exact code generation
# - Path Documentation: Every file has its location
# - Windows Native: PowerShell commands only
# =============================================================================

param(
    [string]$ProjectPath = "$env:USERPROFILE\Documents\devflow-ai-v2"
)

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  DevFlow AI v2.0 - Setup Script" -ForegroundColor Cyan
Write-Host "  Never lose context. Never repeat yourself." -ForegroundColor Gray
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# =============================================================================
# STEP 1: Create Project Directory
# =============================================================================

Write-Host "[1/6] Creating project directory..." -ForegroundColor Yellow

if (Test-Path $ProjectPath) {
    Write-Host "  Removing existing directory..." -ForegroundColor Gray
    Remove-Item -Recurse -Force $ProjectPath
}

New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
Set-Location $ProjectPath

Write-Host "  Created: $ProjectPath" -ForegroundColor Green

# =============================================================================
# STEP 2: Create Folder Structure
# =============================================================================

Write-Host "[2/6] Creating folder structure..." -ForegroundColor Yellow

$folders = @(
    "src\main",
    "src\preload",
    "src\renderer\components",
    "src\renderer\stores",
    "src\renderer\styles",
    "src\shared",
    "resources"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    Write-Host "  Created: $folder" -ForegroundColor Gray
}

# =============================================================================
# STEP 3: Download Files from Claude Output
# =============================================================================

Write-Host "[3/6] Creating configuration files..." -ForegroundColor Yellow

# package.json
$packageJson = @'
{
  "name": "devflow-ai",
  "version": "2.0.0",
  "description": "AI-powered development assistant with persistent memory",
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "package": "electron-builder",
    "package:win": "electron-builder --win"
  },
  "dependencies": {
    "electron-store": "^8.1.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "electron": "^28.1.0",
    "electron-builder": "^24.9.1",
    "electron-vite": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.10"
  },
  "build": {
    "appId": "com.devflow-ai.app",
    "productName": "DevFlow AI",
    "directories": { "output": "release" },
    "files": ["dist/**/*"],
    "win": { "target": ["nsis", "portable"] }
  }
}
'@
[System.IO.File]::WriteAllText("$ProjectPath\package.json", $packageJson, [System.Text.UTF8Encoding]::new($false))
Write-Host "  Created: package.json" -ForegroundColor Gray

# tsconfig.json
$tsconfig = @'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
'@
[System.IO.File]::WriteAllText("$ProjectPath\tsconfig.json", $tsconfig, [System.Text.UTF8Encoding]::new($false))
Write-Host "  Created: tsconfig.json" -ForegroundColor Gray

# electron.vite.config.ts
$viteConfig = @'
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  main: {
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') }
      }
    }
  },
  preload: {
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    build: {
      outDir: 'dist/renderer',
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/renderer/index.html') }
      }
    },
    plugins: [react()]
  }
});
'@
[System.IO.File]::WriteAllText("$ProjectPath\electron.vite.config.ts", $viteConfig, [System.Text.UTF8Encoding]::new($false))
Write-Host "  Created: electron.vite.config.ts" -ForegroundColor Gray

# =============================================================================
# STEP 4: Instructions for Source Files
# =============================================================================

Write-Host "[4/6] Source files setup..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  The source files are available for download from Claude." -ForegroundColor Cyan
Write-Host "  Download the devflow-ai-v2 folder and copy the src folder here." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Required files:" -ForegroundColor White
Write-Host "    src/shared/types.ts" -ForegroundColor Gray
Write-Host "    src/main/index.ts" -ForegroundColor Gray
Write-Host "    src/preload/index.ts" -ForegroundColor Gray
Write-Host "    src/renderer/App.tsx" -ForegroundColor Gray
Write-Host "    src/renderer/main.tsx" -ForegroundColor Gray
Write-Host "    src/renderer/index.html" -ForegroundColor Gray
Write-Host "    src/renderer/stores/appStore.ts" -ForegroundColor Gray
Write-Host "    src/renderer/components/TitleBar.tsx" -ForegroundColor Gray
Write-Host "    src/renderer/components/Sidebar.tsx" -ForegroundColor Gray
Write-Host "    src/renderer/components/AIChat.tsx" -ForegroundColor Gray
Write-Host "    src/renderer/components/ProjectContext.tsx" -ForegroundColor Gray
Write-Host "    src/renderer/components/Terminal.tsx" -ForegroundColor Gray
Write-Host "    src/renderer/components/Settings.tsx" -ForegroundColor Gray
Write-Host "    src/renderer/components/WelcomeScreen.tsx" -ForegroundColor Gray
Write-Host "    src/renderer/styles/app.css" -ForegroundColor Gray
Write-Host ""

# =============================================================================
# STEP 5: Install Dependencies
# =============================================================================

Write-Host "[5/6] Installing dependencies..." -ForegroundColor Yellow

npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "  npm install failed. Please run it manually." -ForegroundColor Red
} else {
    Write-Host "  Dependencies installed successfully!" -ForegroundColor Green
}

# =============================================================================
# STEP 6: Complete
# =============================================================================

Write-Host ""
Write-Host "[6/6] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Copy source files from Claude to:" -ForegroundColor Yellow
Write-Host "     $ProjectPath\src\" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Run the app:" -ForegroundColor Yellow
Write-Host "     cd $ProjectPath" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Configure your Anthropic API key in Settings" -ForegroundColor Yellow
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  DevFlow AI - Built with the Eddy Protocol" -ForegroundColor Gray
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
