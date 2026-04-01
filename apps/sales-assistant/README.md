# Sales Assistant App

Standalone Vite app for the Salesforce Sales Assistant.

## Local dev

1. Start the backend from the repo root:

```powershell
cd "d:\VS Code\Personal Projects\Ai Agents\ai-agents-lab"
.\.venv\Scripts\python.exe -m uvicorn api.main:app --host 127.0.0.1 --port 8001
```

2. Start this frontend:

```powershell
cd "d:\VS Code\Personal Projects\Ai Agents\ai-agents-lab\apps\sales-assistant"
npm install
npm run dev
```

3. Open:

```text
http://127.0.0.1:5173
```

## Vercel

Set the Vercel Root Directory to:

```text
apps/sales-assistant
```

If the Sales Assistant backend is deployed separately, set:

```text
VITE_SALES_API_BASE_URL=https://your-sales-api-domain
```

If frontend and backend are served from the same domain, leave it empty.
