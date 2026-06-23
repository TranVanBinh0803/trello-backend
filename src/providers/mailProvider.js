import nodemailer from "nodemailer";

const createTransport = () => {
  if (!process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
  });
};

export const sendResetPasswordOtpEmail = async ({ to, otp }) => {
  const transporter = createTransport();
  const from =
    process.env.SMTP_FROM || "Trello Clone <no-reply@trello-clone.local>";
  if (!process.env.SMTP_HOST) {
    console.log(`[mailProvider] Reset password OTP for ${to}: ${otp}`);
  }

  return await transporter.sendMail({
    from,
    to,
    subject: "Reset your Trello Clone password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Reset your password</h2>
        <p>Use this OTP to set a new password. It expires in 15 minutes.</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
        <p>If you did not request a password reset, you can ignore this email.</p>
      </div>
    `,
  });
};
