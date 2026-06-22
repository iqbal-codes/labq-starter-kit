import { Navigate, Outlet } from "react-router-dom";
import { useOrganization } from "../hooks/use-organization";

export function OrganizationRoute() {
  const { organization, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!organization) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
