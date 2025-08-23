# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

iChat is a comprehensive RAG-QA (Retrieval-Augmented Generation Question-Answering) system designed for Beijing International Studies University (BISU). It consists of three main components:

- **Frontend**: Vue.js 3 web application with Element Plus UI
- **Backend**: Flask API server with RAG implementation using sentence transformers
- **Miniprogram**: WeChat mini-program with campus network access restrictions

## Development Commands

### Frontend (Vue.js)
```bash
cd frontend
npm install              # Install dependencies
npm run serve           # Development server (port 8080)
npm run build           # Production build
npm run debug           # Development server with verbose logging
```

### Backend (Flask)
```bash
cd backend
pip install -r requirements.txt    # Install dependencies
python app.py                      # Development server (port 5000)
gunicorn -w 4 -b 0.0.0.0:5000 app:app  # Production server
```

### Testing
```bash
# Backend tests
cd backend
pytest tests/

# Frontend API tests
cd test
node test_sendChatMessage_simple.js    # Quick API test
node test_sendChatMessage.js           # Full API test suite
```

### Docker Deployment
```bash
docker-compose up --build    # Full stack deployment
```

## Architecture Overview

### Backend Structure
- `routes/`: API endpoints organized by functionality
  - `chat.py`: Main chat/QA endpoint using RAG pipeline
  - `scenes.py`: Knowledge domain management
  - `auth.py`: Authentication and authorization
  - `feedback.py`: User feedback collection
- `services/`: Core business logic
  - `chat_service.py`: RAG implementation with sentence transformers
  - `rag_service.py`: Document processing and vector search
- `models/`: Database models and schemas
- `utils/`: Helper functions and utilities

### Frontend Structure
- `src/components/`: Vue components
  - `ChatBox.vue`: Main chat interface
  - `AgentSelector.vue`: Scene/domain selection
  - `ResponseRenderer.vue`: AI response display with markdown
- `src/services/`: API communication layer
  - `chatService.js`: Chat API integration
  - `auth.js`: Authentication service
- `src/stores/`: Pinia state management
- `src/views/`: Page-level components

### Miniprogram Structure
- **Campus Network Restrictions**: Enforces access only from BISU campus network
- `utils/network-validator.js`: Multi-layer network validation (API connectivity, IP ranges, GPS)
- `pages/`: WeChat mini-program pages
- Admin configuration with password protection

## Key Technical Details

### RAG Implementation
- Uses sentence transformers for text embeddings
- Vector similarity search for context retrieval  
- Supports multiple knowledge domains (scenes):
  - 思政学习空间 (Political Education)
  - 通用助手 (General Assistant)
  - 学习指导 (Learning Guidance)
  - 科研辅助 (Research Assistance)

### API Endpoints
- `POST /api/chat`: Main QA endpoint
- `GET /api/scenes`: Available knowledge domains
- `GET /api/greeting`: Welcome messages
- `POST /api/feedback`: User feedback collection
- `GET /api/suggestions`: Query suggestions
- `GET /api/questions`: Question management
- `POST /api/questions`: Insert new questions
- `POST /api/update/{id}`: Update questions
- `POST /api/delete/{id}`: Delete questions
- `GET /api/search`: Search questions with params

### Campus Network Security
The system implements comprehensive campus network restrictions:
- **API Connectivity Check**: Validates connection to campus servers (10.10.15.211, 10.10.15.210)
- **IP Range Validation**: Checks for campus network segments
- **GPS Location Verification**: Ensures physical presence on campus
- **Admin Configuration**: Password-protected settings (password: bisu2024admin)

### Environment Configuration
- Development: Debug logging enabled, local test mode
- Production: Optimized logging, network restrictions enforced
- API base URLs: 10.10.15.210:5000 (primary), 10.10.15.211:5000 (fallback)

## Important Notes

- The system uses Chinese language interfaces and documentation
- Network restrictions are designed specifically for BISU campus environment
- All API responses include Chinese text and should handle UTF-8 encoding properly
- The RAG system is optimized for Chinese language queries about university policies and procedures