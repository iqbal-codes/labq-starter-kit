import { orpc } from "../../../runtime";

export function createServiceMutation() {
  return orpc.operations.services.create.mutationOptions();
}

export function updateServiceMutation() {
  return orpc.operations.services.update.mutationOptions();
}

export function softDeleteServiceMutation() {
  return orpc.operations.services.softDelete.mutationOptions();
}

export function deleteServicePhotoMutation() {
  return orpc.operations.services.photos.delete.mutationOptions();
}
