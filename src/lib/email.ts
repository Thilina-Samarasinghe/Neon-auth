import nodemailer from "nodemailer";

// Cache the transporter so we don't create multiple connections in Next.js development
const globalForNodemailer = globalThis as unknown as { transporter: nodemailer.Transporter | undefined };

export const getTransporter = () => {
  if (globalForNodemailer.transporter) {
    return globalForNodemailer.transporter;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    secure: Number(process.env.SMTP_PORT) === 465, // SSL for 465, TLS for 587
    pool: true, // Re-use the same connection instead of spinning up a new one every time
    maxConnections: 5,
    maxMessages: 100,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForNodemailer.transporter = transporter;
  }

  return transporter;
};

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("Missing SMTP credentials in explicitly loaded environment.");
      return false;
    }

    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: "Thilina <thilina.bandara623@gmail.com>",
      to,
      subject,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
