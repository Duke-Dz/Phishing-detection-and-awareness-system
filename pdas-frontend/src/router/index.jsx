import { Routes, Route } from "react-router-dom";

// Auth pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";

// Public pages
import Unsubscribe from "../pages/Unsubscribe.jsx";
import PrivacyPolicy from "../pages/PrivacyPolicy.jsx";
import NotFound from "../pages/NotFound.jsx";
import Maintenance from "../pages/Maintenance.jsx";

// Route guard
import { RoleRoute } from "../components/auth/RoleRoute";

const AppRouter = () => {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <RoleRoute allowedRoles={["user", "analyst", "admin"]}>
            <div className="flex min-h-screen items-center justify-center bg-cyber-900">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">User Dashboard</h1>
                <p className="mt-2 text-slate-400">Coming soon</p>
              </div>
            </div>
          </RoleRoute>
        }
      />
      <Route
        path="/analyst/*"
        element={
          <RoleRoute allowedRoles={["analyst", "admin"]}>
            <div className="flex min-h-screen items-center justify-center bg-cyber-900">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">Analyst Dashboard</h1>
                <p className="mt-2 text-slate-400">Coming soon</p>
              </div>
            </div>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <RoleRoute allowedRoles={["admin"]}>
            <div className="flex min-h-screen items-center justify-center bg-cyber-900">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="mt-2 text-slate-400">Coming soon</p>
              </div>
            </div>
          </RoleRoute>
        }
      />

      {/* Public routes */}
      <Route path="/unsubscribe" element={<Unsubscribe />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/maintenance" element={<Maintenance />} />

      {/* Default & 404 */}
      <Route path="/" element={<LoginPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
