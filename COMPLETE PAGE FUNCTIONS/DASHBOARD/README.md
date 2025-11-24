# 🚀 MrX App Builder Dashboard

> **Free-first, AI-assisted Android development platform**  
> Build, iterate, test, and ship Android apps with conversational AI assistance.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.0-646cff?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-f38020?logo=cloudflare)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [Architecture](#-architecture)
- [API Integration](#-api-integration)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Capabilities
- **Multi-Project Management**: Manage multiple Android projects simultaneously
- **Cursor-Style Multi-Chat**: Independent conversation threads per project
- **Real-Time Log Streaming**: Live build logs with automatic updates
- **File Explorer**: Browse project files with syntax highlighting
- **Code Viewer**: View Kotlin, Java, XML, and Gradle files
- **Diff Viewer**: Compare code changes side-by-side
- **Artifact Management**: Download and manage APK builds
- **Job Status Tracking**: Monitor build and patch jobs in real-time

### 🔐 Security
- **Zero Credential Storage**: No API keys or tokens stored in frontend
- **Session-Based Auth**: Short-lived session tokens (cleared on logout)
- **Secure API Communication**: All requests use HTTPS with auth headers
- **OpenAI Key Handling**: Per-request key submission (never persisted)

### 🎨 UI/UX
- **3-Panel Layout**: Sidebar, Chat, and Tools panel
- **Dark/Light Themes**: System preference support
- **Responsive Design**: Desktop, tablet, and mobile optimized
- **Collapsible Panels**: Maximize workspace as needed
- **Smooth Animations**: Polished transitions and micro-interactions

### ⚡ Performance
- **Code Splitting**: Optimized chunk loading
- **Lazy Loading**: Components load on demand
- **Virtual Scrolling**: Handle large message/log lists
- **Debounced Search**: Efficient file tree filtering
- **Polling Optimization**: Smart exponential backoff

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18.2 |
| **Build Tool** | Vite 5.0 |
| **Styling** | Tailwind CSS 3.4 |
| **Icons** | Lucide React |
| **Date Handling** | date-fns |
| **Hosting** | Cloudflare Pages |
| **Backend** | Cloudflare Workers + KV |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm** or **pnpm** or **yarn**
- **Git**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/mrx-dashboard.git
cd mrx-dashboard
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. **Setup environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
VITE_API_BASE_URL=https://api.mrx-builder.pages.dev/api
VITE_MOCK_API=true  # Set to false for production API
```

4. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📁 Project Structure

```
mrx-dashboard/
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── App.jsx                 # Main app component
│   ├── main.jsx                # React entry point
│   ├── index.css               # Global styles
│   └── assets/
│       └── images/
├── .env.example                # Environment variables template
├── .gitignore
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── vite.config.js              # Vite configuration
└── README.md                   # This file
```

### Key Files

- **`App.jsx`**: Main application with all components and logic
- **`vite.config.js`**: Build optimization and proxy configuration
- **`tailwind.config.js`**: Custom theme and utility classes
- **`index.html`**: Entry HTML with SEO meta tags

---

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Development Workflow

1. **Feature Development**
   - Create feature branch: `git checkout -b feature/your-feature`
   - Make changes and test locally
   - Commit with descriptive messages

2. **Testing**
   - Test all three panel layouts (desktop/tablet/mobile)
   - Verify dark/light theme switching
   - Check API integration with mock data
   - Test error handling and retry logic

3. **Code Quality**
   - Run linter before committing
   - Ensure no console errors
   - Test responsive design breakpoints

### Mock Data

For development, the app uses mock data when `VITE_MOCK_API=true`:

- **Projects**: Pre-configured Weather and Todo apps
- **Chats**: Sample conversation threads
- **Messages**: User/AI/System message examples
- **File Tree**: Mock Android project structure
- **Artifacts**: Sample APK builds

---

## 🌐 Deployment

### Cloudflare Pages

#### 1. Connect GitHub Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** → **Create a project**
3. Connect your GitHub repository
4. Select `mrx-dashboard` repository

#### 2. Configure Build Settings

```yaml
Build command: npm run build
Build output directory: dist
Root directory: /
Node version: 18
```

#### 3. Environment Variables

Add these in Cloudflare Pages settings:

```
VITE_API_BASE_URL=https://api.mrx-builder.pages.dev/api
VITE_MOCK_API=false
VITE_ENABLE_ANALYTICS=true
```

#### 4. Deploy

- **Automatic**: Push to `main` branch triggers deployment
- **Manual**: Click "Deploy" in Cloudflare Pages dashboard

#### 5. Custom Domain (Optional)

1. Go to **Pages** → Your project → **Custom domains**
2. Add your domain
3. Update DNS records as instructed

### Build Optimization

The production build includes:
- ✅ Minification (Terser)
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Asset optimization
- ✅ Console removal
- ✅ Source map generation (optional)

---

## 🏗 Architecture

### Component Hierarchy

```
App
├── Header
│   ├── ProjectSelector
│   ├── JobStatusIndicator
│   └── ThemeToggle
├── LeftSidebar
│   ├── SearchBar
│   ├── QuickFilters
│   └── ChatList
├── CenterPanel
│   ├── MessageFeed
│   │   └── ChatMessage
│   ├── ActionButtons
│   └── ChatInput
│       └── LLMModSelector
└── RightPanel
    ├── TabBar
    ├── FileExplorer
    │   └── FileTreeItem
    ├── CodeViewer
    ├── LogViewer
    └── ArtifactPanel
```

### State Management

**Contexts:**
- `AuthContext`: Session token, authentication
- `ThemeContext`: Dark/light mode
- `ProjectContext`: Current project data
- `ChatContext`: Active chat and messages

**Local State:**
- Component UI state (collapsed panels, active tabs)
- Form inputs
- Temporary data (scroll positions)

### Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
API Service Call
    ↓
Backend API (Cloudflare Workers)
    ↓
Workers KV (Metadata Storage)
    ↓
Colab Agent (Heavy Compute)
    ↓
GitHub (Source Code)
    ↓
Google Drive (APK Artifacts)
    ↓
Response to Frontend
    ↓
State Update
    ↓
UI Re-render
```

---

## 🔌 API Integration

### API Client

All API calls go through the `ApiService` class:

```javascript
const api = new ApiService(request);

// Projects
await api.getProjects();
await api.getProject(projectId);

// Chats
await api.getChats(projectId);
await api.createChat(projectId, { title, initialMessage });

// Messages
await api.getMessages(projectId, chatId, cursor);
await api.sendMessage(projectId, chatId, { content, llmMode });

// Jobs
await api.createJob({ type, payload });
await api.getJobLogs(jobId, cursor);

// Files
await api.getFileTree(projectId);
await api.getFile(projectId, path);
await api.getDiff(projectId, commitA, commitB);

// Artifacts
await api.getArtifacts(projectId);
```

### Authentication

Session token stored in `sessionStorage`:

```javascript
const { token, login, logout } = useAuth();

// Login
login('session-token-from-backend');

// All API requests include Authorization header
headers: {
  'Authorization': `Bearer ${token}`
}

// Logout
logout(); // Clears session token
```

### Error Handling

```javascript
try {
  const data = await api.getProjects();
  setProjects(data);
} catch (error) {
  console.error('Failed to load projects:', error);
  // Show error message to user
}
```

---

## 🎨 Customization

### Theming

Edit `tailwind.config.js` to customize colors:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#3b82f6',  // Change primary color
        600: '#2563eb',
      }
    }
  }
}
```

### Layout

Adjust panel widths in component classes:

```javascript
// Left Sidebar
className="w-80"  // Change width

