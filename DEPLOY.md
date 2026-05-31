# Tomegag landing page — build & deploy

Astro static site + a small PHP handler (`send.php`) that emails contact-form
submissions to your inbox through Hostinger SMTP. No third-party service.

## 1. Add the email password (one time)

Open `public/config.php` and replace:

```php
'SMTP_PASS' => 'PUT_THE_PASSWORD_HERE',
```

with the real password for `admin@tomegag.com`.

> The password lives only in this PHP file on the server. PHP is executed, not
> served as text, so visitors can never see it. `public/config.php` is also
> git-ignored so it won't end up in a repo.

## 2. Run locally (optional)

```bash
npm install      # first time only
npm run dev      # preview at http://localhost:4321
```

Note: `npm run dev` shows the page, but the **form won't actually send** locally
because there's no PHP server here. Email sending only works once deployed to
Hostinger (which runs PHP). To test the form, deploy first (step 3–4).

## 3. Build

```bash
npm run build
```

This creates a `dist/` folder containing everything to upload:

```
dist/
├─ index.html          # the landing page
├─ send.php            # contact form handler
├─ config.php          # your SMTP credentials
├─ PHPMailer/          # the email library
└─ favicon.*
```

## 4. Upload to Hostinger

1. Log in to **hPanel → Files → File Manager** (or use FTP).
2. Go to the **`public_html`** folder of your domain.
3. Upload the **contents of `dist/`** into `public_html`
   (so `index.html`, `send.php`, `config.php`, and `PHPMailer/` sit directly
   inside `public_html`).
4. Visit your site and submit the contact form — the message should arrive at
   `admin@tomegag.com`.

## Troubleshooting

- **Email not arriving / "something went wrong":**
  - Double-check the password in `config.php`.
  - In `config.php`, if port `465` doesn't work, switch to:
    `'SMTP_PORT' => 587,` and `'SMTP_SECURE' => 'tls',`.
  - Confirm SMTP host in hPanel → Emails → **Connect Devices/Apps**
    (usually `smtp.hostinger.com`).
- **Check the spam folder** the first time.
- **PHP version:** Hostinger uses PHP 7.4+ by default, which PHPMailer supports.

## How it works

```
Visitor fills form  →  POST to /send.php  →  PHPMailer connects to
smtp.hostinger.com (login: admin@tomegag.com)  →  email lands in your inbox.
```

Hitting **Reply** on the email replies straight to the visitor (their address is
set as Reply-To). A hidden "honeypot" field quietly blocks most spam bots.
