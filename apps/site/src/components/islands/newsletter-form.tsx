"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!email) return;

        window.location.assign(
          `mailto:hello@labq.example?subject=${encodeURIComponent(
            "Newsletter subscription",
          )}&body=${encodeURIComponent(`Please subscribe this email to LabQ updates: ${email}`)}`,
        );
      }}
      className="space-y-2"
    >
      <div className="flex gap-3">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-10 min-w-0 flex-1 rounded-3xl border border-transparent bg-input/50 px-4 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center rounded-4xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Email us
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        We’ll open your email client so you can confirm the subscription request.
      </p>
    </form>
  );
}
