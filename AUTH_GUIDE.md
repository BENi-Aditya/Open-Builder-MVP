# How to Make Login Work in OPENBUILDER

To get the authentication working, you need to set up **Supabase** and **Google OAuth**. Follow these steps:

## 1. Supabase Project Setup
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. In your Supabase Dashboard, go to **Project Settings > API**.
3. Copy the `Project URL` and `anon` (public) key.
4. Open the `.env` file in the root of this project and update:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   ```

## 2. Database Schema
1. In your Supabase Dashboard, go to **SQL Editor**.
2. Click **New Query** and paste the contents of `supabase/migrations/20260517050350_bbcf59e9-7821-439c-af1a-4ff900eda9a6.sql`.
3. Run the query to create the necessary tables (`profiles`, `projects`, etc.) and triggers.

## 3. Google OAuth Setup
1. In Supabase Dashboard, go to **Authentication > Providers**.
2. Enable **Google**.
3. You will need a `Client ID` and `Client Secret` from the [Google Cloud Console](https://console.cloud.google.com/).
4. In Google Cloud Console:
   - Create a new project.
   - Go to **APIs & Services > OAuth consent screen** and set it up.
   - Go to **Credentials > Create Credentials > OAuth client ID**.
   - Set application type to **Web application**.
   - Add the **Authorized redirect URI** provided in your Supabase Google Provider settings (usually `https://<project-ref>.supabase.co/auth/v1/callback`).
5. Paste the `Client ID` and `Client Secret` back into Supabase.

## 4. Final Verification
1. Restart your development server: `npm run dev`.
2. Go to [http://localhost:8081/auth](http://localhost:8081/auth).
3. Try signing in with Google or creating an email account.

**Note:** Ensure your email provider is also configured in Supabase (Authentication > Providers > Email) if you want to use email/password signups with verification.
