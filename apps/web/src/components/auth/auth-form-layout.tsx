import { type ReactNode } from "react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@admin-template/ui/components/card";

interface AuthFormLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthFormLayout({ title, description, children, footer }: AuthFormLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children}
        <CardFooter className="flex flex-col gap-4">{footer}</CardFooter>
      </Card>
    </div>
  );
}
