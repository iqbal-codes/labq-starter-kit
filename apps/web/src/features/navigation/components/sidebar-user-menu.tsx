import { useNavigate } from "react-router-dom";
import { Building2, ChevronsUpDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@labq-modules/ui/components/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@labq-modules/ui/components/avatar";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@labq-modules/ui/components/sidebar";

interface SidebarUserMenuProps {
  user: { name?: string; email?: string; image?: string } | null;
  onSignOut: () => void;
}

function UserIdentity({
  user,
  compact,
}: {
  user: { name?: string; email?: string; image?: string } | null;
  compact?: boolean;
}) {
  return (
    <>
      <Avatar className={compact ? "size-8 rounded-lg" : "h-10 w-10 rounded-lg"}>
        <AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
        <AvatarFallback className="rounded-lg">
          {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-base leading-tight">
        <span className="truncate font-semibold">{user?.name ?? "User"}</span>
        <span className="text-muted-foreground truncate text-sm">{user?.email ?? ""}</span>
      </div>
    </>
  );
}

export function SidebarUserMenu({ user, onSignOut }: SidebarUserMenuProps) {
  const navigate = useNavigate();

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                />
              }
            >
              <UserIdentity user={user} compact />
              <ChevronsUpDown className="ml-auto size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserIdentity user={user} />
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate("/settings/organization")}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Organization
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
