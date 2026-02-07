# Deployment Guide: Global Mosaic on Render

This guide explains how to deploy the FastAPI backend to [Render.com](https://render.com).

## Prerequisites

1.  **GitHub Repo**: Ensure your code is pushed to a GitHub repository.
2.  **Render Account**: Sign up at [render.com](https://render.com).
3.  **Supabase Project**: You need your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
4.  **OpenRouter Key**: You need your `OPENROUTER_API_KEY`.

## Setup Steps

### 1. New Web Service

1.  Go to your Render Dashboard.
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.

### 2. Configuration

Render will detect the `render.yaml` file (Blueprint) if you choose "Blueprints" initially. If you are setting it up manually as a Web Service:

*   **Name**: `global-mosaic-backend`
*   **Runtime**: Python 3
*   **Build Command**: `pip install -r backend/requirements.txt`
*   **Start Command**: `cd backend && ./start.sh`

### 3. Environment Variables

You **MUST** set these environment variables in the Render Dashboard under the "Environment" tab for your service:

*   `SUPABASE_URL`: Found in Supabase Dashboard -> Project Settings -> API -> Project URL.
*   `SUPABASE_SERVICE_ROLE_KEY`: Found in Supabase Dashboard -> Project Settings -> API -> `service_role` (secret) key. **Do not use the `anon` public key.**
*   `OPENROUTER_API_KEY`: Your OpenRouter API Key.

### 4. Deploy

1.  Click **Create Web Service**.
2.  Render will start building your app.
3.  Watch the logs. Once you see `Application startup complete`, your API is live!

## Troubleshooting

*   **Logs**: Check the "Logs" tab in Render for any Python errors.
*   **Health Check**: Visit `https://your-app-name.onrender.com/health` to verify the API is running.
