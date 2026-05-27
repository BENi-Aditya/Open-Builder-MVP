# Deploying OPENBUILDER to Vercel

To deploy this project to Vercel and ensure all logic (Auth, Database, etc.) works perfectly, follow these steps:

## 1. Environment Variables
When you import your project into Vercel, you **MUST** add the following environment variables in the Vercel Dashboard (**Settings > Environment Variables**):

| Key | Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase Anon Key |
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` |
| `SUPABASE_PUBLISHABLE_KEY` | Same as `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `TANSTACK_START_DEPLOYMENT` | `vercel` |

## 2. Vercel Project Settings
Vercel should automatically detect **TanStack Start**. Ensure the following settings are used in the Vercel Dashboard:

- **Framework Preset**: `TanStack Start` (Vercel will auto-detect this).
- **Build Command**: `npm run build`
- **Output Directory**: Leave as default (Vercel will handle this for TanStack Start).
- **Install Command**: `npm install --legacy-peer-deps`

## 3. Update Google OAuth Redirect URI
Since you are deploying to a new domain (e.g., `open-builder-mvp.vercel.app`), you need to update your Google OAuth settings:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project and go to **APIs & Services > Credentials**.
3. Edit your **OAuth 2.0 Client ID**.
4. Add your Vercel URL to **Authorized JavaScript origins**:
   - `https://your-project.vercel.app`
5. Add the Supabase callback URL to **Authorized redirect URIs**:
   - `https://your-supabase-project-id.supabase.co/auth/v1/callback`

## 4. Why the 404 error?
The 404 error happened because we were manually overriding the output directory in a `vercel.json` file. I have deleted that file so Vercel can use its built-in **TanStack Start** support, which correctly handles the server-side functions and routing.

By adding `TANSTACK_START_DEPLOYMENT=vercel` to your environment variables, the build process will now generate the correct structure for Vercel.
