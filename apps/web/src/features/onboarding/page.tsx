import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAppForm, useFormFields } from "@labq-modules/ui/components/forms/use-form-hooks";
import { scrollToFirstError } from "@labq-modules/ui/components/forms/tanstack-form";
import { createOrganizationSchema } from "@labq-modules/schemas";
import type { CreateOrganizationInput } from "@labq-modules/schemas";
import { AuthFormLayout } from "../../components/auth/auth-form-layout";
import { CardContent } from "@labq-modules/ui/components/card";
import { authClient } from "../../lib/auth-client";
import { orpc } from "../../runtime";

export function OnboardingPage() {

  const createOrg = useMutation(
    orpc.organization.create.mutationOptions({
      onSuccess: async (result) => {
        try {
          await authClient.organization.setActive({
            organizationId: result.organization.id,
          });
          toast.success("Organization created");
          // Reload to pick up new session with active org
          window.location.href = "/overview";
        } catch {
          toast.error("Organization created but failed to activate. Please refresh.");
        }
      },
      onError: () => {
        toast.error("Unable to create organization");
      },
    }),
  );

  const form = useAppForm({
    defaultValues: { name: "" } as CreateOrganizationInput,
    validators: { onSubmit: createOrganizationSchema },
    onSubmitInvalid: () => scrollToFirstError(),
    onSubmit: async ({ value }) => {
      await createOrg.mutateAsync(value);
    },
  });

  const { FormTextField } = useFormFields<CreateOrganizationInput>();

  return (
    <AuthFormLayout
      title="Create your organization"
      description="Set up a workspace to get started"
      footer={null}
    >
      <form.AppForm>
        <form.Form>
          <CardContent className="space-y-4">
            <FormTextField
              name="name"
              label="Organization name"
              placeholder="Acme Labs"
              required
            />
            <form.SubmitButton className="w-full" disabled={createOrg.isPending}>
              {createOrg.isPending ? "Creating..." : "Create organization"}
            </form.SubmitButton>
          </CardContent>
        </form.Form>
      </form.AppForm>
    </AuthFormLayout>
  );
}
