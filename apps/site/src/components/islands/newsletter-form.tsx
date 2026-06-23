"use client";

import { useState } from "react";
import { Button, Input } from "../ui";

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
        <Input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-10 min-w-0 flex-1"
        />
        <Button type="submit" variant="primary" size="sm" className="h-10 px-5 shrink-0">
          Email us
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        We’ll open your email client so you can confirm the subscription request.
      </p>
    </form>
  );
}
