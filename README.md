# EuroMotors Image Editor

Internal tool for EuroMotors AG staff: sign in with Google (Clerk) and process car photos with
CarCutter (EuroMotors and CarTrade24 branding, plain white background, background removal).

## Structure

```
backend/    Express + TypeScript API (CarCutter, AWS S3, Blocket image import), Docker on Render
frontend/   React + Vite + Tailwind app with Clerk login and the image editor, on Vercel
```

## Development

```bash
npm install && npm run install:all   # root, backend and frontend dependencies
npm run dev                          # backend on :3001 and frontend on :5173
npm run build                        # build both
```

Environment variables: backend in `backend/utils/validate-env.ts`, frontend in `frontend/readme.md`.

## API

All `/api/v1` routes require a signed-in user (`Authorization: Bearer <Clerk session token>`,
verified with `CLERK_SECRET_KEY`). Requests without a valid token get 401.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/images/process` | Process one image with a profile (`eumotors`, `cartrade24`, `white`, `removebg`) |
| POST | `/api/v1/scrape` | Get image URLs from a Blocket listing |
| POST | `/api/v1/scrape/download-image` | Download an image through the backend (CORS proxy) |
| GET | `/api/health` | Health check (public) |
