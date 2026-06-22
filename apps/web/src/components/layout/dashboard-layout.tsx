import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@labq-modules/ui/components/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Header } from "./header";
import { AssistantButton } from "../../features/assistant/components/assistant-button";

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </SidebarInset>
      <AssistantButton />
    </SidebarProvider>
  );
}
