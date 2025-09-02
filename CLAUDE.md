# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
iChat-develop is a comprehensive RAG-QA System (Retrieval-Augmented Generation Question-Answering) designed for Beijing International Studies University (BISU). It features multi-platform support including web frontend, WeChat mini-program, and includes campus network access restrictions.

## Architecture
- **Backend**: Flask-based API server with RAG pipeline, multiple authentication methods (RADIUS, local DB), and external API integrations
- **Frontend**: Vue.js 3 SPA with Element Plus UI components, Pinia state management, and responsive design
- **Mobile**：expo
- **Miniprogram**: WeChat mini-program with campus network access controls
- **Deployment**: Docker Compose setup with Nginx reverse proxy

## Common Development Commands

### Backend Development
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py

# Run with production config
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Development server (runs on http://localhost:8080)
npm run serve

# Build for production
npm run build

# Lint code
npm run lint
```

### Testing
```bash
# Backend tests (from project root)
cd backend
python -m pytest tests/

# Run specific test files
python test_auth.py
python test_gemini.py

# Frontend E2E tests
cd frontend
npx cypress run
```

### Docker Deployment
```bash
# Full stack deployment
docker-compose up --build

# Individual services
docker-compose up frontend
docker-compose up backend
```

## Key Architecture Components

### Backend Structure (`/backend/`)
- `app.py` - Main Flask application with CORS, Swagger UI, and global error handling
- `routes/` - API endpoints organized by functionality:
  - `chat.py` - Main chat interface with primary/fallback API calls
  - `auth.py` - RADIUS authentication
  - `hybrid_auth.py` - Combined RADIUS and local DB authentication
  - `scenes.py` - Knowledge domain management
  - `feedback.py`, `greeting.py`, `suggestions.py` - Support endpoints
- `services/` - Business logic layer (chat_service.py, rag_service.py)
- `models/` - Database models and connections
- `utils/` - Helper functions and utilities

### Frontend Structure (`/frontend/`)
- Vue 3 with Composition API
- Element Plus for UI components
- Pinia for state management (replacing Vuex in newer parts)
- Key components:
  - `ChatBox.vue` - Main chat interface
  - `AgentSelector.vue` - Scene/domain selection
  - `HistoryPanel.vue` - Conversation history
  - `ResponseRenderer.vue` - AI response display with markdown support

### API Integration
- Primary API: `http://10.10.15.210:5000` (production)
- Fallback API: DeepSeek Chat API for when primary fails
- Proxy configuration in `vue.config.cjs` routes `/api/*` to backend

### Authentication System
- Dual authentication: RADIUS (campus network) + local database
- JWT tokens for session management
- Admin user creation via `create_test_admin.py`
- Network access validation for campus-only usage

### Campus Network Restrictions
- Multi-layer validation: API connectivity, IP range checking, GPS location
- Configurable via admin interface in WeChat mini-program
- Development mode bypasses for testing

### Scene-Based Knowledge Domains
Available scenes configured in backend:
- `db_sizheng` - Political Education Resources
- `db_xuexizhidao` - Learning Guidance  
- `db_zhihuisizheng` - Smart Political Education
- `db_keyanfuzhu` - Research Assistance
- `db_wangshangbanshiting` - Campus Administrative Services
- `general` - General Assistant (default)

### Environment Configuration
- Backend: Environment variable `APP_ENV` (development/testing/production)
- Frontend: Vue CLI modes with proxy configuration
- Docker: Service networking with health checks

## WeChat Mini-Program (`/miniprogram/`)

### Structure and Configuration
- **AppID**: `wxa3fc6e84217531a2` - WeChat Mini-Program identifier
- **Main Entry**: `app.js` - Global app initialization with network validation
- **Environment Config**: `config/env.js` - Multi-environment support (development/staging/production)
- **Campus Restriction**: Configurable per environment (disabled in dev, enabled in production)

### Key Features
1. **Campus Network Validation**: Multi-layer access control system
   - API connectivity tests (`10.10.15.211`, `10.10.15.210`)
   - IP range validation (10.10.0.0/16, 192.168.0.0/16, 172.16.0.0/12)
   - GPS location verification (Beijing International Studies University bounds)
   - Administrative override via password-protected config panel

2. **RADIUS Authentication**: Integration with campus authentication system
   - Credentials validated against RADIUS servers
   - Local storage for session management
   - Fallback for development environments

3. **Adaptive API Integration**: Environment-based API routing with fallback mechanisms

### Page Structure
- **index**: Home page with welcome messages and quick actions
- **chat**: Main conversation interface with scene selection
- **scenes**: Domain-specific AI assistants selection
- **history**: Conversation history management
- **profile**: User settings and admin access
- **admin-config**: Network restriction configuration (password: `bisu2024admin`)
- **access-denied**: Campus restriction violation handling

### Development Commands
```bash
# WeChat Developer Tools required for mini-program development
# Import project with AppID: wxa3fc6e84217531a2
# Configure server domains in WeChat MP Admin Panel
```

### Network Validation System
- **Class**: `NetworkValidator` in `utils/network-validator.js`
- **Admin Password**: `bisu2024admin` (stored key: `bisu_admin_2024`)
- **Campus Coordinates**: ~39.945°N, 116.465°E (approximate bounds)
- **Validation Bypass**: Development environment or config disabled

### Key Files to Know
- `miniprogram/utils/network-validator.js:26` - Core campus validation logic
- `miniprogram/utils/auth.js:13` - RADIUS authentication implementation
- `miniprogram/config/env.js:42` - Environment detection and API routing
- `miniprogram/app.js:78` - Global network validation on app launch
- `backend/swagger.json` - Complete API documentation
- `docker-compose.yml` - Full deployment configuration
- `frontend/vue.config.cjs` - Development proxy and build settings
- `backend/routes/chat.py:117` - Main chat logic with fallback mechanism
- `frontend/src/main.js` - App initialization and global configurations