import { OPERATIONS_NAV } from "../config/nav-config";
import type { NavItem } from "../types/nav";

export function useSidebarNav(): NavItem[] {
  return OPERATIONS_NAV;
}
