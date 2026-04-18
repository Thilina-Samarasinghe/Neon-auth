import { PrismaClient } from '@prisma/client';
import { sendEmail } from './src/lib/email.js'; // Note context

const prisma = new PrismaClient();

async function check() {
  const email = "a86935001@smtp-brevo.com";
  const user = await prisma.user.findUnique({ where: { email } });
  console.log("User:", user);
  
  if (user) {
    console.log("Attempting to send email...");
    const res = await sendEmail({ to: email, subject: "Test", html: "test" });
    console.log("Email sent?", res);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
