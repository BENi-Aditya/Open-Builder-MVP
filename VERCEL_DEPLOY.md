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
I have updated the configuration to ensure the build output is correctly placed for Vercel. Ensure the following settings are used in the Vercel Dashboard:

- **Framework Preset**: `Vite` (Vercel will auto-detect this).
- **Build Command**: `npm run build`
- **Output Directory**: `.output/client` (This is where the browser assets will live).
- **Install Command**: `npm install --legacy-peer-deps`

## 3. Update Google OAuth Redirect URI
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project and go to **APIs & Services > Credentials**.
3. Edit your **OAuth 2.0 Client ID**.
4. Add your Vercel URL to **Authorized JavaScript origins**:
   - `https://open-builder-mvp.vercel.app`
5. Add the Supabase callback URL to **Authorized redirect URIs**:
   - `https://xypwkophnbcimzbsvein.supabase.co/auth/v1/callback`

## 4. Why the previous error?
The "No Output Directory named .output" error occurred because the configuration wrapper was defaulting to a different build structure. I have explicitly set the output directory to `.output` in `vite.config.ts` and updated the Vercel settings to point to the client-side bundle within that directory.

Once you set the **Output Directory** to `.output/client` in Vercel, it will correctly serve your frontend assets.
