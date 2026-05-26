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
2. Go to [http://localhost:8082/auth](http://localhost:8082/auth). (Note: The port may change to 8082 if 8080/8081 are busy).
3. Try signing in with Google or creating an email account.

### Safari Troubleshooting
If you are using **Safari** and see `net::ERR_ABORTED` or a 404 page:
1. **Disable "Prevent Cross-Site Tracking"**: Go to Safari > Settings > Privacy and uncheck "Prevent cross-site tracking" temporarily to test.
2. **Try Chrome or Firefox**: Safari's strict privacy rules often block Supabase requests on `localhost`.
3. **Check Console**: If you see a "404" screen with a "Back to feed" button, it means the app is running but the route is not being matched. Try a hard refresh (`Cmd+Shift+R`).

