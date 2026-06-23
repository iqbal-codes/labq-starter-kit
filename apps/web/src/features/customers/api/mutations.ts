import { orpc } from "../../../runtime";

export function createCustomerMutation() {
  return orpc.operations.customers.create.mutationOptions();
}

export function updateCustomerMutation() {
  return orpc.operations.customers.update.mutationOptions();
}

export function softDeleteCustomerMutation() {
  return orpc.operations.customers.softDelete.mutationOptions();
}

export function deleteCustomerAvatarMutation() {
  return orpc.operations.customers.avatar.delete.mutationOptions();
}
