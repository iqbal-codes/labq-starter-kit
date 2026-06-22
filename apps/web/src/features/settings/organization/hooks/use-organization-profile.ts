import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../../../../runtime";
import { toast } from "sonner";

export function useOrganizationProfile(organizationName: string) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(organizationName);

  const updateProfile = useMutation({
    mutationFn: (data: { name: string }) =>
      (orpc.organization.updateProfile as any).mutateAsync(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orpc.organization.getContext.queryKey() });
      toast.success("Organization updated");
    },
  });

  return { name, setName, updateProfile };
}
