# DevFlow AI

**AI-powered development assistant with persistent memory - Never lose context, never repeat yourself.**

DevFlow AI is a desktop application that pairs you with Claude AI to build software projects. You bring the vision and user problems; Claude brings technical expertise and production-ready code.

## Features

### AI Chat with Context Awareness
- Full conversation with Claude AI about your project
- Persistent chat history across sessions
- Project context automatically included in every conversation
- Key facts and decisions are remembered and referenced

### Agentic Workflow
- AI generates PowerShell scripts for project tasks
- One-click script execution with "Run" button
- **Automatic feedback loop**: Execution output is sent back to AI for evaluation
- AI analyzes success/failure and suggests next steps or fixes
- Human-in-the-loop design - you approve before execution

### Quick Action Buttons
Pre-configured workflows to accelerate development:

| Button | Purpose |
|--------|---------|
| **Discussion** | Sprint planning - AI reviews state, creates feature backlog, recommends priorities |
| **Step 1: Folders** | Creates organized folder structure for your project |
| **Step 2: Scaffold** | Generates config files, dependencies, and starter code |
| **First Feature** | AI suggests 2-3 valuable first features to build |
| **Next Feature** | AI autonomously selects and plans the next logical feature |
| **Review** | Code review - quality, architecture, security, performance analysis |
| **Add Auth** | Supabase authentication setup |
| **Database** | Design and create database schema |

### Project Context Management
- **Key Facts**: Store important decisions, constraints, and requirements
- **Decisions Log**: Track architectural and design decisions with reasoning
- Context persists across sessions and is included in AI conversations

### Integrated Terminal
- PowerShell execution environment
- Real-time output display
- Script history and results

## Philosophy

```
+------------------+     +------------------+     +------------------+
|      YOU         |  +  |      CLAUDE      |  =  |     TOGETHER     |
+------------------+     +------------------+     +------------------+
| Who has problem  |     | Best architecture|     | Real user value  |
| What problem is  |     | Security & perf  |     | Scalable solution|
| What you wish    |     | Production code  |     | Ship faster      |
+------------------+     +------------------+     +------------------+
```

You focus on **user value** - who needs it, what problem it solves, what you wish existed.
Claude handles **technical implementation** - architecture, security, performance, code quality.

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Anthropic API key (get one at https://console.anthropic.com)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/DevFlow-AI.git
cd DevFlow-AI

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the application
npm run build

# Package for your platform
npm run package:win    # Windows
npm run package:mac    # macOS
npm run package:linux  # Linux
```

## Configuration

1. Launch DevFlow AI
2. Click **Settings** in the sidebar
3. Enter your Anthropic API key
4. Click **Save**

Your API key is stored securely using electron-store.

## Usage

### Creating a New Project

1. Click **Start New Project** on the welcome screen
2. **Vision Step**: Answer three questions:
   - WHO has this problem?
   - WHAT problem do they face?
   - WHAT do you wish existed?
3. **Path Step**: Select where project files will be created
4. Click **Create Project**

### Building Your Project

1. Use **Step 1: Folders** to create directory structure
2. Use **Step 2: Scaffold** to generate config files and starter code
3. Use **First Feature** to build initial functionality
4. Use **Next Feature** to continue building (AI selects priorities)
5. Use **Review** periodically to check code quality

### The Agentic Workflow

When Claude provides a PowerShell script:

1. Review the script in the chat
2. Click **Run** to execute
3. Output appears in the terminal AND is sent back to Claude
4. Claude evaluates the result and suggests next steps
5. If errors occur, Claude provides fixes
6. Repeat until task is complete

This creates a tight feedback loop where you stay in control while AI handles iteration.

## Project Structure

```
DevFlow-AI/
├── src/
│   ├── main/           # Electron main process
│   │   └── index.ts    # App lifecycle, IPC handlers
│   ├── preload/        # Electron preload scripts
│   │   └── index.ts    # Secure IPC bridge
│   ├── renderer/       # React frontend
│   │   ├── components/ # UI components
│   │   │   ├── ChatPanel.tsx      # AI chat interface
│   │   │   ├── WelcomeScreen.tsx  # Onboarding + Quick Actions
│   │   │   ├── ContextPanel.tsx   # Key facts & decisions
│   │   │   ├── TerminalPanel.tsx  # PowerShell output
│   │   │   └── SettingsPanel.tsx  # API key configuration
│   │   ├── stores/
│   │   │   └── appStore.ts        # Zustand state management
│   │   └── styles/
│   │       └── app.css            # Application styles
│   └── shared/         # Shared types and utilities
├── package.json
└── electron-vite.config.ts
```

## Tech Stack

- **Electron** - Cross-platform desktop framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Zustand** - State management with persistence
- **Vite** - Build tool
- **electron-store** - Secure local storage
- **Claude API** - AI assistant

## Key Concepts

### Context Persistence
Your project's key facts and decisions persist across sessions. When you switch projects, context switches too. This means Claude always knows:
- What your project does
- What tech stack you're using
- What decisions you've made and why

### Human-in-the-Loop
DevFlow AI is designed with you in control:
- AI suggests, you approve
- Scripts require explicit "Run" click
- You can modify AI suggestions before execution
- All actions are visible and reversible

### Value-Driven Development
The onboarding flow focuses on user value, not technical details:
- WHO has the problem (target users)
- WHAT is the problem (pain points)
- WHAT do you wish existed (desired solution)

Claude uses this to make appropriate technical decisions.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run package` | Package for current platform |
| `npm run package:win` | Package for Windows (NSIS + Portable) |
| `npm run package:mac` | Package for macOS (DMG) |
| `npm run package:linux` | Package for Linux (AppImage) |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [Claude](https://anthropic.com) by Anthropic
- Inspired by the need for AI assistants that remember context
- Designed for developers who want to ship faster without sacrificing quality
