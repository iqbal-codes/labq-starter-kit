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
    onSubmit: async ({ value, formApi }) => {
      try {
        const { error } = await signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
        });
        if (error) {
          const message =
            error.code === "USER_ALREADY_EXISTS"
              ? "An account with this email already exists"
              : error.status === 403
                ? "Please verify your email to continue"
                : error.message || "Sign-up failed. Please try again.";
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

  const { FormTextField } = useFormFields<SignUpValues>();

  return (
    <AuthFormLayout
      title="Create an account"
      description="Start using Admin App Template"
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
            <FormErrors />
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
