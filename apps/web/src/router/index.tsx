import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { CorporatesPage } from "@/pages/corporates/CorporatesPage";
import { CorporateFormPage } from "@/pages/corporates/CorporateFormPage";
import { ProgrammesPage } from "@/pages/programmes/ProgrammesPage";
import { ProgrammeFormPage } from "@/pages/programmes/ProgrammeFormPage";
import { FormBuilderPage } from "@/pages/programmes/FormBuilderPage";
import { SubmissionsPage } from "@/pages/submissions/SubmissionsPage";
import { SubmissionDetailPage } from "@/pages/submissions/SubmissionDetailPage";
import { ExportsPage } from "@/pages/ExportsPage";
import { OnboardingLinksPage } from "@/pages/OnboardingLinksPage";
import { AuditLogsPage } from "@/pages/AuditLogsPage";
import { UsersPage } from "@/pages/UsersPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { OnboardingPage } from "@/pages/onboarding/OnboardingPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  // Public, unauthenticated onboarding flow (secure link token).
  { path: "/onboarding/:token", element: <OnboardingPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/corporates", element: <CorporatesPage /> },
          { path: "/corporates/new", element: <CorporateFormPage /> },
          { path: "/corporates/:id/edit", element: <CorporateFormPage /> },
          { path: "/programmes", element: <ProgrammesPage /> },
          { path: "/programmes/new", element: <ProgrammeFormPage /> },
          { path: "/programmes/:id/edit", element: <ProgrammeFormPage /> },
          { path: "/programmes/:id/builder", element: <FormBuilderPage /> },
          { path: "/form-builder", element: <Navigate to="/programmes" replace /> },
          { path: "/onboarding-links", element: <OnboardingLinksPage /> },
          { path: "/submissions", element: <SubmissionsPage /> },
          { path: "/submissions/:id", element: <SubmissionDetailPage /> },
          { path: "/documents", element: <SubmissionsPage /> },
          { path: "/exports", element: <ExportsPage /> },
          { path: "/users", element: <UsersPage /> },
          { path: "/audit-logs", element: <AuditLogsPage /> },
          { path: "/settings", element: <PlaceholderPage title="Settings" phase="a later iteration" /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
