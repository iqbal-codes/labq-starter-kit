"use client";

import { Calendar, Clock } from "lucide-react";
import { formatPrice } from "../../lib/format";
import type { Service } from "../../data/services";
import { Card, Button } from "../ui";

interface BookingWidgetProps {
  service: Service;
}

export function BookingWidget({ service }: BookingWidgetProps) {
  const bookingHref = "/contact#contact-form";

  return (
    <Card className="sticky top-24 p-6">
      <div className="mb-4">
        <p className="text-2xl font-bold text-foreground">
          {service.priceCents === null ? "Contact us for pricing" : formatPrice(service.priceCents)}
        </p>
      </div>

      <div className="mb-6 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" />
          <span>{service.durationLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="size-4 shrink-0" />
          <span>Available this week</span>
        </div>
      </div>

      <Button href={bookingHref} variant="primary" className="w-full">
        Book Appointment
      </Button>
    </Card>
  );
}
