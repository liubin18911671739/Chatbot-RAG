# Repository Guidelines

## Project Structure & Modules
- `backend/` Flask API (routes, services, models, utils); tests in `backend/tests/`.
- `frontend/` Vue 3 app (views, router, store, services, assets).
- `miniprogram/` WeChat Mini Program.
- `docker/`, `docker-compose.yml`, `render*.yaml` for deployment; `nginx/` config.
- Data and examples: `app.db`, `swagger.json`, scripts under `scripts/`.

## Build, Run, and Test
- Backend (dev): `cd backend && pip install -r requirements.txt && python app.py`.
- Backend (prod): `gunicorn -w 4 -b 0.0.0.0:5000 app:app`.
- Frontend (dev): `cd frontend && npm install && npm run serve`.
- Frontend (build): `npm run build`.
- Lint frontend: `npm run lint`.
- Docker (all services): from repo root `docker-compose up --build`.
- Backend tests: `cd backend && pytest` or with coverage `pytest --cov=backend`.
- Cypress (if used): `cd frontend && npx cypress open`.

## Coding Style & Naming
- Python: PEP 8, 4-space indent, `snake_case` for functions/vars, `PascalCase` for classes. Keep route handlers thin; put logic in `services/`.
- JavaScript/Vue: use ESLint defaults, `camelCase` for vars/functions, `PascalCase` for components. Single-file components in `src/views` or `src/components`.
- API routes: RESTful paths under `backend/routes/` (e.g., `/chat`, `/scenes`).
- Files: prefer descriptive names, e.g., `chat_service.py`, `ChatView.vue`.

## Testing Guidelines
- Python tests live in `backend/tests/` named `test_*.py`; target services and routes.
- Aim for meaningful coverage on core flows: `/chat`, `/scenes`, auth.
- Run `pytest -q` locally; include fixtures where helpful.

## Commit & Pull Requests
- Commits: short, imperative subject (max ~72 chars), body explains why and impact.
  - Examples: `feat(backend): add /feedback endpoint`, `fix(frontend): debounce chat send`.
- Branches: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`.
- PRs: include purpose, summary of changes, testing notes, linked issues, and screenshots/GIFs for UI.
- Must pass: backend tests, frontend lint/build.

## Security & Configuration
- Do not commit secrets. Use `.env` (see `.env.example`) and environment variables.
- Campus network rules exist for the Mini Program; avoid weakening network validation.
- If changing auth or CORS, review `backend/config.py` and `Flask-JWT-Extended` usage.

## Agent-Specific Notes
- Keep changes minimal and scoped; follow this guide and existing patterns.
- Update docs/tests when altering public endpoints or behaviors.
