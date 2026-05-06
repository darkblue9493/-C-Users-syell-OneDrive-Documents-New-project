# South Diamond Website

This project now has:

- Player website: `index.html`
- Admin reply desk: `admin.html`
- Backend API: `server.js`
- Chat database file: `data/chats.json`
- Player signup, login, password reset, and registered-player list for admin

## Run Locally

Easiest option:

Double-click:

```text
start-south-diamond.bat
```

Keep the black window open while using the website.

Manual option:

Open a terminal in this folder and run:

```powershell
npm start
```

Then open:

```text
http://localhost:3000
```

Admin desk:

```text
http://localhost:3000/admin.html
```

When opened through `http://localhost:3000`, player messages and admin replies are saved in `data/chats.json`.
Registered player accounts are saved in the same database file.

## Admin Login

Default login:

```text
Username: admin
Password: southdiamond
```

To change it for local use:

```powershell
$env:ADMIN_USERNAME="yourname"
$env:ADMIN_PASSWORD="yourpassword"
npm start
```

On an online host, set `ADMIN_USERNAME` and `ADMIN_PASSWORD` as environment variables in the hosting dashboard.

## Important

Opening `index.html` directly with `file:///` still works for preview, but real shared chat needs the server URL above.

## Deploy Online

This can be deployed to services that run Node.js apps, such as Render, Railway, Fly.io, or a VPS.

Use:

```text
npm start
```

The app reads `PORT` from the hosting service automatically.

For hosts with persistent storage, set:

```text
DATA_DIR=/var/data
```

Then mount the host's persistent disk/storage at `/var/data` so chat messages do not disappear after redeploys.
