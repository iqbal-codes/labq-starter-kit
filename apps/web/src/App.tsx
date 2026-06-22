import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./providers/auth-provider";
import { ProtectedRoute } from "./components/protected-route";
import { OrganizationRoute } from "./components/organization-route";
import { SignInPage } from "./pages/auth/sign-in";
import { SignUpPage } from "./pages/auth/sign-up";
import { OnboardingPage } from "./pages/onboarding";
import { ShellHomePage } from "./pages/dashboard";
import { SettingsOrganizationPage } from "./pages/settings/organization";
import { DashboardLayout } from "./components/layout/dashboard-layout";
import { OverviewPage } from "./pages/overview";
import { CustomersPage } from "./pages/customers";
import { ServicesPage } from "./pages/services";
import { OrdersPage } from "./pages/orders";

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth/sign-in" element={<SignInPage />} />
        <Route path="/auth/sign-up" element={<SignUpPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<OrganizationRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<ShellHomePage />} />
              <Route path="/settings/organization" element={<SettingsOrganizationPage />} />
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/orders" element={<OrdersPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
