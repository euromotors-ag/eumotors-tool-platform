# EuroMotors AG - Image Editor (frontend)

Internal web app for processing car photos with CarCutter. Login is Google only (Clerk).

## Stack

React 19, Vite 6, TypeScript, Tailwind CSS 4, Clerk, react-router-dom. Deployed on Vercel.

## Features

- Upload images from files, a folder (File System Access API) or a Blocket URL
- Crop, flip and reorder images before processing
- Profiles: Euro Motors, Car Trade 24, Both, White, BG Removal, Download Original
- Download the results as single images or a ZIP, or save them back to the source folder

## Getting started

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # production build
npm run lint
```

`.env`:

```bash
VITE_CLERK_PUBLISHABLE_KEY=...
VITE_API_URL=http://localhost:3001            # backend
VITE_IMAGE_PROCESS_ENDPOINT=/api/v1/images/process
VITE_SCRAPE_ENDPOINT=/api/v1/scrape
VITE_USE_MOCK_API=false                       # true returns a mock image instead of calling CarCutter
```
