# SV Developers portal (Vercel)

Passwords and member data stay on the server. The browser only gets data after signing in.

## Folder layout
- public/index.html  the web page (no passwords or member data inside)
- api/login.js       checks the password and returns a signed token
- api/people.js      returns member data only to signed-in users (viewers get a reduced version)
- lib/               server-only code and data (not reachable from the browser)

## Deploy
1. Upload this whole folder to your GitHub repository (replace the old files).
2. In Vercel: Settings > Environment Variables, add:
   - ADMIN_PASSWORD   (choose a NEW password)
   - EDITOR_PASSWORD  (choose a NEW password)
   - VIEWER_PASSWORD  (choose a NEW password)
   - AUTH_SECRET      (a long random string, 40+ characters)
3. Redeploy.

The old passwords were visible in the earlier version, so use new ones.
Edits made in the page are not saved after a refresh until a database is connected.
