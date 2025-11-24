#!/bin/bash

# MrX App Builder Dashboard - Automated Setup Script
# This script sets up the complete project structure

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup function
main() {
    print_header "🚀 MrX App Builder Dashboard - Setup"
    
    echo "This script will set up your development environment."
    echo "Press CTRL+C to cancel at any time."
    echo ""
    
    # Check prerequisites
    print_header "📋 Checking Prerequisites"
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 18+
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 18 ]; then
            print_warning "Node.js 18+ is recommended. You have version $NODE_VERSION"
        fi
    else
        print_error "Node.js is not installed!"
        echo "Please install Node.js 18+ from: https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: v$NPM_VERSION"
    else
        print_error "npm is not installed!"
        exit 1
    fi
    
    # Check Git
    if command_exists git; then
        GIT_VERSION=$(git --version)
        print_success "Git is installed: $GIT_VERSION"
    else
        print_warning "Git is not installed (optional for development)"
    fi
    
    # Create project structure
    print_header "📁 Creating Project Structure"
    
    PROJECT_NAME="mrx-app-builder-dashboard"
    
    # Check if directory exists
    if [ -d "$PROJECT_NAME" ]; then
        print_warning "Directory '$PROJECT_NAME' already exists!"
        read -p "Do you want to continue and overwrite files? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Setup cancelled."
            exit 0
        fi
    else
        mkdir -p "$PROJECT_NAME"
        print_success "Created directory: $PROJECT_NAME"
    fi
    
    cd "$PROJECT_NAME"
    
    # Create directory structure
    print_info "Creating directory structure..."
    
    mkdir -p public
    mkdir -p src/{components,contexts,hooks,services,utils,styles,assets}
    mkdir -p src/components/{layout,chat,project,code,build,common,filters}
    
    print_success "Directory structure created"
    
    # Create package.json
    print_header "📦 Creating package.json"
    
    cat > package.json << 'EOF'
{
  "name": "mrx-app-builder-dashboard",
  "version": "1.0.0",
  "type": "module",
  "description": "MrX App Builder Platform - AI-Assisted Android Development Dashboard",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.300.0",
    "date-fns": "^3.0.6"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.8"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
    
    print_success "package.json created"
    
    # Create environment file
    print_header "🔐 Creating Environment Configuration"
    
    cat > .env.example << 'EOF'
# MrX App Builder Dashboard - Environment Variables
# Copy this file to .env.local and fill in your values

# API Configuration
VITE_API_BASE_URL=https://api.mrx-builder.pages.dev/api

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=false
VITE_ENABLE_DEV_TOOLS=true

# Build Configuration
VITE_APP_NAME=MrX App Builder
VITE_APP_VERSION=1.0.0

# Development Only
VITE_MOCK_API=true
VITE_LOG_LEVEL=debug
EOF
    
    # Copy to .env.local
    cp .env.example .env.local
    print_success "Environment files created (.env.example, .env.local)"
    
    # Create .gitignore
    print_info "Creating .gitignore..."
    
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
/.pnp
.pnp.js

# Production
/build
/dist
*.local

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store

# Cloudflare
.wrangler/
.dev.vars

# Other
*.tsbuildinfo
.eslintcache
.cache/
EOF
    
    print_success ".gitignore created"
    
    # Install dependencies
    print_header "📥 Installing Dependencies"
    
    print_info "This may take a few minutes..."
    
    if command_exists pnpm; then
        print_info "Using pnpm..."
        pnpm install
    elif command_exists yarn; then
        print_info "Using yarn..."
        yarn install
    else
        print_info "Using npm..."
        npm install
    fi
    
    print_success "Dependencies installed successfully!"
    
    # Initialize Git (optional)
    if command_exists git; then
        print_header "🔧 Git Initialization"
        
        if [ ! -d .git ]; then
            read -p "Initialize Git repository? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git init
                git add .
                git commit -m "Initial commit: MrX App Builder Dashboard"
                print_success "Git repository initialized"
                
                print_info "To connect to GitHub:"
                echo "  1. Create a new repository on GitHub"
                echo "  2. Run: git remote add origin YOUR_REPO_URL"
                echo "  3. Run: git push -u origin main"
            fi
        else
            print_info "Git repository already initialized"
        fi
    fi
    
    # Final instructions
    print_header "🎉 Setup Complete!"
    
    echo ""
    echo "Your MrX App Builder Dashboard is ready!"
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo "  1. Review and update .env.local with your configuration"
    echo "  2. Copy the main App.jsx code from the artifacts"
    echo "  3. Start development server: ${BLUE}npm run dev${NC}"
    echo "  4. Open browser: ${BLUE}http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}For deployment:${NC}"
    echo "  - See DEPLOYMENT.md for detailed instructions"
    echo "  - Deploy to Cloudflare Pages with one click"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo "  - README.md - Full documentation"
    echo "  - DEPLOYMENT.md - Deployment guide"
    echo ""
    echo "Happy coding! 🚀"
    echo ""
}

# Run main function
main