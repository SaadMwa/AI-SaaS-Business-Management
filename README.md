# Business Management SaaS Monorepo

## Structure
- `backend/`: Express + TypeScript API
- `frontend/`: React + Vite app

## Install
1. `npm install` (root, for orchestration scripts)
2. `npm install --prefix backend`
3. `npm install --prefix frontend`

## Scripts (from repo root)
- `npm run dev`: run frontend and backend together
- `npm run build`: build backend (`tsc`) and frontend (`vite build`)
- `npm run start`: run backend in production mode

## Environment
- Backend env file: `backend/.env`
- Backend template: `backend/.env.example`
- Frontend env file: `frontend/.env` with `VITE_API_URL`
- Frontend fallback API base: `/api` when `VITE_API_URL` is unset

## Deploy (Vercel)
- Frontend: static build from `frontend/`
- Backend: serverless function at `backend/api/index.ts`
- API routed through `/api/*`