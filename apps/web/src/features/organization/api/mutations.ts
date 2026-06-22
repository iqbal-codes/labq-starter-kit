import { orpc } from "../../../runtime";

export function updateOrganizationProfileMutation() {
  return orpc.organization.updateProfile.mutationOptions();
}
