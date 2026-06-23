"use client";

import { useMemo, useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

type ContactResponse = {
  success: boolean;
  message?: string;
  error?: string;
  fallbackEmail?: string | null;
};

const SERVICE_OPTIONS = [
  "Consulting",
  "Analytics",
  "Strategy",
  "Engineering",
  "Design",
  "Other / not sure",
] as const;

const PUBLIC_ORG_SLUG = import.meta.env.PUBLIC_ORG_SLUG || "";
const CONTACT_API_URL = `${import.meta.env.PUBLIC_API_BASE || ""}/api/storefront/contact`;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [fallbackEmail, setFallbackEmail] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const formUnavailable = PUBLIC_ORG_SLUG.length === 0;

  const mailtoHref = useMemo(() => {
    if (!fallbackEmail) return null;

    const subject = encodeURIComponent(service ? `LabQ inquiry — ${service}` : "LabQ inquiry");
    const body = encodeURIComponent(
      [
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        company.trim() ? `Company: ${company.trim()}` : null,
        service ? `Service area: ${service}` : null,
        "",
        message.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    );

    return `mailto:${fallbackEmail}?subject=${subject}&body=${body}`;
  }, [company, email, fallbackEmail, message, name, service]);

  function blur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (formUnavailable) {
      next.form = "Contact form is unavailable right now.";
    }

    if (!name.trim()) next.name = "Please enter your name.";
    else if (name.trim().length > 100) next.name = "Keep it under 100 characters.";

    if (!email.trim()) next.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Please enter a valid email address.";
    }

    if (company.trim().length > 200) next.company = "Keep it under 200 characters.";

    if (service && !SERVICE_OPTIONS.includes(service as (typeof SERVICE_OPTIONS)[number])) {
      next.service = "Please choose a valid service area.";
    }

    if (!message.trim()) next.message = "Please enter a message.";
    else if (message.trim().length > 2000) next.message = "Keep it under 2,000 characters.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submitForm() {
    setServerError(null);
    setFallbackEmail(null);

    setTouched({
      name: true,
      email: true,
      company: true,
      service: true,
      message: true,
      form: true,
    });

    if (!validate()) return;

    setSubmitState("submitting");

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org: PUBLIC_ORG_SLUG,
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          service: service || undefined,
          message: message.trim(),
        }),
      });

      const body = (await response.json().catch(() => null)) as ContactResponse | null;

      if (!response.ok || !body?.success) {
        setFallbackEmail(body?.fallbackEmail ?? null);
        setServerError(body?.error || `Something went wrong (status ${response.status}).`);
        setSubmitState("error");
        return;
      }

      setSubmitState("success");
    } catch {
      setServerError("We couldn't send your message right now. Please try again shortly.");
      setSubmitState("error");
    }
  }

  if (submitState === "success") {
    return (
      <div id="contact-form" className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-7 w-7 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">Message sent.</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            We&apos;ve received your inquiry and will be in touch within one business day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="contact-form" className="rounded-3xl border border-border bg-card p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-foreground">Start with a quick note</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Tell us what you&apos;re working on, your timeline, and the kind of outcome you need.
      </p>

      {(serverError || errors.form) && (
        <div
          className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          role="alert"
        >
          {serverError || errors.form}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submitForm();
        }}
        className="mt-6 space-y-4"
        noValidate
      >
        <div>
          <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-foreground">
            Full name <span className="text-destructive">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => blur("name")}
            placeholder="Jane Doe"
            aria-invalid={touched.name && !!errors.name}
            aria-describedby={errors.name ? "error-name" : undefined}
            disabled={submitState === "submitting" || formUnavailable}
            className={`h-11 w-full rounded-3xl border bg-input/50 px-4 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 ${
              touched.name && errors.name ? "border-destructive" : "border-border"
            }`}
          />
          {touched.name && errors.name && (
            <p id="error-name" className="mt-1 text-xs text-destructive" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-foreground">
            Work email <span className="text-destructive">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => blur("email")}
            placeholder="jane@company.com"
            aria-invalid={touched.email && !!errors.email}
            aria-describedby={errors.email ? "error-email" : undefined}
            disabled={submitState === "submitting" || formUnavailable}
            className={`h-11 w-full rounded-3xl border bg-input/50 px-4 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 ${
              touched.email && errors.email ? "border-destructive" : "border-border"
            }`}
          />
          {touched.email && errors.email && (
            <p id="error-email" className="mt-1 text-xs text-destructive" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-company"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Company
          </label>
          <input
            id="contact-company"
            type="text"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            onBlur={() => blur("company")}
            placeholder="Company (optional)"
            aria-invalid={touched.company && !!errors.company}
            aria-describedby={errors.company ? "error-company" : undefined}
            disabled={submitState === "submitting" || formUnavailable}
            className={`h-11 w-full rounded-3xl border bg-input/50 px-4 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 ${
              touched.company && errors.company ? "border-destructive" : "border-border"
            }`}
          />
          {touched.company && errors.company && (
            <p id="error-company" className="mt-1 text-xs text-destructive" role="alert">
              {errors.company}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-service"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Service area
          </label>
          <select
            id="contact-service"
            value={service}
            onChange={(event) => setService(event.target.value)}
            onBlur={() => blur("service")}
            aria-invalid={touched.service && !!errors.service}
            aria-describedby={errors.service ? "error-service" : undefined}
            disabled={submitState === "submitting" || formUnavailable}
            className={`h-11 w-full appearance-none rounded-3xl border bg-input/50 px-4 text-sm text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 ${
              touched.service && errors.service ? "border-destructive" : "border-border"
            } ${!service ? "text-muted-foreground" : ""}`}
          >
            <option value="">Select a service area (optional)</option>
            {SERVICE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {touched.service && errors.service && (
            <p id="error-service" className="mt-1 text-xs text-destructive" role="alert">
              {errors.service}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            What are you working on? <span className="text-destructive">*</span>
          </label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onBlur={() => blur("message")}
            placeholder="Tell us about your project, timeline, and the outcome you need…"
            aria-invalid={touched.message && !!errors.message}
            aria-describedby={errors.message ? "error-message" : undefined}
            disabled={submitState === "submitting" || formUnavailable}
            className={`w-full rounded-3xl border bg-input/50 px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 ${
              touched.message && errors.message ? "border-destructive" : "border-border"
            }`}
          />
          {touched.message && errors.message && (
            <p id="error-message" className="mt-1 text-xs text-destructive" role="alert">
              {errors.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitState === "submitting" || formUnavailable}
          className="inline-flex h-11 items-center justify-center rounded-4xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitState === "submitting" ? "Sending…" : "Send message"}
        </button>

        {mailtoHref && (
          <a
            href={mailtoHref}
            className="inline-flex h-11 items-center rounded-4xl border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Email us instead
          </a>
        )}

        <p className="text-xs text-muted-foreground">We&apos;ll respond within one business day.</p>
      </form>
    </div>
  );
}
