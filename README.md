# SV Developers portal (Vercel)

Passwords and member data stay on the server. The browser only gets data after signing in.
Changes made in the page are saved in a database, so everyone sees them.

## Folder layout
- public/index.html  the web page (no passwords or member data inside)
- api/login.js       checks the password and returns a signed token
- api/people.js      members: read, add, edit, delete (rules are checked on the server)
- api/acts.js        site visits and plot bookings
- lib/auth.js        sign-in tokens
- lib/store.js       talks to the database
- lib/people.js      the starting list of members (copied into the database the first time)

## 1. Passwords (Vercel > Settings > Environment Variables)
- ADMIN_PASSWORD, EDITOR_PASSWORD, VIEWER_PASSWORD  (choose NEW passwords)
- AUTH_SECRET  (a long random string, 40+ characters)

## 2. Database (so changes are saved)
1. In your Vercel project open the Storage tab.
2. Create a database and choose Redis (Upstash). The free plan is enough.
3. Connect it to this project for all environments. Vercel adds the variables itself
   (names like KV_REST_API_URL and KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN).
4. Redeploy.

The first login after that copies the starting list from lib/people.js into the database.
From then on the database is the master copy, so editing lib/people.js no longer changes the live members.
If the yellow "Saving is not set up yet" bar still shows, the database is not connected to this project.

## Who can do what
- Admin: add, edit, delete members; edit or delete logged visits and bookings.
- Editor: add and edit members; log new visits and bookings.
- Viewer: read only, without phone, Aadhaar, PAN, family name or address.
