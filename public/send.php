<?php
/**
 * Contact form handler.
 * Receives the form POST, validates it, and emails it to your inbox
 * through Hostinger's SMTP using PHPMailer. Returns JSON.
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

$config = require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

function respond($ok, $message, $code = 200) {
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'message' => $message]);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Method not allowed.', 405);
}

// --- Collect & sanitize input ---
$name    = trim($_POST['name']    ?? '');
$email   = trim($_POST['email']   ?? '');
$phone   = trim($_POST['phone']   ?? '');
$message = trim($_POST['message'] ?? '');
$honey   = trim($_POST['website'] ?? ''); // honeypot: real users leave this empty

// --- Anti-spam honeypot: if filled, silently "succeed" and drop it ---
if ($honey !== '') {
    respond(true, 'Thanks! Your message has been sent.');
}

// --- Validation ---
if ($name === '' || $email === '' || $message === '') {
    respond(false, 'Please fill in your name, email, and message.', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please enter a valid email address.', 422);
}
if (mb_strlen($message) > 5000) {
    respond(false, 'Your message is too long.', 422);
}

// --- Send the email ---
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = $config['SMTP_HOST'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['SMTP_USER'];
    $mail->Password   = $config['SMTP_PASS'];
    $mail->SMTPSecure = $config['SMTP_SECURE'];
    $mail->Port       = (int) $config['SMTP_PORT'];
    $mail->CharSet    = 'UTF-8';

    // From must be your own mailbox (SMTP won't let you send "as" the visitor)
    $mail->setFrom($config['SMTP_USER'], 'Website Contact Form');
    $mail->addAddress($config['MAIL_TO'], $config['MAIL_TO_NAME']);

    // Reply-To = the visitor, so hitting "Reply" answers them directly
    $mail->addReplyTo($email, $name);

    $mail->Subject = 'New contact form message from ' . $name;

    $safeName    = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $safeEmail   = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
    $safePhone   = htmlspecialchars($phone !== '' ? $phone : 'Not provided', ENT_QUOTES, 'UTF-8');
    $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));

    $mail->isHTML(true);
    $mail->Body =
        "<h2>New contact form message</h2>" .
        "<p><strong>Name:</strong> {$safeName}</p>" .
        "<p><strong>Email:</strong> {$safeEmail}</p>" .
        "<p><strong>Phone:</strong> {$safePhone}</p>" .
        "<p><strong>Message:</strong></p><p>{$safeMessage}</p>";
    $mail->AltBody =
        "New contact form message\n\n" .
        "Name: {$name}\nEmail: {$email}\nPhone: " . ($phone !== '' ? $phone : 'Not provided') .
        "\n\nMessage:\n{$message}";

    $mail->send();
    respond(true, 'Thanks! Your message has been sent.');
} catch (Exception $e) {
    // Don't leak SMTP details to the visitor
    respond(false, 'Sorry, something went wrong sending your message. Please try again later.', 500);
}
