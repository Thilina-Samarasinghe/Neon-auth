import nodemailer from 'nodemailer';

// Test with port 465 (SSL) since port 587 is blocked
const config = {
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: process.env.SMTP_PORT || 465,
  user: process.env.SMTP_USER || "your-email@example.com",
  pass: process.env.SMTP_PASS || "your-secret-key",
};

console.log("=== SMTP Email Test (Port 465 SSL) ===");
console.log("Host:", config.host);
console.log("Port:", config.port);
console.log("");

const transporter = nodemailer.createTransport({
  host: config.host,
  port: config.port,
  secure: true, // SSL for port 465
  auth: {
    user: config.user,
    pass: config.pass,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  logger: true,
  debug: true,
});

console.log("Step 1: Verifying SMTP connection...");
transporter.verify()
  .then(() => {
    console.log("✅ SMTP connection verified!");
    console.log("Step 2: Sending test email...");
    return transporter.sendMail({
      from: '"Test" <a86935001@smtp-brevo.com>',
      to: "a86935001@smtp-brevo.com",
      subject: "Test Email - " + new Date().toISOString(),
      html: "<h1>SMTP is working!</h1><p>Test at " + new Date().toISOString() + "</p>",
    });
  })
  .then((info) => {
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
  })
  .catch((err) => {
    console.error("❌ FAILED:", err.message);
    console.error("Error code:", err.code);
  });
