# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
iChat is a comprehensive RAG-QA System (Retrieval-Augmented Generation Question-Answering) designed for Beijing International Studies University (BISU). Multi-platform support includes web frontend, WeChat mini-program, with integrated campus network access restrictions.

## Architecture
- **Backend**: Flask API server with RAG pipeline, dual authentication (RADIUS + local DB), LLM integration (Google Gemini primary, DeepSeek fallback)
- **Frontend**: Vue 3 SPA with Element Plus, Pinia state management, responsive chat interface
- **Miniprogram**: WeChat mini-program with campus network validation and RADIUS authentication
- **Deployment**: Docker Compose with Nginx reverse proxy

## Common Development Commands

### Backend
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Development server (port 5000)
python app.py

# Production server
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Create admin user for testing
python create_test_admin.py  # Creates admin@ichat.com / admin

# Run tests
python -m pytest tests/           # Full test suite
python -m pytest tests/test_chat.py -v  # Single test file with verbose output
python test_auth.py               # RADIUS authentication tests
python test_gemini.py             # LLM integration tests
python -m pytest --cov=. --cov-report=html  # Coverage report

# Individual test files
python tests/test_analytics.py
python tests/test_integration.py
python tests/test_performance.py
python tests/test_questions.py
python tests/test_search.py
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Development server (port 8080, proxies /api/* to backend)
npm run serve

# Production build
npm run build

# Lint
npm run lint

# Tests
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npx cypress run           # E2E tests
npm run cypress:open      # Interactive E2E testing
```

### WeChat Mini-Program
```bash
# Open in WeChat Developer Tools
# AppID: wxa3fc6e84217531a2
# Configure server domains in WeChat MP Admin Panel
# Admin password: bisu2024admin
```

### Docker Deployment
```bash
# Full stack (frontend:8080, backend:5000, nginx:80/443)
docker-compose up --build

# Individual services
docker-compose up frontend
docker-compose up backend
docker-compose up nginx

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Environment Configuration

### Backend Environment Variables
- `APP_ENV`: Set to `development`, `testing`, or `production` (default: `development`)
  - Development/testing mode enables local test mode and debug logging
  - Production mode uses INFO-level logging and stricter security
- `ENABLE_LOCAL_TEST_MODE`: Auto-enabled in development/testing environments

### Frontend Development Proxy
The frontend development server ([vue.config.cjs](frontend/vue.config.cjs)) proxies `/api/*` requests to:
- Production: `http://10.10.15.211:5000`
- Local development: Change target to `http://localhost:5000` in vue.config.cjs
- Timeout: 40 seconds for long-running RAG queries

## System Architecture

### Backend (`/backend/`)
**Core Structure:**
- `app.py` - Flask app with CORS, Swagger UI (`/api/docs`), global error handling
- `routes/` - API endpoints (chat, auth, hybrid_auth, scenes, feedback, greeting, suggestions, analytics, insert, update, delete, search, questions)
- `services/` - Business logic (chat_service, rag_service)
- `models/database.py` - Database models and connections
- `swagger.json` - Complete API documentation

**Key Endpoints:**
- `/api/chat` (POST) - Main chat with primary API (10.10.15.210:5000) + DeepSeek fallback
- `/api/scenes` (GET) - Available knowledge domains
- `/api/auth` (POST) - RADIUS authentication
- `/api/hybrid_auth` (POST) - Combined RADIUS + local DB auth with JWT
- `/api/suggestions` (GET) - Quick question suggestions
- `/api/questions` (GET/POST) - Q&A management with deduplication
- `/api/analytics` (GET/POST) - Usage statistics and search query logging

**Authentication:**
- Dual mode: RADIUS (campus network) + local database (SQLAlchemy)
- JWT tokens via Flask-JWT-Extended
- Admin user: `python create_test_admin.py` creates admin@ichat.com
- Campus network validation for miniprogram access

**LLM Integration:**
- Primary: Google Gemini via `google.genai` package
- Fallback: DeepSeek Chat API on timeout/failure
- Timeout handling and error recovery in [routes/chat.py](backend/routes/chat.py)

### Frontend (`/frontend/`)
**Stack:** Vue 3 Composition API + Element Plus + Pinia/Vuex

**Key Components:**
- [ChatBox.vue](frontend/src/components/ChatBox.vue) - Main chat UI
- [AgentSelector.vue](frontend/src/components/AgentSelector.vue) - Scene/domain picker
- [HistoryPanel.vue](frontend/src/components/HistoryPanel.vue) - Conversation history
- [ResponseRenderer.vue](frontend/src/components/ResponseRenderer.vue) - Markdown response rendering
- [AnalyticsView.vue](frontend/src/components/AnalyticsView.vue) - Usage statistics with ECharts
- [CampusContribution.vue](frontend/src/components/CampusContribution.vue) - Q&A contribution system

**Configuration:**
- [vue.config.cjs](frontend/vue.config.cjs) - Dev proxy (`/api/*` → backend:5000)
- Development server auto-proxies API calls to avoid CORS

### WeChat Mini-Program (`/miniprogram/`)
**Configuration:**
- AppID: `wxa3fc6e84217531a2`
- [app.js](miniprogram/app.js) - Global network validation on launch
- [config/env.js](miniprogram/config/env.js) - Multi-environment API routing

**Campus Network Validation:**
- [utils/network-validator.js](miniprogram/utils/network-validator.js) - Multi-layer validation:
  - API connectivity (10.10.15.211, 10.10.15.210)
  - IP range check (10.10.0.0/16, 192.168.0.0/16, 172.16.0.0/12)
  - GPS location (BISU campus bounds: ~39.945°N, 116.465°E)
- [utils/auth.js](miniprogram/utils/auth.js) - RADIUS authentication
- Admin override: password `bisu2024admin` (key: `bisu_admin_2024`)

**Pages:**
- `index` - Home with quick actions
- `chat` - Main conversation interface
- `scenes` - Knowledge domain selection
- `history` - Conversation history
- `profile` - User settings + admin access
- `admin-config` - Network restriction config (password protected)
- `access-denied` - Campus restriction violation page

### Knowledge Domains (Scenes)
Scene IDs configured in backend for specialized RAG retrieval:
- `db_sizheng` - Political Education Resources (思政学习空间)
- `db_xuexizhidao` - Learning Guidance (学习指导)
- `db_zhihuisizheng` - Smart Political Education (智慧思政)
- `db_keyanfuzhu` - Research Assistance (科研辅助)
- `db_wangshangbanshiting` - Campus Administrative Services (网上办事厅)
- `general` or `null` - General Assistant (通用助手)

Each scene uses dedicated document collections with customized retrieval strategies.

## Key Technologies & Dependencies

### Backend Stack
- **Web Framework**: Flask 3.1.0 with Flask-CORS, Flask-JWT-Extended
- **Database**: SQLAlchemy 2.0.38 with MySQL connector, Flask-Migrate for migrations
- **Authentication**: PyRAD 2.4+ for RADIUS, JWT for session management
- **LLM Integration**:
  - Primary: `google-genai` (Google Gemini)
  - Fallback: `deepseek` 1.0.0
- **RAG Pipeline**:
  - `sentence-transformers` 3.4.1 for embeddings
  - `faiss-cpu` 1.10.0 for vector search
  - `langchain` 0.3.20 for text processing
- **Testing**: pytest 8.3.5, pytest-cov 6.0.0
- **API Documentation**: flask-swagger-ui 4.11.1 (accessible at `/api/docs`)

### Frontend Stack
- **Framework**: Vue 3 with Composition API
- **UI Library**: Element Plus 2.9.6
- **State Management**: Pinia 2.1.7 + Vuex 4.0.0
- **HTTP Client**: Axios 0.21.4
- **Routing**: Vue Router 4.0.0
- **Visualization**: ECharts 6.0.0 (analytics charts)
- **Markdown**: markdown-it 14.1.0 (response rendering)
- **Testing**: Jest 29.7.0, Cypress 12.17.4

## Important Development Notes

### Backend
- **Logging**: All logs written to `backend/logs/app.log` with 10MB rotation
- **CORS**: Enabled for all routes to support frontend development
- **Swagger UI**: API documentation auto-generated, visit `/api/docs` when backend is running
- **Test Database**: Tests use `conftest.py` fixtures for isolated test environments

### Frontend
- **Build Output**: Production builds go to `frontend/dist/`
- **Public Path**: Production uses `/ibisu/` base path, development uses `/`
- **Babel Transpilation**: Special handling for `birpc` and `@vue/devtools-kit` packages
- **Hot Reload**: Development server supports hot module replacement

### WeChat Miniprogram
- **Network Validation**: Strict campus network checks on app launch
- **Admin Override**: Use password `bisu2024admin` to bypass network restrictions in dev/testing
- **API Routing**: Environment-based configuration in `config/env.js`

## Testing Strategy
- **Backend**: Pytest-based unit, integration, and performance tests in `backend/tests/`
- **Frontend**: Jest for unit tests, Cypress for E2E testing
- **Coverage**: Use `pytest --cov` and `npm run test:coverage` to generate reports
- **Smoke Tests**: Quick validation tests in `tests/test_smoke.py`