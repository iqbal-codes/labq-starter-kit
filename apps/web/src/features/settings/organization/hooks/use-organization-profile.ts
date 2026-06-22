import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateOrganizationProfileMutation } from "../../../organization/api/mutations";

export function useOrganizationProfile(organizationName: string) {
  const [name, setName] = useState(organizationName);

  const updateProfile = useMutation({
    ...updateOrganizationProfileMutation(),
    onSuccess: () => {
      toast.success("Organization updated");
    },
  });

  return { name, setName, updateProfile };
}
