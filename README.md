# SV Developers portal (Vercel)

Passwords and member data stay on the server. The browser only gets data after signing in.
Changes made in the page are saved in a database, so everyone sees them.

## Folder layout
- public/index.html  the web page (no passwords or member data inside)
- public/layouts/    the three layout images (Sri City, Sri Vanam, Sri Nivasam) and the plot outlines (data.js)
- api/login.js       checks the password and returns a signed token
- api/people.js      members: read, add, edit, delete (rules are checked on the server)
- api/acts.js        site visits and plot bookings (logged by agents)
- api/plots.js       status of every plot on the project layouts (ready, booked, sold, bank mortgage)
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

## Projects and plots
- Open the "Projects and plots" tab. Pick a project, then tap a plot.
- Colours: green = ready to buy, blue = booked, red = sold, pink = bank mortgage.
- Admin and Editor can change a plot (status, client name, note), one at a time or with "Select several".
- Viewer sees the colours only (no client names or notes).
- Plot statuses are saved in the same database as the members. Plots start as ready to buy, except the
  pink mortgage plots shown on the layouts (Sri Nivasam 18-21, 29-36, 46 and Sri City 77-85, 98-107).

## Projects, plots and flats

- Projects: Sri City, Sri Vanam, Sri Nivasam, Siri Vanam (plot maps) and SV Apartments (5 floors x 6 flats = 30 flats).
- Colours: Ready to buy = white, Booked = green, Sold = red, Bank mortgage = pink.
- Admin and Editor can change any plot or flat (single or "Select several"); Viewer is read-only.
- Plot size (sq yd and sq ft) and dimensions come from the layout files in `public/layouts/data.js` (`a` = area, `d` = [short, long] side in feet, `x` = 1 means approximate).
- Flats are numbered by floor: 101-106 (1st floor), 201-206 (2nd) ... 501-506 (5th). Facing is shown for every plot (from the road side, using each layout compass) and flat (editable).
- Files changed in this update: `public/index.html`, `public/layouts/*`, `api/plots.js`.
- Cars drive along the roads on every plot map (button "Cars: on/off"; off automatically if the device asks for reduced motion). Road paths are stored as `roads` in `public/layouts/data.js`.
- "Client name" is now "Marketer name" (stored as `marketer`; older saved `client` values still show). Viewers can see the marketer name too.
- Internal team section (between Team and Projects): COUPONS BD TEAM, COUPONS SALES TEAM, COUPONS TELE TEAM and INTERNAL TEAM. The old SV DEVELOPERS team is merged into INTERNAL TEAM (BD TEAM, SALES TEAM and COUPANS TELE TEAM are renamed to the COUPONS names). Old names stored in the database are converted automatically when the page loads.
- Files changed in this update: `public/index.html`, `lib/people.js`.
- Viewers do not see the Internal team tab, and the server never sends internal members (or their visits/bookings) to viewer logins. Files: public/index.html, api/people.js, api/acts.js, lib/teams.js.
