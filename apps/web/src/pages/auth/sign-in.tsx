import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import {
  useAppForm,
  useFormFields,
  FormErrors,
} from "@admin-template/ui/components/forms/use-form-hooks";
import { useAuth } from "../../providers/auth-provider";
import { useAuthRedirect } from "../../hooks/use-auth-redirect";
import { AuthFormLayout } from "../../components/auth/auth-form-layout";
import { CardContent } from "@admin-template/ui/components/card";

const signInSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInPage() {
  const { signIn } = useAuth();
  useAuthRedirect();

  const form = useAppForm({
    defaultValues: { email: "", password: "" } as SignInValues,
    validators: { onSubmit: signInSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        const { error } = await signIn.email({
          email: value.email,
          password: value.password,
        });
        if (error) {
          const message =
            error.status === 403
              ? "Please verify your email before signing in"
              : error.message || "Sign-in failed. Please try again.";
          formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
          toast.error(message);
        }
      } catch (err) {
        const message = "An unexpected error occurred. Please try again.";
        formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
        toast.error(message);
      }
    },
  });

  const { FormTextField } = useFormFields<SignInValues>();

  return (
    <AuthFormLayout
      title="Welcome back"
      description="Sign in to your workspace"
      footer={
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/auth/sign-up" className="text-primary underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      }
    >
      <form.AppForm>
        <form.Form>
          <CardContent className="space-y-4">
            <FormErrors />
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
            <form.SubmitButton className="w-full">Sign in</form.SubmitButton>
          </CardContent>
        </form.Form>
      </form.AppForm>
    </AuthFormLayout>
  );
}