// Right Panel
className="w-96"  // Change width
```

### Features

Toggle features via environment variables:

```env
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEV_TOOLS=false
VITE_ENABLE_DIFF_VIEWER=true
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: API calls fail with CORS error  
**Solution**: Check `vite.config.js` proxy settings and backend CORS configuration

**Issue**: Build fails on Cloudflare Pages  
**Solution**: Verify Node version is 18+ in build settings

**Issue**: Dark theme not working  
**Solution**: Check `localStorage.getItem('theme')` and `document.documentElement.className`

**Issue**: Messages not updating  
**Solution**: Verify polling is enabled and API endpoints are correct

---

## 📊 Performance Metrics

Target metrics for production:

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Bundle Size**: < 500KB (gzipped)

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use functional components with hooks
- Follow React best practices
- Use Tailwind utility classes
- Add comments for complex logic
- Keep components under 300 lines

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Vite Team** for the blazing-fast build tool
- **Tailwind CSS** for utility-first styling
- **Cloudflare** for free hosting and edge compute
- **Lucide** for beautiful icons

---

## 📧 Support

For questions or issues:
- 📫 Email: support@mrx-builder.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/mrx-dashboard/issues)
- 💬 Discord: [Join our community](https://discord.gg/mrx-builder)

---

## 🗺 Roadmap

- [ ] Real-time WebSocket integration
- [ ] Collaborative editing
- [ ] Advanced diff viewer with merge capabilities
- [ ] Code search across all files
- [ ] Built-in terminal emulator
- [ ] Plugin system for extensions
- [ ] Mobile app (React Native)
- [ ] VS Code extension

---

Made with ❤️ by the MrX Team
