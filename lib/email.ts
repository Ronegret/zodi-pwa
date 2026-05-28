import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "zodi.elcrack@gmail.com",
    pass: process.env.EMAIL_APP_PASSWORD || "", // Gmail App Password
  },
});

export async function sendZodiEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.EMAIL_APP_PASSWORD) {
    console.warn("ZODI Email skipped: EMAIL_APP_PASSWORD not configured.");
    return false;
  }

  try {
    await transporter.sendMail({
      from: '"ZODI" <zodi.elcrack@gmail.com>',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Error sending ZODI email:", error);
    return false;
  }
}
