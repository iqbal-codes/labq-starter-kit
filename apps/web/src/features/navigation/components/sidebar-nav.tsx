import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Settings,
  Users,
  Building2,
  Handshake,
  Package,
  MapPin,
  ArrowLeftRight,
  UserCheck,
  GitBranch,
  type LucideIcon,
} from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@labq-modules/ui/components/sidebar";
import type { NavItem } from "../../../types/nav";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Briefcase,
  Settings,
  Users,
  Building2,
  Handshake,
  Package,
  MapPin,
  ArrowLeftRight,
  UserCheck,
  GitBranch,
};

interface SidebarNavProps {
  navItems: NavItem[];
}

export function SidebarNav({ navItems }: SidebarNavProps) {
  const location = useLocation();

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          {navItems.map((item) => {
            const iconName = item.icon ?? "Briefcase";
            const Icon = iconMap[iconName] ?? Briefcase;
            const isActive =
              item.url === "/crm" || item.url === "/inventory"
                ? location.pathname === item.url
                : location.pathname.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  isActive={isActive}
                  render={
                    <Link to={item.url}>
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}
