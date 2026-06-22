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
import { OverviewPage } from "./pages/crm-overview";
import { LeadsPage } from "./pages/leads";
import { LeadDetailPage } from "./pages/lead-detail";
import { ContactsPage } from "./pages/contacts";
import { ContactDetailPage } from "./pages/contact-detail";
import { CompaniesPage } from "./pages/companies";
import { CompanyDetailPage } from "./pages/company-detail";
import { DealsPage } from "./pages/deals";
import { DealDetailPage } from "./pages/deal-detail";
import { PipelinePage } from "./pages/pipeline";

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
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/leads/:id" element={<LeadDetailPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/contacts/:id" element={<ContactDetailPage />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/companies/:id" element={<CompanyDetailPage />} />
              <Route path="/deals" element={<DealsPage />} />
              <Route path="/deals/:id" element={<DealDetailPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
