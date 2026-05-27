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

## 2. Vercel Project Settings
I have added a `vercel.json` file that explicitly configures the build for TanStack Start. Ensure the following settings are used in the Vercel Dashboard:

- **Framework Preset**: `Other` (Do NOT use TanStack Start preset as it might conflict with our custom `vercel.json`).
- **Build Command**: `npm run build`
- **Output Directory**: `.output`
- **Install Command**: `npm install --legacy-peer-deps`

## 3. Update Google OAuth Redirect URI
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project and go to **APIs & Services > Credentials**.
3. Edit your **OAuth 2.0 Client ID**.
4. Add your Vercel URL to **Authorized JavaScript origins**:
   - `https://open-builder-mvp.vercel.app`
5. Add the Supabase callback URL to **Authorized redirect URIs**:
   - `https://xypwkophnbcimzbsvein.supabase.co/auth/v1/callback`

## 4. Why the 404 error?
The 404 error occurred because Vercel didn't know how to route requests to the TanStack Start server functions. 
- I have updated `vite.config.ts` to explicitly set `deployment: 'vercel'`.
- I have added a `vercel.json` that maps all incoming requests to the `.output` directory where the server bundle lives.
- I have set the output directory to `.output` which is where TanStack Start generates the Vercel-compatible build.
