"use client";

import { Calendar, Clock } from "lucide-react";
import { Card, Button } from "../ui";

interface BookingWidgetInlineProps {
  slug: string;
  title: string;
  price: string;
  duration: string;
  priceCents?: number | null;
}

export function BookingWidgetInline({ price, duration, priceCents }: BookingWidgetInlineProps) {
  const bookingHref = "/contact#contact-form";
  const isCustomPrice = priceCents === null || priceCents === undefined;

  return (
    <Card className="p-6">
      <p className="text-2xl font-bold text-foreground">{price}</p>
      <p className="mt-1 text-sm text-muted-foreground">Estimated duration: {duration}</p>

      <div className="mt-6 space-y-3">
        <Button href={bookingHref} variant="primary" className="w-full">
          Book Appointment
        </Button>

        {isCustomPrice && (
          <p className="rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground text-center">
            Contact us to receive a tailored quote for this engagement.
          </p>
        )}
      </div>

      <div className="mt-6 space-y-2 text-sm text-muted-foreground border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" />
          <span>{duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="size-4 shrink-0" />
          <span>Available this week</span>
        </div>
      </div>
    </Card>
  );
}
