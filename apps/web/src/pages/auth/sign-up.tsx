import { Link } from "react-router-dom";
import { z } from "zod";
import { useAppForm, useFormFields } from "@labq-modules/ui/components/forms/use-form-hooks";
import { useAuth } from "../../providers/auth-provider";
import { useAuthRedirect } from "../../hooks/use-auth-redirect";
import { AuthFormLayout } from "../../components/auth/auth-form-layout";
import { CardContent } from "@labq-modules/ui/components/card";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpPage() {
  const { signUp } = useAuth();
  useAuthRedirect();

  const form = useAppForm({
    defaultValues: { name: "", email: "", password: "" } as SignUpValues,
    validators: { onSubmit: signUpSchema },
    onSubmit: async ({ value }) => {
      await signUp.email({ name: value.name, email: value.email, password: value.password });
    },
  });

  const { FormTextField } = useFormFields<SignUpValues>();

  return (
    <AuthFormLayout
      title="Create an account"
      description="Start using LabQ Modules"
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/sign-in" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form.AppForm>
        <form.Form>
          <CardContent className="space-y-4">
            <FormTextField name="name" label="Name" placeholder="Your name" required />
            <FormTextField
              name="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              required
            />
            <FormTextField
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              required
            />
            <form.SubmitButton className="w-full">Create account</form.SubmitButton>
          </CardContent>
        </form.Form>
      </form.AppForm>
    </AuthFormLayout>
  );
}
