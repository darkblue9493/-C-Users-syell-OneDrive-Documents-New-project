# South Diamond Website

This project now has:

- Player website: `index.html`
- Admin reply desk: `admin.html`
- Backend API: `server.js`
- Chat database file: `data/chats.json`
- Player login, admin/sub-admin player creation, operator password resets, and registered-player list for admin

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
http://localhost:3000/admin9493
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

Secure admin link:

```text
https://southdiamond.online/admin9493
```

Admin login is blocked for 5 minutes after 5 wrong password attempts.

For free email login codes, create a free Brevo account and add these Render environment variables:

```text
BREVO_API_KEY=your-brevo-api-key
ADMIN_LOGIN_EMAIL=your-admin-email@example.com
ADMIN_FROM_EMAIL=your-verified-sender@example.com
```

Every successful username/password entry sends a 6-digit code to `ADMIN_LOGIN_EMAIL`. The code expires in 5 minutes.

## Excel Player Export

The admin portal has an `Export Excel` button in the Registered Players panel. It downloads:

```text
/api/admin/users.csv
```

Excel can open this CSV file.

For Excel's `Data > From Web` refresh feature, set a private token in Render:

```text
ADMIN_EXPORT_TOKEN=make-a-long-private-random-token
```

Then use this web address in Excel:

```text
https://southdiamond.online/api/admin/users.csv?token=make-a-long-private-random-token
```

Keep this token private because anyone with the token can download the registered-player list.

## Tierlock Payments

The player payment area can show Tierlock beside Stripe. Keep the Tierlock secret only in Render Environment Variables:

```text
TIERLOCK_MERCHANT_ID=e5474f4227
TIERLOCK_MERCHANT_SECRET=your-tierlock-merchant-secret
```

When a logged-in player clicks a Tierlock payment button, the server creates a short-lived payment link without exposing the merchant secret in the browser.

## Important

Opening `index.html` directly with `file:///` still works for preview, but real shared chat needs the server URL above.

## Keep Player Data After Deploys

Render's free plan does not keep local files forever. To keep registered players and chats after changes/redeploys, use Supabase.

In Supabase:

1. Open your project.
2. Go to SQL Editor.
3. Run the SQL from `supabase-schema.sql`.

In Render, add these environment variables:

```text
SUPABASE_URL=https://kkhgfybfstpzxtxsfhtu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-new-supabase-secret-key
```

Do not put the Supabase secret key in GitHub. Add it only inside Render's Environment page.

After adding the variables, click:

```text
Save, rebuild, and deploy
```

Player accounts and chat records will then save in Supabase instead of only in Render's temporary files.

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

If Supabase is enabled, `DATA_DIR` is only used for uploaded images/profile pictures. Player accounts and chats are stored in Supabase.
