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
I have updated the project to use a standard **Vite** deployment pattern which is the most stable for Vercel.

**Settings to use in Vercel Dashboard:**
- **Framework Preset**: `Vite` (Do NOT use TanStack Start preset).
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install --legacy-peer-deps`

## 3. Why the 404 error?
The error happened because the `.output` directory used by TanStack Start's SSR mode was not being correctly picked up by Vercel's standard routing. By switching to the `dist` folder and adding a catch-all rewrite in `vercel.json`, all your routes (like `/auth`, `/explore`, etc.) will now load correctly on the first try.
