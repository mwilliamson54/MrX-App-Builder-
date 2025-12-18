## MrX Backend & Dashboard – Cloudflare Deployment Guide

This guide explains how to deploy the **backend (Cloudflare Workers/Pages Functions)** and the **dashboard frontend (Vite app)** so they work together end‑to‑end.

---

## 1. Overview of the two Cloudflare projects

- **Backend project**  
  - Code: `COMPLETE_PAGE_FUNCTIONS/`  
  - Runs as: Cloudflare Pages Functions or Workers  
  - Responsibilities:
    - Auth (`/api/auth/login`)
    - Projects / Chats / Messages / Jobs / Logs / Artifacts
    - Secrets storage & retrieval
    - Colab integration (job claim, job updates, logs)

- **Dashboard project**  
  - Code: `COMPLETE_PAGE_FUNCTIONS/DASHBOARD/`  
  - Runs as: Cloudflare Pages static site  
  - Talks to backend via `VITE_API_BASE_URL`

You will create **two separate Cloudflare Pages projects** (or one Pages + one Workers), and connect them via environment variables.

---

## 2. Backend deployment (Cloudflare)

### 2.1. Prepare the backend repository

- Backend root is `COMPLETE_PAGE_FUNCTIONS/`.  
- Ensure the following files are present at that root:
  - `wrangler.toml`
  - `functions/` (all API endpoints)
  - `lib/`
  - `types/`
  - `package.json`

### 2.2. Create / bind KV namespace

The backend uses a KV namespace bound as `KV`.

1. In Cloudflare dashboard:
   - Go to **Workers & Pages → KV**.
   - Create a namespace, e.g. `mrx-app-builder-kv`.
2. Note the namespace ID.
3. In your backend Pages/Workers project configuration, ensure KV binding:
   - Binding name: `KV`
   - Namespace: `mrx-app-builder-kv`

If using `wrangler` locally, the `wrangler.toml` already has:

```toml
[[kv_namespaces]]
binding = "KV"
id = "<your-namespace-id>"
preview_id = "<your-namespace-id>"
```

Replace the IDs with your actual namespace ID.

### 2.3. Required environment variables (backend)

In the backend project’s **Environment Variables** (Cloudflare dashboard → your backend project → Settings → Environment Variables), configure:

- **Core**
  - `DASHBOARD_URL`  
    - The exact origin of your dashboard frontend, e.g.  
      `https://mrx-dashboard.pages.dev` or `https://app.your-domain.com`
  - `SESSION_SECRET`  
    - Long random secret used to sign JWTs (login sessions).
  - `ENCRYPTION_KEY`  
    - Strong 32‑byte key (for encrypting secrets in KV).  
    - You can generate one with Node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

- **GitHub integration**
  - `GITHUB_PAT_MASTER`  
    - GitHub Personal Access Token used by backend to fetch repository metadata (default branch, etc.) when creating projects.

- **Admin / Secrets**
  - `ADMIN_API_KEY`  
    - Random secret string; used when calling `POST /api/admin/secrets`.
  - `ADMIN_USERNAME`  
    - Admin login username for the dashboard (e.g. `admin`).
  - `ADMIN_PASSWORD`  
    - Strong password used by `/api/auth/login`.

- **Colab integration**
  - `COLAB_AGENT_SECRET`  
    - Shared secret Colab must send in `X-Colab-Secret` on all Colab API calls.

> All of these should be set as **environment variables / secrets** in Cloudflare, not hard‑coded.

### 2.4. Build & deploy backend

You can deploy backend as:

- **Cloudflare Pages Functions** (code in `/functions`)  
  or  
- **Workers** (via `wrangler deploy`)

#### Option A: Deploy via Cloudflare Pages (recommended)

1. Push `COMPLETE_PAGE_FUNCTIONS/` to a Git repository (GitHub, GitLab, etc.).
2. In Cloudflare dashboard:
   - Go to **Workers & Pages → Pages → Create Project**.
   - **Connect to Git** and select the repo containing `COMPLETE_PAGE_FUNCTIONS/`.
   - Set:
     - **Build command**: `npm run build` (or appropriate if you add one)
     - **Build output directory**: (if using Pages Functions only, you can leave build blank; Functions run from `functions/`)
     - **Root directory**: `COMPLETE_PAGE_FUNCTIONS`
   - In **Functions** tab, ensure that:
     - Functions directory: `functions`
   - Add all **Environment Variables** from section 2.3.
3. Deploy.  
4. Note the backend URL, e.g. `https://mrx-backend.pages.dev`.

#### Option B: Deploy via `wrangler` (Workers)

From `COMPLETE_PAGE_FUNCTIONS/`:

```bash
npm install
wrangler login
wrangler deploy
```

Cloudflare will output a Workers URL like `https://mrx-app-builder.<subdomain>.workers.dev`.  
Use that as your backend URL (append `/api` in the frontend config).

---

## 3. Dashboard deployment (Cloudflare Pages)

### 3.1. Prepare the dashboard project

- Dashboard root: `COMPLETE_PAGE_FUNCTIONS/DASHBOARD/`
- Tech: React + Vite

Make sure `DASHBOARD/` has:
- `package.json`
- `vite.config.js`
- `index.html`
- `src/` (App.jsx, main.jsx, etc.)

### 3.2. Required environment variables (dashboard)

In the dashboard Pages project settings (Environment Variables):

- **Backend connection**
  - `VITE_API_BASE_URL`  
    - Set to your backend base URL + `/api`, e.g.  
      `https://mrx-backend.pages.dev/api`
  - `VITE_MOCK_API`  
    - **`false` in production** (set `true` only for local dev with mocks).

- **Optional feature flags**
  - `VITE_ENABLE_ANALYTICS` (e.g. `true`)
  - `VITE_ENABLE_DEV_TOOLS` (e.g. `false`)
  - `VITE_ENABLE_DIFF_VIEWER` (e.g. `true`)

### 3.3. Create the Pages project for the dashboard

1. Push the code (including `COMPLETE_PAGE_FUNCTIONS/DASHBOARD/`) to Git.
2. In Cloudflare dashboard:
   - Go to **Workers & Pages → Pages → Create Project**.
   - Connect the repo.
   - Set:
     - **Root directory**: `COMPLETE_PAGE_FUNCTIONS/DASHBOARD`
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
     - **Node version**: `18`
   - Add environment variables from section 3.2.
3. Deploy.
4. Note the frontend URL, e.g. `https://mrx-dashboard.pages.dev`.

### 3.4. Wire CORS and URLs together

- In **backend env**, set:
  - `DASHBOARD_URL` = the frontend origin, e.g. `https://mrx-dashboard.pages.dev`
- In **dashboard env**, set:
  - `VITE_API_BASE_URL` = backend origin + `/api`, e.g. `https://mrx-backend.pages.dev/api`

This makes:
- CORS middleware in `_middleware.ts` allow the dashboard origin.
- All frontend API calls go to the correct backend.

---

## 4. Admin & secrets usage in production

Once both projects are deployed:

1. **Login to dashboard**
   - Use `/api/auth/login` via the UI.
   - Credentials: `ADMIN_USERNAME` / `ADMIN_PASSWORD` from backend env.

2. **Store secrets**
   - From a secure script or tool, call:

```bash
curl -X POST "https://<backend>/api/admin/secrets" \
  -H "X-Admin-Api-Key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "github",
    "projectId": "my-project",
    "value": "ghp_..."
  }'
```

3. **Use dashboard normally**
   - Create projects, chats, send messages, monitor jobs & artifacts.

At this point, the Cloudflare side is production‑ready and fully wired to work with Colab (next guide).

