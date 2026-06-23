import { resend, FROM_EMAIL } from "./client";
import { VerificationEmail } from "./templates/verification";
import { ContactInquiryEmail } from "./templates/contact-inquiry";

interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  react?: React.ReactElement;
}

export async function sendEmail({ to, subject, html, react }: SendEmailOptions) {
  if (!resend) {
    console.warn("Resend not configured — skipping email send. Set RESEND_API_KEY in .env");
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject,
    html,
    react,
  });

  if (error) {
    console.error("Email send error:", error);
    throw error;
  }

  return data;
}

export async function sendVerificationEmail(email: string, name: string, url: string) {
  return sendEmail({
    to: email,
    subject: "Verify your email address",
    react: VerificationEmail({ name, url }),
  });
}

interface ContactInquiryEmailData {
  org: string;
  name: string;
  email: string;
  company?: string;
  service?: string;
  message: string;
}

export async function sendContactInquiryEmail(data: ContactInquiryEmailData, to: string) {
  return sendEmail({
    to,
    subject: `[LabQ Inquiry] ${data.org} — ${data.name}`,
    react: ContactInquiryEmail(data),
  });
}

export { VerificationEmail } from "./templates/verification";
export { ContactInquiryEmail } from "./templates/contact-inquiry";
export { resend, FROM_EMAIL } from "./client";
