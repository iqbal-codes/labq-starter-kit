import { Building2, ChevronsUpDown, Check, Plus } from "lucide-react";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@labq-modules/ui/components/sidebar";
import { cn } from "@labq-modules/ui/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@labq-modules/ui/components/dropdown-menu";
import { useOrganization } from "../../../hooks/use-organization";
import { authClient } from "../../../lib/auth-client";

export function SidebarBrand() {
  const { organization, isLoading: isOrgLoading } = useOrganization();
  const { data: organizations, isLoading: isListLoading } =
    authClient.useListOrganizations();

  const currentOrgName = organization?.name;
  const isLoading = isOrgLoading || isListLoading;

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === organization?.id) return;
    await authClient.organization.setActive({ organizationId: orgId });
    window.location.href = "/overview";
  };

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              data-testid="sidebar-org-selector"
              className={cn(
                "flex w-full items-center gap-2 overflow-hidden rounded-xl px-3 py-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                "h-12 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
              )}
            >
              <Building2 className="size-5 shrink-0" />
              <span className="truncate font-semibold">
                {isLoading
                  ? "Loading organization"
                  : currentOrgName || "No organization"}
              </span>
              <ChevronsUpDown className="ml-auto size-5 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side="bottom"
              align="start"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                {isListLoading ? (
                  <DropdownMenuItem disabled>Loading organizations</DropdownMenuItem>
                ) : organizations && organizations.length > 0 ? (
                  organizations.map((org: { id: string; name: string }) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => handleSwitchOrg(org.id)}
                    >
                      <span className="truncate">{org.name}</span>
                      {org.id === organization?.id && (
                        <Check className="ml-auto size-4 shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No organizations found</DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { window.location.href = "/onboarding"; }}>
                <Plus className="size-4 shrink-0" />
                Create organization
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
