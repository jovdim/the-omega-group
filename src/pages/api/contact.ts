import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

// This route runs as a serverless function (real Node), so it can talk SMTP.
export const prerender = false;

// Read config from environment variables (set in the Vercel dashboard).
// Falls back to Astro's import.meta.env for local `astro dev`.
const env = (key: string): string =>
  process.env[key] ?? (import.meta.env as Record<string, string>)[key] ?? "";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const POST: APIRoute = async ({ request }) => {
  let name = "", email = "", phone = "", message = "", honey = "";

  try {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const body = await request.json();
      name = (body.name || "").trim();
      email = (body.email || "").trim();
      phone = (body.phone || "").trim();
      message = (body.message || "").trim();
      honey = (body.website || "").trim();
    } else {
      const form = await request.formData();
      name = String(form.get("name") || "").trim();
      email = String(form.get("email") || "").trim();
      phone = String(form.get("phone") || "").trim();
      message = String(form.get("message") || "").trim();
      honey = String(form.get("website") || "").trim();
    }
  } catch {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  // Honeypot: bots fill this hidden field. Pretend success, drop silently.
  if (honey !== "") return json({ ok: true, message: "Thanks! Your message has been sent." });

  // Validation
  if (!name || !email || !message) {
    return json({ ok: false, message: "Please fill in your name, email, and message." }, 422);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, message: "Please enter a valid email address." }, 422);
  }
  if (message.length > 5000) {
    return json({ ok: false, message: "Your message is too long." }, 422);
  }

  const SMTP_HOST = env("SMTP_HOST") || "smtp.hostinger.com";
  const SMTP_PORT = Number(env("SMTP_PORT") || "465");
  const SMTP_USER = env("SMTP_USER");
  const SMTP_PASS = env("SMTP_PASS");
  const MAIL_TO = env("MAIL_TO") || SMTP_USER;

  if (!SMTP_USER || !SMTP_PASS) {
    return json({ ok: false, message: "Email is not configured yet." }, 500);
  }

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465 (SSL), false for 587 (STARTTLS)
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Website Contact Form" <${SMTP_USER}>`,
      to: MAIL_TO,
      replyTo: `"${name}" <${email}>`,
      subject: `New contact form message from ${name}`,
      text:
        `New contact form message\n\n` +
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\n\n` +
        `Message:\n${message}`,
      html:
        `<h2>New contact form message</h2>` +
        `<p><strong>Name:</strong> ${esc(name)}</p>` +
        `<p><strong>Email:</strong> ${esc(email)}</p>` +
        `<p><strong>Phone:</strong> ${esc(phone || "Not provided")}</p>` +
        `<p><strong>Message:</strong></p><p>${esc(message).replace(/\n/g, "<br>")}</p>`,
    });

    return json({ ok: true, message: "Thanks! Your message has been sent." });
  } catch (err) {
    console.error("Mail send failed:", err);
    return json(
      { ok: false, message: "Sorry, something went wrong sending your message. Please try again later." },
      500
    );
  }
};
