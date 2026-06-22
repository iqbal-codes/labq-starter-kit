// @jsxImportSource react
import { Html, Head, Body, Container, Text, Link, Button, Hr, Img } from "@react-email/components";

interface VerificationEmailProps {
  name: string;
  url: string;
}

export function VerificationEmail({ name, url }: VerificationEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://labq.dev/logo.png"
            width="120"
            height="40"
            alt="Admin App Template"
            style={logo}
          />
          <Text style={heading}>Verify your email address</Text>
          <Text style={paragraph}>Hi {name},</Text>
          <Text style={paragraph}>
            Thanks for signing up! Please verify your email address to get started.
          </Text>
          <Container style={buttonContainer}>
            <Button href={url} style={button}>
              Verify Email Address
            </Button>
          </Container>
          <Text style={paragraph}>
            If the button doesn't work, copy and paste this link into your browser:
          </Text>
          <Link href={url} style={link}>
            {url}
          </Link>
          <Hr style={hr} />
          <Text style={footer}>
            If you didn't create an account, you can safely ignore this email.
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

const logo = {
  display: "block",
  margin: "0 auto 32px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#1a1a1a",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#4a4a4a",
  margin: "0 0 16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#000000",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  borderRadius: "6px",
};

const link = {
  fontSize: "14px",
  color: "#0066cc",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "32px 0",
};

const footer = {
  fontSize: "14px",
  color: "#6b7280",
  textAlign: "center" as const,
  margin: "0",
};
