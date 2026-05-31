# The Omega Group — deploy guide (Vercel)

Astro static site + a serverless function (`/api/contact`) that emails contact-form
submissions to your inbox using **Nodemailer + your Hostinger SMTP**. No third party.

## How the contact form works

```
Visitor submits form  →  POST /api/contact (Vercel serverless function)
                      →  Nodemailer connects to smtp.hostinger.com (admin@tomegag.com)
                      →  email lands in your inbox
```

The homepage is static (fast, free). Only the form submission runs the function.

## Environment variables (the email credentials)

These live in Vercel, NOT in the code. Locally they're in `.env` (git-ignored).

| Variable | Value |
|---|---|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` (or `587` if 465 is blocked) |
| `SMTP_USER` | `admin@tomegag.com` |
| `SMTP_PASS` | (the mailbox password) |
| `MAIL_TO`  | `admin@tomegag.com` |

## Deploy — option A: Vercel website (easiest)

1. Push this project to a GitHub repo.
2. Go to **vercel.com** → sign up (free) → **Add New → Project** → import the repo.
3. Vercel auto-detects Astro. Before deploying, open **Environment Variables**
   and add the 5 variables from the table above.
4. Click **Deploy**. Done — you get a free `*.vercel.app` URL.

## Deploy — option B: Vercel CLI

```bash
npm i -g vercel
vercel            # links/creates the project (follow prompts)
# add the secrets:
vercel env add SMTP_HOST
vercel env add SMTP_PORT
vercel env add SMTP_USER
vercel env add SMTP_PASS
vercel env add MAIL_TO
vercel --prod     # deploy to production
```

## Connect your Hostinger domain (tomegag.com)

1. In Vercel: **Project → Settings → Domains → Add** `tomegag.com`.
2. Vercel shows you DNS records (an A record / CNAME).
3. In Hostinger **hPanel → Domains → DNS**, add those records.
4. Wait for DNS to propagate (minutes to a couple hours). HTTPS is automatic.
5. Update `site` in `astro.config.mjs` to your final domain if different.

## Test after deploying

Submit the contact form on the live site. You should receive the email at
`admin@tomegag.com`. Hitting **Reply** answers the visitor (their address is the Reply-To).

## Troubleshooting

- **Email not arriving:** double-check the env vars in Vercel (especially `SMTP_PASS`).
  If port `465` fails, set `SMTP_PORT=587`.
- **Check spam** the first time.
- A hidden honeypot field silently blocks most spam bots.
