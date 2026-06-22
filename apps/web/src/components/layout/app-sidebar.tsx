import { Sidebar, SidebarRail } from "@labq-modules/ui/components/sidebar";
import { SidebarBrand } from "../../features/navigation/components/sidebar-brand";
import { SidebarNav } from "../../features/navigation/components/sidebar-nav";
import { SidebarUserMenu } from "../../features/navigation/components/sidebar-user-menu";
import { useSidebarNav } from "../../hooks/use-nav";
import { useAuth } from "../../providers/auth-provider";

export function AppSidebar() {
  const { session, signOut } = useAuth();
  const navItems = useSidebarNav();
  const user =
    (session as { user?: { name?: string; email?: string; image?: string } } | null)?.user ?? null;

  return (
    <Sidebar collapsible="icon">
      <SidebarBrand />
      <SidebarNav navItems={navItems} />
      <SidebarUserMenu user={user} onSignOut={signOut} />
      <SidebarRail />
    </Sidebar>
  );
}
