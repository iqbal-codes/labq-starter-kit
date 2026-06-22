import { orpc } from "../../../runtime";

export function createOrderMutation() {
  return orpc.operations.orders.create.mutationOptions();
}

export function updateOrderMutation() {
  return orpc.operations.orders.update.mutationOptions();
}

export function softDeleteOrderMutation() {
  return orpc.operations.orders.softDelete.mutationOptions();
}
