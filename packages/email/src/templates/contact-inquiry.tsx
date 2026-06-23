// @jsxImportSource react
import { Html, Head, Body, Container, Text, Link, Hr } from "@react-email/components";

interface ContactInquiryEmailProps {
  org: string;
  name: string;
  email: string;
  company?: string;
  service?: string;
  message: string;
}

export function ContactInquiryEmail({
  org,
  name,
  email,
  company,
  service,
  message,
}: ContactInquiryEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>New Contact Inquiry</Text>

          <Text style={label}>From</Text>
          <Text style={value}>
            {name} &lt;
            <Link href={`mailto:${email}`} style={link}>
              {email}
            </Link>
            &gt;
          </Text>

          <Text style={label}>Organization</Text>
          <Text style={value}>{org}</Text>

          {company ? (
            <>
              <Text style={label}>Company</Text>
              <Text style={value}>{company}</Text>
            </>
          ) : null}

          {service ? (
            <>
              <Text style={label}>Service Interest</Text>
              <Text style={value}>{service}</Text>
            </>
          ) : null}

          <Hr style={hr} />

          <Text style={label}>Message</Text>
          <Text style={messageBlock}>{message}</Text>

          <Hr style={hr} />

          <Text style={footer}>
            This inquiry was submitted via the LabQ storefront contact form.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f5f5f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
};

const heading = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#1a1a1a",
  margin: "0 0 24px",
};

const label = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "16px 0 4px",
};

const value = {
  fontSize: "15px",
  color: "#1a1a1a",
  margin: "0",
};

const messageBlock = {
  fontSize: "15px",
  color: "#1a1a1a",
  lineHeight: "1.6",
  whiteSpace: "pre-wrap" as const,
  margin: "0",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};

const hr = {
  border: "none",
  borderTop: "1px solid #e5e7eb",
  margin: "20px 0",
};

const footer = {
  fontSize: "13px",
  color: "#9ca3af",
  margin: "0",
};
